import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.easy-tracking');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

export function loadConfig() {
    ensureConfigDir();
    
    if (!fs.existsSync(CONFIG_FILE)) {
        return {
            githubToken: null,
            githubUsername: null,
            reportDir: path.join(os.homedir(), 'daily-reports'),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
    
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

export function saveConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function isConfigured() {
    const config = loadConfig();
    return config.githubToken && config.githubUsername;
}