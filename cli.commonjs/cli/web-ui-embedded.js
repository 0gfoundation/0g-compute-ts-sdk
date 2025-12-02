"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startEmbeddedWebUI = startEmbeddedWebUI;
exports.default = webUIEmbedded;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = require("fs");
const express_1 = tslib_1.__importDefault(require("express"));
function getPackageRoot() {
    let currentDir = __dirname;
    while (currentDir !== path_1.default.dirname(currentDir)) {
        const packageJsonPath = path_1.default.join(currentDir, 'package.json');
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            try {
                const packageJsonContent = (0, fs_1.readFileSync)(packageJsonPath, 'utf-8');
                const packageJson = JSON.parse(packageJsonContent);
                if (packageJson.name === '0g-serving-broker') {
                    return currentDir;
                }
            }
            catch {
                // Continue searching
            }
        }
        currentDir = path_1.default.dirname(currentDir);
    }
    // Fallback to relative path
    return path_1.default.resolve(__dirname, '../..');
}
async function startEmbeddedWebUI(port = 3090, host = 'localhost') {
    const packageRoot = getPackageRoot();
    console.log(`📦 Package root: ${packageRoot}`);
    const webUIRoot = path_1.default.join(packageRoot, 'web-ui');
    if (!(0, fs_1.existsSync)(webUIRoot)) {
        console.error('❌ Web UI not found. Please ensure the package includes the web UI.');
        return;
    }
    console.log(`🌐 Web UI root: ${webUIRoot}`);
    // Check for static export first (new preferred method)
    const staticExportPath = path_1.default.join(webUIRoot, 'out');
    if ((0, fs_1.existsSync)(staticExportPath)) {
        console.log('✅ Using static export build (fastest startup, smallest size)');
        await serveStaticExport(staticExportPath, port, host);
        return;
    }
    // Fallback to standalone build
    const standaloneBuildPath = path_1.default.join(webUIRoot, '.next', 'standalone');
    if ((0, fs_1.existsSync)(standaloneBuildPath)) {
        console.log('⚠️  Using standalone build (fallback)');
        await serveStandaloneBuild(standaloneBuildPath, webUIRoot, port, host);
        return;
    }
    // No valid build found
    console.error('❌ No valid build found.');
    console.error(`Expected either:`);
    console.error(`  - Static export: ${staticExportPath}`);
    console.error(`  - Standalone build: ${standaloneBuildPath}`);
    console.error('Please build the web UI first with: npm run build:with-ui-fast');
}
async function serveStaticExport(staticPath, port, host) {
    console.log(`📁 Serving static files from: ${staticPath}`);
    const app = (0, express_1.default)();
    // Security headers
    app.use((_req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    });
    // Handle Next.js static export routing with optimal file serving
    app.use((req, res, next) => {
        // Skip if it's a static asset request (JS, CSS, images, etc.)
        if (req.path.startsWith('/_next/') ||
            req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|txt)$/)) {
            next();
            return;
        }
        // Normalize the path and look for corresponding HTML file
        let htmlPath = req.path;
        // Handle root path
        if (htmlPath === '/') {
            htmlPath = 'index.html';
        }
        else {
            // Remove trailing slash if present
            htmlPath = htmlPath.replace(/\/$/, '');
            // Check if direct HTML file exists (e.g., /inference -> inference.html)
            const directFile = path_1.default.join(staticPath, htmlPath.substring(1) + '.html');
            if ((0, fs_1.existsSync)(directFile)) {
                htmlPath = htmlPath.substring(1) + '.html';
            }
            else {
                // Check if nested HTML file exists (e.g., /inference/chat -> inference/chat.html)
                const nestedFile = path_1.default.join(staticPath, htmlPath.substring(1) + '.html');
                if ((0, fs_1.existsSync)(nestedFile)) {
                    htmlPath = htmlPath.substring(1) + '.html';
                }
                else {
                    // Fallback to index.html for client-side routing
                    htmlPath = 'index.html';
                }
            }
        }
        const fullPath = path_1.default.resolve(staticPath, htmlPath);
        if ((0, fs_1.existsSync)(fullPath)) {
            // Get file stats for better caching
            const stat = (0, fs_1.statSync)(fullPath);
            // Set proper headers
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Length', stat.size.toString());
            // For HTML files, prevent caching to ensure fresh content
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            // Use stream for better memory efficiency
            const stream = (0, fs_1.createReadStream)(fullPath);
            stream.on('error', (err) => {
                console.error(`Error reading file: ${err}`);
                if (!res.headersSent) {
                    res.status(500).send('Internal server error');
                }
            });
            stream.pipe(res);
        }
        else {
            res.status(404).send('Page not found');
        }
    });
    // Serve static assets only (after SPA routing to prevent directory redirects)
    app.use(express_1.default.static(staticPath, {
        maxAge: '1y', // Cache static assets for 1 year
        etag: true,
        lastModified: true,
        index: false, // Disable index.html serving to prevent conflicts
        setHeaders: (res, filePath) => {
            // Set proper cache headers for static assets
            if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
            }
        },
    }));
    const server = app.listen(port, host, () => {
        const displayHost = host === '0.0.0.0' ? 'all interfaces' : host;
        console.log(`🚀 Static web UI server running on http://${displayHost}:${port}`);
        if (host === '0.0.0.0') {
            console.log(`📡 Accessible from LAN at http://<your-local-ip>:${port}`);
        }
        console.log(`📊 Serving from: ${staticPath}`);
    });
    // Handle process termination
    const gracefulShutdown = () => {
        console.log('\n🛑 Shutting down server...');
        server.close(() => {
            console.log('✅ Server shut down gracefully');
            process.exit(0);
        });
    };
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
}
async function serveStandaloneBuild(standalonePath, webUIRoot, port, host) {
    const standaloneServerPath = path_1.default.join(standalonePath, 'server.js');
    // Check if it's a valid embedded Web UI structure
    const expectedFiles = [
        path_1.default.join(standalonePath, 'package.json'),
        standaloneServerPath,
    ];
    const missingFiles = expectedFiles.filter((file) => !(0, fs_1.existsSync)(file));
    if (missingFiles.length > 0) {
        console.error('❌ Invalid embedded Web UI structure');
        console.error('Missing files:', missingFiles);
        return;
    }
    // Smart dependency installation with fallback
    const packageManagers = [
        ['pnpm', ['install', '--prod']],
        ['npm', ['install', '--production']],
        ['yarn', ['install']],
    ];
    let installSuccess = false;
    for (const [cmd, args] of packageManagers) {
        try {
            console.log(`🔧 Using ${cmd} to install dependencies...`);
            const installProcess = (0, child_process_1.spawn)(cmd, args, {
                cwd: standalonePath,
                stdio: 'inherit',
                shell: process.platform === 'win32',
            });
            const installCode = await new Promise((resolve) => {
                installProcess.on('close', resolve);
                installProcess.on('error', () => resolve(null));
            });
            if (installCode === 0) {
                console.log(`✅ Dependencies installed successfully with ${cmd}`);
                installSuccess = true;
                break;
            }
            else {
                throw new Error(`Installation failed with code ${installCode}`);
            }
        }
        catch (error) {
            console.warn(`⚠️  ${cmd} installation failed: ${error.message}`);
            continue;
        }
    }
    if (!installSuccess) {
        console.error('❌ Failed to install dependencies with any package manager');
        return;
    }
    // Copy static files if they exist
    const staticSourcePath = path_1.default.join(webUIRoot, '.next', 'static');
    const staticTargetPath = path_1.default.join(standalonePath, '.next', 'static');
    if ((0, fs_1.existsSync)(staticSourcePath) && !(0, fs_1.existsSync)(staticTargetPath)) {
        try {
            console.log('📁 Copying static files...');
            // Ensure target directory exists
            (0, fs_1.mkdirSync)(path_1.default.dirname(staticTargetPath), { recursive: true });
            // Copy directory recursively
            function copyDir(src, dest) {
                (0, fs_1.mkdirSync)(dest, { recursive: true });
                for (const file of (0, fs_1.readdirSync)(src)) {
                    const srcPath = path_1.default.join(src, file);
                    const destPath = path_1.default.join(dest, file);
                    if ((0, fs_1.statSync)(srcPath).isDirectory()) {
                        copyDir(srcPath, destPath);
                    }
                    else {
                        (0, fs_1.copyFileSync)(srcPath, destPath);
                    }
                }
            }
            copyDir(staticSourcePath, staticTargetPath);
            console.log('✅ Static files copied successfully');
        }
        catch (copyError) {
            console.warn('⚠️  Failed to copy static files:', copyError);
        }
    }
    // Set environment and start the server
    console.log(`🚀 Starting Next.js standalone server on http://${host}:${port}`);
    if (host === '0.0.0.0') {
        console.log(`📡 Accessible from LAN at http://<your-local-ip>:${port}`);
    }
    const serverProcess = (0, child_process_1.spawn)('node', ['server.js'], {
        cwd: standalonePath,
        stdio: 'inherit',
        env: {
            ...process.env,
            PORT: port.toString(),
            HOSTNAME: host,
            NODE_ENV: 'production',
        },
        shell: process.platform === 'win32',
    });
    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill('SIGTERM');
    });
    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down server...');
        serverProcess.kill('SIGTERM');
    });
    // Wait for the server process to exit
    await new Promise((resolve) => {
        serverProcess.on('close', () => {
            console.log('✅ Server shut down gracefully');
            resolve();
        });
    });
}
function webUIEmbedded(cmd) {
    cmd.command('start-web')
        .description('Start embedded web UI server')
        .option('-p, --port <port>', 'Port to run the server on', '3090')
        .option('-H, --host <host>', 'Host to bind the server to (use 0.0.0.0 for LAN access)', 'localhost')
        .action(async (options) => {
        const port = parseInt(options.port, 10);
        const host = options.host;
        await startEmbeddedWebUI(port, host);
    });
}
//# sourceMappingURL=web-ui-embedded.js.map