import { isBrowser, hasWebCrypto } from './env'

/**
 * Crypto adapter that provides unified encryption/decryption interface
 * for both Node.js and browser environments
 */

export interface CryptoAdapter {
    aesGCMEncrypt(
        key: Buffer,
        data: Buffer,
        iv: Buffer
    ): Promise<{ encrypted: Buffer; authTag: Buffer }>
    aesGCMDecrypt(
        key: Buffer,
        encryptedData: Buffer,
        iv: Buffer,
        authTag: Buffer
    ): Promise<Buffer>
    randomBytes(length: number): Buffer
}

class NodeCryptoAdapter implements CryptoAdapter {
    private crypto: any

    constructor() {
        if (isBrowser()) {
            throw new Error(
                'NodeCryptoAdapter can only be used in Node.js environment'
            )
        }
    }

    private async getCrypto() {
        if (!this.crypto) {
            this.crypto = await import('crypto')
        }
        return this.crypto
    }

    async aesGCMEncrypt(
        key: Buffer,
        data: Buffer,
        iv: Buffer
    ): Promise<{ encrypted: Buffer; authTag: Buffer }> {
        const crypto = await this.getCrypto()
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
        const authTag = cipher.getAuthTag()
        return { encrypted, authTag }
    }

    async aesGCMDecrypt(
        key: Buffer,
        encryptedData: Buffer,
        iv: Buffer,
        authTag: Buffer
    ): Promise<Buffer> {
        const crypto = await this.getCrypto()
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
        decipher.setAuthTag(authTag)
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final(),
        ])
        return decrypted
    }

    randomBytes(length: number): Buffer {
        if (this.crypto) {
            return this.crypto.randomBytes(length)
        }

        // For synchronous random bytes in Node.js, we'll need to handle this differently
        // This is a limitation - ideally this should be async
        const array = new Uint8Array(length)

        // Use Node.js crypto if available (simplified fallback)
        // In production, this should ideally be async
        try {
            // Check if we're in Node.js environment by checking for process
            if (typeof process !== 'undefined' && process.versions?.node) {
                // Import crypto-browserify as fallback for browser compatibility
                const cryptoBrowserify = require('crypto-browserify')
                return cryptoBrowserify.randomBytes(length)
            }
        } catch {
            // Crypto not available
        }

        // Fallback to Math.random (not cryptographically secure, but functional)
        console.warn(
            'Using Math.random for random bytes - not cryptographically secure'
        )
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }
        return Buffer.from(array)
    }
}

class BrowserCryptoAdapter implements CryptoAdapter {
    constructor() {
        if (!hasWebCrypto()) {
            throw new Error('Web Crypto API is not available in this browser')
        }
    }

    async aesGCMEncrypt(
        key: Buffer,
        data: Buffer,
        iv: Buffer
    ): Promise<{ encrypted: Buffer; authTag: Buffer }> {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(key),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        )

        const result = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(iv),
                tagLength: 128,
            },
            cryptoKey,
            new Uint8Array(data)
        )

        const encrypted = new Uint8Array(result.slice(0, -16))
        const authTag = new Uint8Array(result.slice(-16))

        return {
            encrypted: Buffer.from(encrypted),
            authTag: Buffer.from(authTag),
        }
    }

    async aesGCMDecrypt(
        key: Buffer,
        encryptedData: Buffer,
        iv: Buffer,
        authTag: Buffer
    ): Promise<Buffer> {
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(key),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        )

        const combined = new Uint8Array(encryptedData.length + authTag.length)
        combined.set(new Uint8Array(encryptedData), 0)
        combined.set(new Uint8Array(authTag), encryptedData.length)

        const result = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(iv),
                tagLength: 128,
            },
            cryptoKey,
            combined
        )

        return Buffer.from(result)
    }

    randomBytes(length: number): Buffer {
        const array = new Uint8Array(length)
        crypto.getRandomValues(array)
        return Buffer.from(array)
    }
}

let cryptoAdapter: CryptoAdapter | null = null

export function getCryptoAdapter(): CryptoAdapter {
    if (!cryptoAdapter) {
        if (isBrowser()) {
            cryptoAdapter = new BrowserCryptoAdapter()
        } else {
            cryptoAdapter = new NodeCryptoAdapter()
        }
    }
    return cryptoAdapter
}
