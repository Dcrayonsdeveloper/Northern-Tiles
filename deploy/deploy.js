#!/usr/bin/env node
/**
 * Smart Deployment Script for Laravel + Vite
 *
 * Features:
 * - Detects changed files since last deployment
 * - Only uploads changed files via SSH/SCP
 * - Auto-builds frontend when needed
 * - Clears Laravel caches after deployment
 *
 * Usage:
 *   node deploy/deploy.js              # Deploy changed files
 *   node deploy/deploy.js --all        # Deploy all tracked files
 *   node deploy/deploy.js --build      # Force build before deploy
 *   node deploy/deploy.js --watch      # Watch mode (continuous sync)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const STATE_PATH = path.join(__dirname, '.deploy-state.json');

// Load config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

// Get file hash for change detection
function getFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    } catch {
        return null;
    }
}

// Load previous deployment state
function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch {
        return { files: {}, lastDeploy: null, lastBuild: null };
    }
}

// Save deployment state
function saveState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Get all tracked files using glob patterns
function getTrackedFiles() {
    const files = [];
    const { glob } = require('glob');

    for (const pattern of config.watch_paths) {
        try {
            const matches = glob.sync(pattern, {
                cwd: ROOT_DIR,
                ignore: config.ignore_patterns,
                nodir: true,
            });
            files.push(...matches);
        } catch (e) {
            // glob might not be installed, use alternative
        }
    }

    // Fallback: use git to get tracked files
    if (files.length === 0) {
        try {
            const gitFiles = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf8' })
                .split('\n')
                .filter(f => f.trim())
                .filter(f => {
                    // Filter by watch patterns
                    return config.watch_paths.some(pattern => {
                        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                        return regex.test(f);
                    });
                });
            files.push(...gitFiles);
        } catch (e) {
            logError('Failed to get file list');
        }
    }

    return [...new Set(files)];
}

// Get changed files since last deployment
function getChangedFiles(state, forceAll = false) {
    const trackedFiles = getTrackedFiles();
    const changedFiles = [];
    const newHashes = {};

    for (const file of trackedFiles) {
        const fullPath = path.join(ROOT_DIR, file);
        const hash = getFileHash(fullPath);

        if (hash) {
            newHashes[file] = hash;
            if (forceAll || !state.files[file] || state.files[file] !== hash) {
                changedFiles.push(file);
            }
        }
    }

    return { changedFiles, newHashes };
}

// Check if build is needed
function needsBuild(changedFiles) {
    return changedFiles.some(file => {
        return config.build_triggers.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(file);
        });
    });
}

// Run npm build
function runBuild() {
    logStep('BUILD', 'Building frontend assets...');
    try {
        execSync('npm run build', {
            cwd: ROOT_DIR,
            stdio: 'inherit',
            shell: true
        });
        logSuccess('Build completed');
        return true;
    } catch (e) {
        logError('Build failed');
        return false;
    }
}

// Upload a single file via SCP
function uploadFile(localPath, remotePath) {
    const { ssh } = config;
    const fullLocalPath = path.join(ROOT_DIR, localPath);
    const fullRemotePath = `${ssh.host}:${ssh.remote_path}/${localPath}`;

    try {
        // Ensure remote directory exists
        const remoteDir = path.dirname(`${ssh.remote_path}/${localPath}`);
        execSync(`ssh ${ssh.host} "mkdir -p ${remoteDir}"`, {
            stdio: 'pipe',
            shell: true
        });

        // Upload file
        execSync(`scp "${fullLocalPath}" "${fullRemotePath}"`, {
            stdio: 'pipe',
            shell: true
        });
        return true;
    } catch (e) {
        return false;
    }
}

// Upload build directory
function uploadBuild() {
    const { ssh } = config;
    logStep('UPLOAD', 'Uploading build assets...');

    try {
        // Create zip of build
        execSync('powershell -Command "Compress-Archive -Path \'public\\build\\*\' -DestinationPath \'deploy\\build.zip\' -Force"', {
            cwd: ROOT_DIR,
            stdio: 'pipe',
            shell: true
        });

        // Upload zip
        execSync(`scp "${path.join(ROOT_DIR, 'deploy', 'build.zip')}" ${ssh.host}:${ssh.remote_path}/`, {
            stdio: 'pipe',
            shell: true
        });

        // Extract on server
        execSync(`ssh ${ssh.host} "cd ${ssh.remote_path} && rm -rf public/build/* && unzip -o build.zip -d public/build/ && rm build.zip"`, {
            stdio: 'pipe',
            shell: true
        });

        // Clean up local zip
        fs.unlinkSync(path.join(ROOT_DIR, 'deploy', 'build.zip'));

        logSuccess('Build assets uploaded');
        return true;
    } catch (e) {
        logError('Failed to upload build assets: ' + e.message);
        return false;
    }
}

// Upload changed files
function uploadFiles(files) {
    const { ssh } = config;
    let uploaded = 0;
    let failed = 0;

    // Group files by directory for efficiency
    const fileGroups = {};
    for (const file of files) {
        const dir = path.dirname(file);
        if (!fileGroups[dir]) fileGroups[dir] = [];
        fileGroups[dir].push(file);
    }

    for (const [dir, dirFiles] of Object.entries(fileGroups)) {
        // Ensure remote directory exists
        try {
            execSync(`ssh ${ssh.host} "mkdir -p ${ssh.remote_path}/${dir}"`, {
                stdio: 'pipe',
                shell: true
            });
        } catch (e) {
            logError(`Failed to create directory: ${dir}`);
            continue;
        }

        for (const file of dirFiles) {
            process.stdout.write(`  Uploading ${file}... `);
            if (uploadFile(file, file)) {
                console.log(`${colors.green}✓${colors.reset}`);
                uploaded++;
            } else {
                console.log(`${colors.red}✗${colors.reset}`);
                failed++;
            }
        }
    }

    return { uploaded, failed };
}

// Clear Laravel caches
function clearCaches() {
    const { ssh, php_path } = config;
    logStep('CACHE', 'Clearing Laravel caches...');

    try {
        for (const cmd of config.post_deploy_commands) {
            execSync(`ssh ${ssh.host} "cd ${ssh.remote_path} && ${php_path} artisan ${cmd}"`, {
                stdio: 'pipe',
                shell: true
            });
        }
        logSuccess('Caches cleared');
        return true;
    } catch (e) {
        logError('Failed to clear caches');
        return false;
    }
}

// Main deployment function
async function deploy(options = {}) {
    const startTime = Date.now();
    log('\n🚀 Starting deployment...', 'bright');
    log('─'.repeat(50));

    // Load state
    const state = loadState();

    // Get changed files
    logStep('SCAN', 'Detecting changed files...');
    const { changedFiles, newHashes } = getChangedFiles(state, options.all);

    if (changedFiles.length === 0 && !options.build) {
        logSuccess('No changes detected. Nothing to deploy.');
        return;
    }

    log(`  Found ${changedFiles.length} changed file(s)`, 'yellow');

    // Check if build is needed
    const shouldBuild = options.build || needsBuild(changedFiles);

    if (shouldBuild) {
        if (!runBuild()) {
            logError('Deployment aborted due to build failure');
            return;
        }
    }

    // Filter out frontend source files if we built (they're in public/build now)
    const filesToUpload = changedFiles.filter(f => {
        if (shouldBuild) {
            // Skip source files that are compiled into build
            return !f.startsWith('resources/js/') &&
                   !f.startsWith('resources/scss/') &&
                   !f.startsWith('resources/css/');
        }
        return true;
    });

    // Upload build if needed
    if (shouldBuild) {
        uploadBuild();
    }

    // Upload changed files
    if (filesToUpload.length > 0) {
        logStep('UPLOAD', `Uploading ${filesToUpload.length} file(s)...`);
        const { uploaded, failed } = uploadFiles(filesToUpload);

        if (failed > 0) {
            logWarning(`${failed} file(s) failed to upload`);
        }
        logSuccess(`${uploaded} file(s) uploaded successfully`);
    }

    // Clear caches
    clearCaches();

    // Save new state
    state.files = { ...state.files, ...newHashes };
    state.lastDeploy = new Date().toISOString();
    if (shouldBuild) {
        state.lastBuild = new Date().toISOString();
    }
    saveState(state);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log('─'.repeat(50));
    logSuccess(`Deployment completed in ${duration}s`);
    log('');
}

// Watch mode
function watchMode() {
    log('\n👁 Watch mode enabled. Monitoring for changes...', 'cyan');
    log('Press Ctrl+C to stop\n');

    const chokidar = require('chokidar');
    let debounceTimer = null;
    let pendingFiles = new Set();

    const watcher = chokidar.watch(config.watch_paths, {
        cwd: ROOT_DIR,
        ignored: config.ignore_patterns,
        persistent: true,
        ignoreInitial: true,
    });

    watcher.on('change', (filePath) => {
        pendingFiles.add(filePath);
        log(`  Changed: ${filePath}`, 'yellow');

        // Debounce - wait for more changes
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const files = [...pendingFiles];
            pendingFiles.clear();

            log(`\n📦 Deploying ${files.length} changed file(s)...`);

            // Quick deploy just the changed files
            const shouldBuild = needsBuild(files);

            if (shouldBuild) {
                runBuild();
                uploadBuild();
            }

            const nonBuildFiles = files.filter(f =>
                !f.startsWith('resources/js/') &&
                !f.startsWith('resources/scss/')
            );

            if (nonBuildFiles.length > 0) {
                uploadFiles(nonBuildFiles);
            }

            clearCaches();
            log('\n👁 Watching for changes...\n', 'cyan');
        }, 1000);
    });

    watcher.on('add', (filePath) => {
        log(`  Added: ${filePath}`, 'green');
        pendingFiles.add(filePath);
    });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    all: args.includes('--all'),
    build: args.includes('--build'),
    watch: args.includes('--watch'),
};

// Run
if (options.watch) {
    watchMode();
} else {
    deploy(options);
}
