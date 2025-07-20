import inquirer from 'inquirer';
import chalk from 'chalk';
import { loadConfig, saveConfig } from './config.js';
import { GitHubService } from './github.js';
import { GitIntegration } from './git.js';

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

    // Ask about Git integration
    console.log(chalk.blue('\n🔗 Git Integration Setup (Optional)'));
    console.log('You can automatically commit and push daily reports to a shared team repository.');
    
    const gitAnswers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'enableGitIntegration',
            message: 'Do you want to enable Git integration?',
            default: config.gitIntegration?.enabled || false
        }
    ]);

    let gitConfig = { enabled: false };
    
    if (gitAnswers.enableGitIntegration) {
        const gitDetails = await inquirer.prompt([
            {
                type: 'input',
                name: 'repoPath',
                message: 'Enter the path to your team\'s daily-tracking repository:',
                default: config.gitIntegration?.repoPath || '/home/shaurya/Desktop/daily-tracking',
                validate: (input) => input.length > 0 || 'Please enter a valid repository path'
            },
            {
                type: 'input',
                name: 'userFolder',
                message: 'Enter your folder name in the repository:',
                default: config.gitIntegration?.userFolder || answers.githubUsername,
                validate: (input) => input.length > 0 || 'Please enter a valid folder name'
            },
            {
                type: 'confirm',
                name: 'autoCommit',
                message: 'Auto-commit reports?',
                default: config.gitIntegration?.autoCommit !== false
            },
            {
                type: 'confirm',
                name: 'autoPush',
                message: 'Auto-push to remote?',
                default: config.gitIntegration?.autoPush !== false
            }
        ]);

        // Validate Git repository
        console.log(chalk.yellow('🔍 Validating Git repository...'));
        const git = new GitIntegration();
        const validation = await git.validateGitRepo(gitDetails.repoPath);
        
        if (!validation.valid) {
            console.log(chalk.red(`❌ Git validation failed: ${validation.error}`));
            console.log(chalk.yellow('💡 Git integration will be disabled. You can run setup again later.'));
            gitConfig = { enabled: false };
        } else {
            const branch = await git.getCurrentBranch(gitDetails.repoPath);
            const remote = await git.getRemoteUrl(gitDetails.repoPath);
            
            console.log(chalk.green('✅ Git repository validated successfully!'));
            console.log(chalk.gray(`📁 Repository: ${gitDetails.repoPath}`));
            console.log(chalk.gray(`🌿 Branch: ${branch}`));
            console.log(chalk.gray(`🔗 Remote: ${remote}`));
            
            gitConfig = {
                enabled: true,
                repoPath: gitDetails.repoPath,
                userFolder: gitDetails.userFolder,
                autoCommit: gitDetails.autoCommit,
                autoPush: gitDetails.autoPush
            };
        }
    }

    // Test GitHub connection
    console.log(chalk.yellow('\n🔍 Testing GitHub connection...'));
    
    try {
        const tempConfig = { ...config, ...answers, gitIntegration: gitConfig };
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
        
        if (gitConfig.enabled) {
            console.log(chalk.green('\n🔗 Git Integration Enabled:'));
            console.log(chalk.gray(`  📁 Reports will be saved to: ${gitConfig.repoPath}/${gitConfig.userFolder}/`));
            console.log(chalk.gray(`  🤖 Auto-commit: ${gitConfig.autoCommit ? 'Yes' : 'No'}`));
            console.log(chalk.gray(`  🚀 Auto-push: ${gitConfig.autoPush ? 'Yes' : 'No'}`));
        }
        
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