import fs from 'fs';
import path from 'path';
import { loadConfig } from './config.js';

export class ReportGenerator {
    constructor() {
        this.config = loadConfig();
    }

    generateReport(activityData, analysis) {
        const report = {
            markdown: this.generateMarkdownReport(activityData, analysis),
            json: this.generateJsonReport(activityData, analysis),
            text: this.generateTextReport(activityData, analysis)
        };

        return report;
    }

    generateMarkdownReport(activityData, analysis) {
        const date = new Date(activityData.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let markdown = `# Daily Progress Report - ${date}\n\n`;

        // Summary section
        markdown += `## 📊 Summary\n\n`;
        markdown += `- **Total Commits:** ${analysis.summary.totalCommits}\n`;
        markdown += `- **Pull Requests:** ${analysis.summary.totalPullRequests}\n`;
        markdown += `- **Issues:** ${analysis.summary.totalIssues}\n`;
        markdown += `- **Repositories:** ${analysis.summary.repositoriesWorkedOn.length}\n`;
        markdown += `- **Productivity Level:** ${analysis.productivity.level.toUpperCase()} (Score: ${analysis.productivity.score})\n\n`;

        if (analysis.summary.firstActivity && analysis.summary.lastActivity) {
            const startTime = new Date(analysis.summary.firstActivity.timestamp).toLocaleTimeString();
            const endTime = new Date(analysis.summary.lastActivity.timestamp).toLocaleTimeString();
            markdown += `- **Active Period:** ${startTime} - ${endTime}\n\n`;
        }

        // Commits section
        if (activityData.commits.length > 0) {
            markdown += `## 💻 Commits (${activityData.commits.length})\n\n`;
            
            // Group by repository
            const commitsByRepo = activityData.commits.reduce((acc, commit) => {
                if (!acc[commit.repo]) acc[commit.repo] = [];
                acc[commit.repo].push(commit);
                return acc;
            }, {});

            Object.entries(commitsByRepo).forEach(([repo, commits]) => {
                markdown += `### ${repo}\n\n`;
                commits.forEach(commit => {
                    const time = new Date(commit.timestamp).toLocaleTimeString();
                    const category = analysis.commitAnalysis.detailedCommits.find(c => c.sha === commit.sha)?.category || 'other';
                    markdown += `- **[${commit.sha}](${commit.url})** (${time}) [${category}] ${commit.message.split('\\n')[0]}\n`;
                });
                markdown += `\n`;
            });
        }

        // Pull Requests section
        if (activityData.pullRequests.length > 0) {
            markdown += `## 🔄 Pull Requests (${activityData.pullRequests.length})\n\n`;
            activityData.pullRequests.forEach(pr => {
                const time = new Date(pr.timestamp).toLocaleTimeString();
                const status = pr.state === 'open' ? '🟡' : pr.state === 'closed' ? '🔴' : '🟢';
                markdown += `- ${status} **[#${pr.number}](${pr.url})** (${time}) ${pr.title}\n`;
                markdown += `  - Repository: ${pr.repo}\n`;
            });
            markdown += `\n`;
        }

        // Issues section
        if (activityData.issues.length > 0) {
            markdown += `## 🐛 Issues (${activityData.issues.length})\n\n`;
            activityData.issues.forEach(issue => {
                const time = new Date(issue.timestamp).toLocaleTimeString();
                const status = issue.state === 'open' ? '🟡' : '🟢';
                markdown += `- ${status} **[#${issue.number}](${issue.url})** (${time}) ${issue.title}\n`;
                markdown += `  - Repository: ${issue.repo}\n`;
            });
            markdown += `\n`;
        }

        // Analysis section
        markdown += `## 📈 Analysis\n\n`;

        // Commit categories
        if (Object.keys(analysis.commitAnalysis.byCategory).length > 0) {
            markdown += `### Commit Categories\n\n`;
            Object.entries(analysis.commitAnalysis.byCategory).forEach(([category, count]) => {
                const emoji = this.getCategoryEmoji(category);
                markdown += `- ${emoji} **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${count}\n`;
            });
            markdown += `\n`;
        }

        // Time distribution
        markdown += `### Time Distribution\n\n`;
        Object.entries(analysis.timeDistribution).forEach(([period, count]) => {
            if (count > 0) {
                const emoji = this.getPeriodEmoji(period);
                markdown += `- ${emoji} **${period.charAt(0).toUpperCase() + period.slice(1)}:** ${count} activities\n`;
            }
        });
        markdown += `\n`;

        // Recommendations
        if (analysis.recommendations.length > 0) {
            markdown += `## 💡 Recommendations\n\n`;
            analysis.recommendations.forEach(rec => {
                markdown += `- ${rec}\n`;
            });
            markdown += `\n`;
        }

        markdown += `---\n`;
        markdown += `*Report generated on ${new Date().toLocaleString()} by Easy Tracking Process*\n`;

        return markdown;
    }

    generateJsonReport(activityData, analysis) {
        return JSON.stringify({
            date: activityData.date,
            generated: new Date().toISOString(),
            activity: activityData,
            analysis: analysis
        }, null, 2);
    }

    generateTextReport(activityData, analysis) {
        const date = new Date(activityData.date).toLocaleDateString();
        let text = `DAILY PROGRESS REPORT - ${date}\n`;
        text += `${'='.repeat(50)}\n\n`;

        text += `SUMMARY:\n`;
        text += `- Commits: ${analysis.summary.totalCommits}\n`;
        text += `- Pull Requests: ${analysis.summary.totalPullRequests}\n`;
        text += `- Issues: ${analysis.summary.totalIssues}\n`;
        text += `- Repositories: ${analysis.summary.repositoriesWorkedOn.length}\n`;
        text += `- Productivity: ${analysis.productivity.level.toUpperCase()}\n\n`;

        if (activityData.commits.length > 0) {
            text += `COMMITS:\n`;
            activityData.commits.forEach(commit => {
                text += `- [${commit.sha}] ${commit.message.split('\\n')[0]} (${commit.repo})\n`;
            });
            text += `\n`;
        }

        if (activityData.pullRequests.length > 0) {
            text += `PULL REQUESTS:\n`;
            activityData.pullRequests.forEach(pr => {
                text += `- #${pr.number}: ${pr.title} (${pr.repo}) [${pr.state}]\n`;
            });
            text += `\n`;
        }

        return text;
    }

    getCategoryEmoji(category) {
        const emojis = {
            feature: '✨',
            fix: '🐛',
            refactor: '♻️',
            docs: '📚',
            style: '💄',
            test: '🧪',
            chore: '🔧',
            config: '⚙️',
            other: '📝'
        };
        return emojis[category] || '📝';
    }

    getPeriodEmoji(period) {
        const emojis = {
            morning: '🌅',
            afternoon: '☀️',
            evening: '🌆',
            night: '🌙'
        };
        return emojis[period] || '⏰';
    }

    async saveReport(report, date) {
        const reportDir = this.config.reportDir;
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const dateStr = new Date(date).toISOString().split('T')[0];

        const files = {
            markdown: path.join(reportDir, `${dateStr}-report.md`)
        };

        try {
            await fs.promises.writeFile(files.markdown, report.markdown);
            return files;
        } catch (error) {
            console.error('Error saving reports:', error);
            throw error;
        }
    }
}