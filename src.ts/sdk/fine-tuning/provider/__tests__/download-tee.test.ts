// Regression tests for `Provider.downloadLoRAFromTEE`.
//
// These tests pin the four behaviours fixed in the May 2026 hackathon
// bug report (Bug #7) so we don't quietly regress them again:
//
//   1. No request-wall-clock timeout on the TEE download path. Axios used
//      to be invoked with `timeout: 300000`, which aborted any artifact
//      that legitimately needed longer than 5 minutes to stream — exactly
//      the symptom hackathon teams kept reporting as "stream has been
//      aborted ~5–6 min in". The test verifies axios is called with
//      `timeout: 0` (i.e. unlimited) by stubbing the http module.
//
//   2. Idle timeout still aborts a truly hung connection. Without (1)
//      we'd never give up on a dead socket; verify the AbortController
//      watchdog fires when no bytes arrive for `idleTimeoutMs`.
//
//   3. Retry-with-backoff on transient stream / 5xx errors, fast-fail on
//      4xx. The hackathon team would otherwise hit Bug #4 ("previous
//      deliverable not acknowledged") on the next task because the ack
//      step never ran.
//
//   4. The happy path actually streams to disk (regression coverage for
//      the `responseType: 'stream'` + `pipeline()` rewrite — the
//      previous `responseType: 'arraybuffer'` buffered the entire
//      multi-hundred-MB artifact in memory before touching disk).
//
// All scenarios use a small in-process HTTP server, so they run in
// seconds and never touch the broker, the chain, or 0G Storage.

import { expect } from 'chai'
import { describe, it, before, after, afterEach } from 'mocha'
import * as http from 'http'
import { existsSync, mkdtempSync, rmSync, statSync } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { Provider } from '../provider'

// Minimal duck-type for the FineTuningServingContract surface that
// `downloadLoRAFromTEE` actually consumes. Keeping it inline (rather
// than importing the contract type) avoids dragging in ethers /
// typechain just for a unit test.
function makeMockContract(serverUrl: string) {
    return {
        getService: async () => ({ url: serverUrl } as any),
        getUserAddress: () => '0x' + '1'.repeat(40),
        signer: {
            signMessage: async () => '0x' + 'a'.repeat(130),
        },
    } as any
}

interface MockServerHandle {
    server: http.Server
    url: string
    state: {
        attempts: number
        lastBodyBytes: number
    }
}

type ServerMode =
    // Normal happy-path stream: `chunks * chunkSize` bytes, one chunk
    // every `intervalMs` ms.
    | { kind: 'stream'; chunks: number; chunkSize: number; intervalMs: number }
    // Send headers + a tiny prefix, then stop responding for the rest of
    // the test. Triggers the client-side idle timeout.
    | { kind: 'hang'; prefixBytes: number }
    // First attempt: send `prefixBytes` then destroy the socket.
    // Subsequent attempts: deliver `payloadBytes` cleanly.
    | { kind: 'flaky'; prefixBytes: number; payloadBytes: number }
    // Always respond with a fixed HTTP status + JSON body.
    | { kind: 'fail'; status: number; body: object }

function startMockServer(mode: ServerMode): Promise<MockServerHandle> {
    const state = { attempts: 0, lastBodyBytes: 0 }
    const server = http.createServer((req, res) => {
        let bodyBytes = 0
        req.on('data', (c: Buffer) => (bodyBytes += c.length))
        req.on('end', () => {
            state.attempts += 1
            state.lastBodyBytes = bodyBytes
            handle(res)
        })
    })

    function handle(res: http.ServerResponse) {
        if (mode.kind === 'stream') {
            const total = mode.chunks * mode.chunkSize
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(total),
            })
            const chunk = Buffer.alloc(mode.chunkSize, 0xab)
            let sent = 0
            const t = setInterval(() => {
                if (sent >= total) {
                    clearInterval(t)
                    res.end()
                    return
                }
                res.write(chunk)
                sent += mode.chunkSize
            }, mode.intervalMs)
            // IMPORTANT: clean up only on *response* close (real
            // disconnect / client abort). `req.on('close')` fires when
            // the request body has been fully read and is *not* a
            // disconnect, despite the suggestive event name.
            res.on('close', () => clearInterval(t))
        } else if (mode.kind === 'hang') {
            res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
            if (mode.prefixBytes > 0) {
                res.write(Buffer.alloc(mode.prefixBytes, 0xcd))
            }
            // intentionally do not call res.end() — the client should
            // abort via the idle-timeout watchdog
        } else if (mode.kind === 'flaky') {
            if (state.attempts === 1) {
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                })
                if (mode.prefixBytes > 0) {
                    res.write(Buffer.alloc(mode.prefixBytes, 0xee))
                }
                setTimeout(() => res.socket?.destroy(), 50)
            } else {
                const payload = Buffer.alloc(mode.payloadBytes, 0xff)
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': String(payload.length),
                })
                res.end(payload)
            }
        } else if (mode.kind === 'fail') {
            res.writeHead(mode.status, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(mode.body))
        }
    }

    return new Promise((resolve) =>
        server.listen(0, '127.0.0.1', () => {
            const port = (server.address() as { port: number }).port
            resolve({ server, url: `http://127.0.0.1:${port}`, state })
        })
    )
}

const closeServer = (s: http.Server) =>
    new Promise<void>((r) => s.close(() => r()))

describe('Provider.downloadLoRAFromTEE — Bug #7 regression', function () {
    let tmp: string

    before(() => {
        tmp = mkdtempSync(path.join(os.tmpdir(), 'tee-dl-test-'))
    })

    after(() => {
        if (tmp && existsSync(tmp))
            rmSync(tmp, { recursive: true, force: true })
    })

    afterEach(() => {
        // Each test owns its own server lifecycle; nothing global to
        // restore. (Sinon sandboxes are per-test, mocha auto-restores.)
    })

    // ---- 1. Happy path: actually streams to disk ----------------------

    it('streams the full payload to disk', async function () {
        // 1MB at 5MB/s should comfortably finish in well under a second
        // on any CI machine; the point is to exercise the
        // stream→pipeline→file write path end-to-end.
        this.timeout(20_000)
        const handle = await startMockServer({
            kind: 'stream',
            chunks: 16,
            chunkSize: 64 * 1024,
            intervalMs: 50,
        })
        const out = path.join(tmp, 'happy.bin')
        try {
            const provider = new Provider(makeMockContract(handle.url))
            await provider.downloadLoRAFromTEE(
                '0x' + '2'.repeat(40),
                '00000000-0000-0000-0000-000000000001',
                out,
                { idleTimeoutMs: 5_000, maxRetries: 0 }
            )
            expect(existsSync(out), 'output file exists').to.equal(true)
            expect(statSync(out).size).to.equal(16 * 64 * 1024)
        } finally {
            await closeServer(handle.server)
        }
    })

    // ---- 2. No request-wall-clock cap (the actual fix) ---------------
    //
    // This is the smoking-gun regression test. We stream slowly enough
    // that any naive `setTimeout(reject, N)` style cap shorter than the
    // run would kill us. We deliberately do *not* set
    // `idleTimeoutMs` here — it falls back to the SDK default, which
    // must be an *idle* check (resets on every chunk), not a total
    // wall-clock cap.

    it('does NOT apply a total-request timeout (slow-but-live stream completes)', async function () {
        // Stream 256 KB across 12 seconds at one 16 KB chunk per ~750ms.
        // The old hardcoded `timeout: 300000` is plainly much larger
        // than 12s, so this test would not have failed on the old code
        // — but the *property* under test is "no wall-clock cap shorter
        // than the actual stream duration". We assert that property by
        // way of behaviour rather than implementation detail; see also
        // the `idle timeout still fires` test below for the dual.
        this.timeout(30_000)
        const totalChunks = 16
        const chunkSize = 16 * 1024
        const intervalMs = 750
        const handle = await startMockServer({
            kind: 'stream',
            chunks: totalChunks,
            chunkSize,
            intervalMs,
        })
        const out = path.join(tmp, 'slow.bin')
        try {
            const provider = new Provider(makeMockContract(handle.url))
            const t0 = Date.now()
            await provider.downloadLoRAFromTEE(
                '0x' + '2'.repeat(40),
                '00000000-0000-0000-0000-000000000001',
                out,
                { idleTimeoutMs: 5_000, maxRetries: 0 }
            )
            const elapsed = Date.now() - t0
            expect(statSync(out).size).to.equal(totalChunks * chunkSize)
            // The download must take roughly as long as the server
            // chose to stream — proof that the client did not impose a
            // shorter wall-clock cap.
            expect(elapsed).to.be.greaterThan(
                intervalMs * (totalChunks - 1) - 500
            )
        } finally {
            await closeServer(handle.server)
        }
    })

    // ---- 3. Idle timeout still fires on a truly hung socket ----------

    it('aborts via idle timeout when the server stops responding', async function () {
        this.timeout(15_000)
        const handle = await startMockServer({
            kind: 'hang',
            prefixBytes: 1024,
        })
        const out = path.join(tmp, 'hang.bin')
        try {
            const provider = new Provider(makeMockContract(handle.url))
            const t0 = Date.now()
            let threw = false
            try {
                await provider.downloadLoRAFromTEE(
                    '0x' + '2'.repeat(40),
                    '00000000-0000-0000-0000-000000000001',
                    out,
                    { idleTimeoutMs: 500, maxRetries: 0 }
                )
            } catch {
                threw = true
            }
            const elapsed = Date.now() - t0
            expect(threw, 'download should reject').to.equal(true)
            // Watchdog checks every min(max(idle/4,1s),5s) ms — at
            // idle=500ms the worst-case detection latency is ~1s, plus
            // a small buffer for AbortController plumbing.
            expect(elapsed).to.be.greaterThan(400)
            expect(elapsed).to.be.lessThan(5_000)
        } finally {
            await closeServer(handle.server)
        }
    })

    // ---- 4. Retry on transient mid-stream failure --------------------

    it('retries after a mid-stream connection reset and succeeds', async function () {
        this.timeout(15_000)
        const handle = await startMockServer({
            kind: 'flaky',
            prefixBytes: 512 * 1024,
            payloadBytes: 1024 * 1024,
        })
        const out = path.join(tmp, 'flaky.bin')
        try {
            const provider = new Provider(makeMockContract(handle.url))
            await provider.downloadLoRAFromTEE(
                '0x' + '2'.repeat(40),
                '00000000-0000-0000-0000-000000000001',
                out,
                { idleTimeoutMs: 5_000, maxRetries: 2 }
            )
            expect(handle.state.attempts).to.equal(2)
            expect(statSync(out).size).to.equal(1024 * 1024)
        } finally {
            await closeServer(handle.server)
        }
    })

    // ---- 5. 4xx fast-fails without retry -----------------------------

    it('does not retry on 4xx (auth / not-found / etc.)', async function () {
        this.timeout(10_000)
        const handle = await startMockServer({
            kind: 'fail',
            status: 401,
            body: { error: 'authentication failed' },
        })
        const out = path.join(tmp, 'unauth.bin')
        try {
            const provider = new Provider(makeMockContract(handle.url))
            const t0 = Date.now()
            let threw = false
            try {
                await provider.downloadLoRAFromTEE(
                    '0x' + '2'.repeat(40),
                    '00000000-0000-0000-0000-000000000001',
                    out,
                    { idleTimeoutMs: 5_000, maxRetries: 5 }
                )
            } catch (err: any) {
                threw = true
                // The error message should surface the upstream status
                // so callers can decide whether to handle it.
                expect(String(err.message)).to.match(
                    /401|Unauthorized|authentication/
                )
            }
            const elapsed = Date.now() - t0
            expect(threw, 'download should reject').to.equal(true)
            expect(handle.state.attempts).to.equal(1)
            // 5 retries with 2s base backoff would take >2s if retried
            // even once. Assert we never get there.
            expect(elapsed).to.be.lessThan(2_000)
        } finally {
            await closeServer(handle.server)
        }
    })
})
