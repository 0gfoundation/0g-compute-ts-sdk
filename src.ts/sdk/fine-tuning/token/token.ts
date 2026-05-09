import { isBrowser } from '../../common/utils/env'
import { throwFormattedError } from '../../common/utils'

// Dynamic imports for Node.js specific modules
let fs: any
let os: any
let path: any
let AdmZip: any
let spawn: any
let exec: any
let createHash: any
let createReadStream: any

async function initNodeModules() {
    if (isBrowser()) {
        throw new Error(
            'Token calculation functions are not available in browser environment. Please use these functions in a Node.js environment.'
        )
    }

    if (!fs) {
        fs =
            (await import('fs/promises')).default ||
            (await import('fs/promises'))
        os = (await import('os')).default || (await import('os'))
        path = (await import('path')).default || (await import('path'))
        AdmZip = (await import('adm-zip')).default
        const childProcess = await import('child_process')
        spawn = childProcess.spawn
        exec = childProcess.exec
        const crypto = await import('crypto')
        createHash = crypto.createHash
        createReadStream = (await import('fs')).createReadStream
    }
}

// Re-export download with browser check
async function safeDynamicImport() {
    if (isBrowser()) {
        throw new Error(
            'ZG Storage operations are not available in browser environment.'
        )
    }
    const { download } = await import('../zg-storage')
    return { download }
}

export async function calculateTokenSizeViaExe(
    tokenizerRootHash: string,
    datasetPath: string,
    datasetType: string,
    tokenCounterMerkleRoot: string,
    tokenCounterFileHash: string
): Promise<number> {
    await initNodeModules()
    const { download } = await safeDynamicImport()

    const binaryPathModule = await import('../zg-storage/binary-path')
    const executorDir = await binaryPathModule.getBinaryDir()
    const binaryFile = path.join(executorDir, 'token_counter')

    let needDownload = false
    try {
        await fs.access(binaryFile)

        console.log('calculating file Hash')
        const hash = await calculateFileHash(binaryFile)
        console.log('file hash: ', hash)
        if (tokenCounterFileHash !== hash) {
            console.log(`file hash mismatch, expected: `, tokenCounterFileHash)
            needDownload = true
        }
    } catch (error) {
        console.log(`File ${binaryFile} does not exist.`)
        needDownload = true
    }

    if (needDownload) {
        try {
            await fs.unlink(binaryFile)
        } catch (error) {
            console.error(`Failed to delete ${binaryFile}:`, error)
        }

        console.log(`Downloading ${binaryFile}`)
        await download(binaryFile, tokenCounterMerkleRoot)
        await fs.chmod(binaryFile, 0o755)
    }

    return await calculateTokenSize(
        tokenizerRootHash,
        datasetPath,
        datasetType,
        binaryFile,
        []
    )
}

export async function calculateTokenSizeViaPython(
    tokenizerRootHash: string,
    datasetPath: string,
    datasetType: string
): Promise<number> {
    await initNodeModules()

    const isPythonInstalled = await checkPythonInstalled()
    if (!isPythonInstalled) {
        throw new Error(
            'Python is required but not installed. Please install Python first.'
        )
    }

    for (const packageName of ['transformers', 'datasets']) {
        const isPackageInstalled = await checkPackageInstalled(packageName)
        if (!isPackageInstalled) {
            console.log(`${packageName} is not installed. Installing...`)
            try {
                await installPackage(packageName)
            } catch (error) {
                throw new Error(`Failed to install ${packageName}: ${error}`)
            }
        }
    }
    const binaryPathModule = await import('../zg-storage/binary-path')
    const projectRoot = await binaryPathModule.getPackageRoot()
    return await calculateTokenSize(
        tokenizerRootHash,
        datasetPath,
        datasetType,
        'python3',
        [path.join(projectRoot, 'token.counter', 'token_counter.py')]
    )
}

async function calculateTokenSize(
    tokenizerRootHash: string,
    datasetPath: string,
    datasetType: string,
    executor: string,
    args: string[]
): Promise<number> {
    const { download } = await safeDynamicImport()

    const tmpDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`)
    console.log(`current temporary directory ${tmpDir}`)
    const tokenizerPath = path.join(tmpDir, 'tokenizer.zip')

    await download(tokenizerPath, tokenizerRootHash)
    const subDirectories = await getSubdirectories(tmpDir)
    unzipFile(tokenizerPath, tmpDir)
    const newDirectories = new Set<string>()
    for (const item of await getSubdirectories(tmpDir)) {
        if (!subDirectories.has(item)) {
            newDirectories.add(item)
        }
    }

    if (newDirectories.size !== 1) {
        throw new Error('Invalid tokenizer directory')
    }
    const tokenizerUnzipPath = path.join(tmpDir, Array.from(newDirectories)[0])

    let datasetUnzipPath = datasetPath
    if (await isZipFile(datasetPath)) {
        unzipFile(datasetPath, tmpDir)
        datasetUnzipPath = path.join(tmpDir, 'data')
        try {
            await fs.access(datasetUnzipPath)
        } catch (error) {
            await fs.mkdir(datasetUnzipPath, { recursive: true })
        }
    }

    return runExecutor(executor, [
        ...args,
        datasetUnzipPath,
        datasetType,
        tokenizerUnzipPath,
    ])
        .then((output) => {
            console.log('token_counter script output:', output)
            if (!output || typeof output !== 'string') {
                throw new Error('Invalid output from token counter')
            }
            const [num1, num2] = output
                .split(' ')
                .map((str) => parseInt(str, 10))
            if (isNaN(num1) || isNaN(num2)) {
                throw new Error('Invalid number')
            }
            return num1
        })
        .catch((error) => {
            console.error('Error running Python script:', error)
            throwFormattedError(error)
        })
}

function checkPythonInstalled(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        exec('python3 --version', (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.error('Python is not installed or not in PATH')
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

function checkPackageInstalled(packageName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        exec(
            `pip show ${packageName}`,
            (error: any, stdout: any, stderr: any) => {
                if (error) {
                    resolve(false)
                } else {
                    resolve(true)
                }
            }
        )
    })
}

function installPackage(packageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(
            `pip install ${packageName}`,
            (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.error(`Failed to install ${packageName}`)
                    reject(error)
                } else {
                    console.log(`${packageName} installed successfully`)
                    resolve()
                }
            }
        )
    })
}

function runExecutor(executor: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        console.log(`Run ${executor} ${args}`)
        const pythonProcess = spawn(executor, [...args])

        let output = ''
        let errorOutput = ''

        pythonProcess.stdout.on('data', (data: any) => {
            output += data.toString()
        })

        pythonProcess.stderr.on('data', (data: any) => {
            errorOutput += data.toString()
            console.error(`Python error: ${errorOutput}`)
        })

        pythonProcess.on('close', (code: any) => {
            if (code === 0) {
                resolve(output.trim())
            } else {
                reject(
                    `Python script failed with code ${code}: ${errorOutput.trim()}`
                )
            }
        })
    })
}

function unzipFile(zipFilePath: string, targetDir: string): void {
    try {
        const zip = new AdmZip(zipFilePath)
        zip.extractAllTo(targetDir, true)
        console.log(`Successfully unzipped to ${targetDir}`)
    } catch (error) {
        console.error('Error during unzipping:', error)
        throw error
    }
}

async function isZipFile(targetPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(targetPath)
        return (
            stats.isFile() && path.extname(targetPath).toLowerCase() === '.zip'
        )
    } catch (error) {
        return false
    }
}

async function getSubdirectories(dirPath: string): Promise<Set<string>> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        const subdirectories = new Set<string>(
            entries
                .filter((entry: any) => entry.isDirectory()) // Only keep directories
                .map((entry: any) => entry.name as string)
        )

        return subdirectories
    } catch (error) {
        console.error('Error reading directory:', error)
        return new Set<string>()
    }
}

async function calculateFileHash(
    filePath: string,
    algorithm: string = 'sha256'
): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash(algorithm)
        const stream = createReadStream(filePath)

        stream.on('data', (chunk: any) => {
            hash.update(chunk)
        })

        stream.on('end', () => {
            resolve(hash.digest('hex'))
        })

        stream.on('error', (err: any) => {
            reject(err)
        })
    })
}
