"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTokenSizeViaExe = calculateTokenSizeViaExe;
exports.calculateTokenSizeViaPython = calculateTokenSizeViaPython;
const env_1 = require("../../common/utils/env");
const utils_1 = require("../../common/utils");
// Dynamic imports for Node.js specific modules
let fs;
let os;
let path;
let AdmZip;
let spawn;
let exec;
let createHash;
let createReadStream;
async function initNodeModules() {
    if ((0, env_1.isBrowser)()) {
        throw new Error('Token calculation functions are not available in browser environment. Please use these functions in a Node.js environment.');
    }
    if (!fs) {
        fs =
            (await Promise.resolve().then(() => __importStar(require('fs/promises')))).default ||
                (await Promise.resolve().then(() => __importStar(require('fs/promises'))));
        os = (await Promise.resolve().then(() => __importStar(require('os')))).default || (await Promise.resolve().then(() => __importStar(require('os'))));
        path = (await Promise.resolve().then(() => __importStar(require('path')))).default || (await Promise.resolve().then(() => __importStar(require('path'))));
        AdmZip = (await Promise.resolve().then(() => __importStar(require('adm-zip')))).default;
        const childProcess = await Promise.resolve().then(() => __importStar(require('child_process')));
        spawn = childProcess.spawn;
        exec = childProcess.exec;
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        createHash = crypto.createHash;
        createReadStream = (await Promise.resolve().then(() => __importStar(require('fs')))).createReadStream;
    }
}
// Re-export download with browser check
async function safeDynamicImport() {
    if ((0, env_1.isBrowser)()) {
        throw new Error('ZG Storage operations are not available in browser environment.');
    }
    const { download } = await Promise.resolve().then(() => __importStar(require('../zg-storage')));
    return { download };
}
async function calculateTokenSizeViaExe(tokenizerRootHash, datasetPath, datasetType, tokenCounterMerkleRoot, tokenCounterFileHash) {
    await initNodeModules();
    const { download } = await safeDynamicImport();
    const executorDir = path.join(__dirname, '..', '..', '..', '..', 'binary');
    const binaryFile = path.join(executorDir, 'token_counter');
    let needDownload = false;
    try {
        await fs.access(binaryFile);
        console.log('calculating file Hash');
        const hash = await calculateFileHash(binaryFile);
        console.log('file hash: ', hash);
        if (tokenCounterFileHash !== hash) {
            console.log(`file hash mismatch, expected: `, tokenCounterFileHash);
            needDownload = true;
        }
    }
    catch (error) {
        console.log(`File ${binaryFile} does not exist.`);
        needDownload = true;
    }
    if (needDownload) {
        try {
            await fs.unlink(binaryFile);
        }
        catch (error) {
            console.error(`Failed to delete ${binaryFile}:`, error);
        }
        console.log(`Downloading ${binaryFile}`);
        await download(binaryFile, tokenCounterMerkleRoot);
        await fs.chmod(binaryFile, 0o755);
    }
    return await calculateTokenSize(tokenizerRootHash, datasetPath, datasetType, binaryFile, []);
}
async function calculateTokenSizeViaPython(tokenizerRootHash, datasetPath, datasetType) {
    await initNodeModules();
    const isPythonInstalled = await checkPythonInstalled();
    if (!isPythonInstalled) {
        throw new Error('Python is required but not installed. Please install Python first.');
    }
    for (const packageName of ['transformers', 'datasets']) {
        const isPackageInstalled = await checkPackageInstalled(packageName);
        if (!isPackageInstalled) {
            console.log(`${packageName} is not installed. Installing...`);
            try {
                await installPackage(packageName);
            }
            catch (error) {
                throw new Error(`Failed to install ${packageName}: ${error}`);
            }
        }
    }
    const projectRoot = path.resolve(__dirname, '../../../../');
    return await calculateTokenSize(tokenizerRootHash, datasetPath, datasetType, 'python3', [path.join(projectRoot, 'token.counter', 'token_counter.py')]);
}
async function calculateTokenSize(tokenizerRootHash, datasetPath, datasetType, executor, args) {
    const { download } = await safeDynamicImport();
    const tmpDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
    console.log(`current temporary directory ${tmpDir}`);
    const tokenizerPath = path.join(tmpDir, 'tokenizer.zip');
    await download(tokenizerPath, tokenizerRootHash);
    const subDirectories = await getSubdirectories(tmpDir);
    unzipFile(tokenizerPath, tmpDir);
    const newDirectories = new Set();
    for (const item of await getSubdirectories(tmpDir)) {
        if (!subDirectories.has(item)) {
            newDirectories.add(item);
        }
    }
    if (newDirectories.size !== 1) {
        throw new Error('Invalid tokenizer directory');
    }
    const tokenizerUnzipPath = path.join(tmpDir, Array.from(newDirectories)[0]);
    let datasetUnzipPath = datasetPath;
    if (await isZipFile(datasetPath)) {
        unzipFile(datasetPath, tmpDir);
        datasetUnzipPath = path.join(tmpDir, 'data');
        try {
            await fs.access(datasetUnzipPath);
        }
        catch (error) {
            await fs.mkdir(datasetUnzipPath, { recursive: true });
        }
    }
    return runExecutor(executor, [
        ...args,
        datasetUnzipPath,
        datasetType,
        tokenizerUnzipPath,
    ])
        .then((output) => {
        console.log('token_counter script output:', output);
        if (!output || typeof output !== 'string') {
            throw new Error('Invalid output from token counter');
        }
        const [num1, num2] = output
            .split(' ')
            .map((str) => parseInt(str, 10));
        if (isNaN(num1) || isNaN(num2)) {
            throw new Error('Invalid number');
        }
        return num1;
    })
        .catch((error) => {
        console.error('Error running Python script:', error);
        (0, utils_1.throwFormattedError)(error);
    });
}
function checkPythonInstalled() {
    return new Promise((resolve, reject) => {
        exec('python3 --version', (error, stdout, stderr) => {
            if (error) {
                console.error('Python is not installed or not in PATH');
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
function checkPackageInstalled(packageName) {
    return new Promise((resolve, reject) => {
        exec(`pip show ${packageName}`, (error, stdout, stderr) => {
            if (error) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}
function installPackage(packageName) {
    return new Promise((resolve, reject) => {
        exec(`pip install ${packageName}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to install ${packageName}`);
                reject(error);
            }
            else {
                console.log(`${packageName} installed successfully`);
                resolve();
            }
        });
    });
}
function runExecutor(executor, args) {
    return new Promise((resolve, reject) => {
        console.log(`Run ${executor} ${args}`);
        const pythonProcess = spawn(executor, [...args]);
        let output = '';
        let errorOutput = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Python error: ${errorOutput}`);
        });
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            }
            else {
                reject(`Python script failed with code ${code}: ${errorOutput.trim()}`);
            }
        });
    });
}
function unzipFile(zipFilePath, targetDir) {
    try {
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(targetDir, true);
        console.log(`Successfully unzipped to ${targetDir}`);
    }
    catch (error) {
        console.error('Error during unzipping:', error);
        throw error;
    }
}
async function isZipFile(targetPath) {
    try {
        const stats = await fs.stat(targetPath);
        return (stats.isFile() && path.extname(targetPath).toLowerCase() === '.zip');
    }
    catch (error) {
        return false;
    }
}
async function getSubdirectories(dirPath) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const subdirectories = new Set(entries
            .filter((entry) => entry.isDirectory()) // Only keep directories
            .map((entry) => entry.name));
        return subdirectories;
    }
    catch (error) {
        console.error('Error reading directory:', error);
        return new Set();
    }
}
async function calculateFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
        const hash = createHash(algorithm);
        const stream = createReadStream(filePath);
        stream.on('data', (chunk) => {
            hash.update(chunk);
        });
        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}
//# sourceMappingURL=token.js.map