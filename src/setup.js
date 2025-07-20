import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, saveConfig } from './config.js';
import { GitHubService } from './github.js';

export async function runSetup() {
    console.log(chalk.blue.bold('\n🚀 Welcome to Easy Tracking Process Setup!\n'));
    
    const config = loadConfig();
    
    console.log('This tool will automatically track your GitHub activity and generate daily reports.');
    console.log('You\'ll need a GitHub Personal Access Token to get started.\n');
    
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'githubToken',
            message: 'Enter your GitHub Personal Access Token:',
            validate: (input) => input.length > 0 || 'Please enter a valid token',
            default: config.githubToken
        },
        {
            type: 'input',
            name: 'githubUsername',
            message: 'Enter your GitHub username:',
            validate: (input) => input.length > 0 || 'Please enter your username',
            default: config.githubUsername
        },
        {
            type: 'input',
            name: 'reportDir',
            message: 'Where should daily reports be saved?',
            default: config.reportDir,
            validate: (input) => input.length > 0 || 'Please enter a valid directory path'
        }
    ]);

    // Test GitHub connection
    console.log(chalk.yellow('\n🔍 Testing GitHub connection...'));
    
    try {
        const tempConfig = { ...config, ...answers };
        saveConfig(tempConfig);
        
        const github = new GitHubService();
        await github.getUserRepos();
        
        console.log(chalk.green('✅ GitHub connection successful!'));
        
        // Test getting today's activity
        console.log(chalk.yellow('📊 Fetching today\'s activity...'));
        const activity = await github.getUserActivity();
        console.log(chalk.green(`✅ Found ${activity.totalActivity} activities for today!`));
        
        console.log(chalk.blue.bold('\n🎉 Setup completed successfully!'));
        console.log(chalk.white('You can now run:'));
        console.log(chalk.cyan('  npm start        ') + chalk.gray('- Generate today\'s report'));
        console.log(chalk.cyan('  npm run dev      ') + chalk.gray('- Run in watch mode'));
        
    } catch (error) {
        console.log(chalk.red('❌ Setup failed:', error.message));
        console.log(chalk.yellow('\nPlease check your GitHub token and try again.'));
        console.log(chalk.gray('To create a token: https://github.com/settings/tokens'));
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runSetup().catch(console.error);
}