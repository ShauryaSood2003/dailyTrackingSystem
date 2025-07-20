#!/usr/bin/env node

import chalk from 'chalk';
import cron from 'node-cron';
import { GitHubService } from './github.js';
import { ActivityAnalyzer } from './analyzer.js';
import { ReportGenerator } from './reporter.js';
import { isConfigured, isGitIntegrationConfigured } from './config.js';
import { runSetup } from './setup.js';
import { GitIntegration } from './git.js';
import { InteractiveInput } from './interactive.js';

class EasyTrackingProcess {
    constructor() {
        this.github = null;
        this.analyzer = new ActivityAnalyzer();
        this.reporter = new ReportGenerator();
        this.git = null;
        this.interactive = new InteractiveInput();
    }

    async init() {
        if (!isConfigured()) {
            console.log(chalk.yellow('⚠️  Configuration not found. Running setup...'));
            await runSetup();
        }
        
        this.github = new GitHubService();
        
        if (isGitIntegrationConfigured()) {
            this.git = new GitIntegration();
        }
    }

    async generateDailyReport(date = new Date()) {
        try {
            console.log(chalk.blue(`📊 Generating report for ${date.toDateString()}...`));
            
            // Fetch GitHub activity
            console.log(chalk.gray('🔍 Fetching GitHub activity...'));
            const activityData = await this.github.getUserActivity(date);
            
            if (activityData.totalActivity === 0) {
                console.log(chalk.yellow('⚠️  No activity found for today.'));
                return;
            }
            
            // Analyze the activity
            console.log(chalk.gray('🧠 Analyzing activity patterns...'));
            const analysis = this.analyzer.analyzeActivity(activityData);
            
            // Collect manual input
            let manualData = null;
            const wantManualInput = await this.interactive.askForManualInput();
            if (wantManualInput) {
                manualData = await this.interactive.collectManualInput();
            }
            
            // Generate reports
            console.log(chalk.gray('📝 Generating reports...'));
            const report = this.reporter.generateReport(activityData, analysis, manualData);
            
            // Save reports
            console.log(chalk.gray('💾 Saving reports...'));
            const savedFiles = await this.reporter.saveReport(report, date);
            
            // Display summary
            console.log(chalk.green.bold('✅ Daily report generated successfully!'));
            console.log(chalk.white('\n📊 Summary:'));
            console.log(chalk.cyan(`  • ${analysis.summary.totalCommits} commits`));
            console.log(chalk.cyan(`  • ${analysis.summary.totalPullRequests} pull requests`));
            console.log(chalk.cyan(`  • ${analysis.summary.totalIssues} issues`));
            console.log(chalk.cyan(`  • ${analysis.summary.repositoriesWorkedOn.length} repositories`));
            console.log(chalk.cyan(`  • Productivity: ${analysis.productivity.level.toUpperCase()}`));
            
            console.log(chalk.white('\n📁 Report saved to:'));
            console.log(chalk.gray(`  • ${savedFiles.markdown}`));
            
            // Git integration
            if (this.git) {
                console.log(chalk.gray('\n🔗 Git integration enabled...'));
                const gitSuccess = await this.git.commitAndPushReport(savedFiles.markdown, date);
                if (!gitSuccess) {
                    console.log(chalk.yellow('💡 You can manually commit the report later'));
                }
            }
            
            if (analysis.recommendations.length > 0) {
                console.log(chalk.white('\n💡 Recommendations:'));
                analysis.recommendations.forEach(rec => {
                    console.log(chalk.yellow(`  • ${rec}`));
                });
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Error generating report:'), error.message);
            throw error;
        }
    }

    async startScheduler() {
        console.log(chalk.blue.bold('🕐 Starting automated daily reporting...'));
        console.log(chalk.gray('Reports will be generated automatically at 6 PM every day.'));
        
        // Schedule for 6 PM every day
        cron.schedule('0 18 * * *', async () => {
            console.log(chalk.yellow('⏰ Scheduled report generation started...'));
            await this.generateDailyReport();
        });
        
        // Also generate report now if it's past 6 PM and no report exists for today
        const now = new Date();
        if (now.getHours() >= 18) {
            console.log(chalk.yellow('🔄 Generating today\'s report now...'));
            await this.generateDailyReport();
        }
        
        console.log(chalk.green('✅ Scheduler started. Press Ctrl+C to stop.'));
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n👋 Stopping scheduler...'));
            process.exit(0);
        });
    }

    async runInteractive() {
        const args = process.argv.slice(2);
        
        if (args.includes('--schedule') || args.includes('-s')) {
            await this.startScheduler();
        } else if (args.includes('--setup')) {
            await runSetup();
        } else if (args.includes('--yesterday')) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            await this.generateDailyReport(yesterday);
        } else if (args.includes('--date')) {
            const dateIndex = args.indexOf('--date');
            const dateStr = args[dateIndex + 1];
            if (dateStr) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    await this.generateDailyReport(date);
                } else {
                    console.log(chalk.red('❌ Invalid date format. Use YYYY-MM-DD'));
                }
            } else {
                console.log(chalk.red('❌ Please provide a date with --date YYYY-MM-DD'));
            }
        } else {
            // Default: generate today's report
            await this.generateDailyReport();
        }
    }
}

async function main() {
    const app = new EasyTrackingProcess();
    
    try {
        await app.init();
        await app.runInteractive();
    } catch (error) {
        console.error(chalk.red('💥 Application error:'), error.message);
        process.exit(1);
    }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(chalk.blue.bold('\n📚 Easy Tracking Process - Help\n'));
    console.log(chalk.white('Usage: npm start [options]\n'));
    console.log(chalk.cyan('Options:'));
    console.log(chalk.white('  --setup           ') + chalk.gray('Run initial setup'));
    console.log(chalk.white('  --schedule, -s    ') + chalk.gray('Start automated daily reporting'));
    console.log(chalk.white('  --yesterday       ') + chalk.gray('Generate report for yesterday'));
    console.log(chalk.white('  --date YYYY-MM-DD ') + chalk.gray('Generate report for specific date'));
    console.log(chalk.white('  --help, -h        ') + chalk.gray('Show this help message'));
    console.log(chalk.white('\nExamples:'));
    console.log(chalk.gray('  npm start                    # Generate today\'s report'));
    console.log(chalk.gray('  npm start -- --yesterday     # Generate yesterday\'s report'));
    console.log(chalk.gray('  npm start -- --schedule      # Start automated reporting'));
    console.log(chalk.gray('  npm start -- --date 2024-01-15  # Generate report for specific date'));
    process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}