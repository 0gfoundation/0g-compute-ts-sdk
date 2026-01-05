#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const update_notifier_1 = tslib_1.__importDefault(require("update-notifier"));
const fine_tuning_1 = tslib_1.__importDefault(require("./fine-tuning"));
const ledger_1 = tslib_1.__importDefault(require("./ledger"));
const inference_1 = tslib_1.__importDefault(require("./inference"));
const web_ui_embedded_1 = tslib_1.__importDefault(require("./web-ui-embedded"));
const network_1 = tslib_1.__importDefault(require("./network"));
const auth_1 = tslib_1.__importDefault(require("./auth"));
const controller_1 = tslib_1.__importDefault(require("./controller"));
const package_json_1 = tslib_1.__importDefault(require("../../package.json"));
exports.program = new commander_1.Command();
exports.program
    .name('0g-compute-cli')
    .description('CLI for interacting with ZG Compute Network')
    .version('0.6.3');
(0, ledger_1.default)(exports.program);
// Create subcommands for each service
const fineTuningCmd = exports.program
    .command('fine-tuning')
    .alias('ft')
    .description('Fine-tuning service commands');
const inferenceCmd = exports.program
    .command('inference')
    .alias('inf')
    .description('Inference service commands');
const webUICmd = exports.program
    .command('web-ui')
    .alias('ui')
    .description('Web UI embedded commands');
const controllerCmd = exports.program
    .command('controller')
    .alias('ctrl')
    .description('Controller commands for managing provider containers');
// Register commands to their respective groups
(0, fine_tuning_1.default)(fineTuningCmd);
(0, inference_1.default)(inferenceCmd);
(0, web_ui_embedded_1.default)(webUICmd);
(0, controller_1.default)(controllerCmd);
// Register network configuration commands at the root level
(0, network_1.default)(exports.program);
// Register auth commands at the root level
(0, auth_1.default)(exports.program);
// Detect package manager
function getPackageManager() {
    const userAgent = process.env.npm_config_user_agent || '';
    if (userAgent.includes('pnpm'))
        return 'pnpm';
    if (userAgent.includes('yarn'))
        return 'yarn';
    if (userAgent.includes('bun'))
        return 'bun';
    return 'npm';
}
// Display update notification
function showUpdateNotification(updateInfo) {
    const { current, latest, name } = updateInfo;
    const pm = getPackageManager();
    const installCmd = pm === 'yarn' ? `yarn global add ${name}` : `${pm} add -g ${name}`;
    const line1 = `Update available: ${current} → ${latest}`;
    const line2 = `Run: ${installCmd}`;
    const width = Math.max(line1.length, line2.length) + 4;
    console.log('\n' + '╭' + '─'.repeat(width) + '╮');
    console.log('│ ' + line1.padEnd(width - 1) + '│');
    console.log('│ ' + line2.padEnd(width - 1) + '│');
    console.log('╰' + '─'.repeat(width) + '╯\n');
}
// Check for updates (non-blocking on first run)
;
(async () => {
    try {
        const notifier = (0, update_notifier_1.default)({
            pkg: package_json_1.default,
            updateCheckInterval: 1000 * 60 * 60 * 24, // Check once per day
        });
        // Strategy: Use cache first (instant), fallback to fetch with timeout
        let updateInfo = notifier.update;
        if (!updateInfo) {
            // No cache, fetch with timeout to avoid blocking too long
            const fetchPromise = notifier.fetchInfo();
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(undefined), 2000));
            updateInfo = await Promise.race([fetchPromise, timeoutPromise]);
        }
        if (updateInfo?.type && updateInfo.type !== 'latest') {
            showUpdateNotification(updateInfo);
        }
    }
    catch {
        // Silently fail - don't block CLI usage
    }
    exports.program.parse(process.argv);
})();
//# sourceMappingURL=cli.js.map