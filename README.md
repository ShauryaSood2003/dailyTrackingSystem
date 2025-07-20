# Easy Tracking Process 🚀

Automate your daily progress tracking by analyzing your GitHub activity and generating comprehensive reports. Perfect for startup teams that want to eliminate manual status updates!

## ✨ Features

- **Automatic GitHub Activity Tracking**: Monitors commits, pull requests, and issues
- **Smart Analysis**: Categorizes work by type (features, fixes, refactoring, etc.)
- **Multiple Report Formats**: Generates Markdown, JSON, and text reports
- **Time Distribution Analysis**: Shows when you're most productive
- **Productivity Scoring**: Quantifies your daily output
- **Automated Scheduling**: Can run automatically at end of day
- **Local Storage**: Saves reports to your computer for easy access

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run setup**:
   ```bash
   npm run setup
   ```
   
   You'll need:
   - GitHub Personal Access Token ([create one here](https://github.com/settings/tokens))
   - Your GitHub username
   - Directory path for saving reports

## 🚀 Usage

### Generate Today's Report
```bash
npm start
```

### Generate Yesterday's Report
```bash
npm start -- --yesterday
```

### Generate Report for Specific Date
```bash
npm start -- --date 2024-01-15
```

### Start Automated Daily Reporting
```bash
npm start -- --schedule
```
Reports will be automatically generated at 6 PM every day.

### Development Mode
```bash
npm run dev
```

## 📊 What Gets Tracked

- **Commits**: All commits you made to any repository
- **Pull Requests**: PRs you opened or updated
- **Issues**: Issues you created or commented on
- **Time Distribution**: When during the day you were active
- **Work Categories**: Automatically categorizes commits as features, fixes, docs, etc.

## 📁 Report Structure

Reports are saved in three formats:

### Markdown (`YYYY-MM-DD-report.md`)
Beautiful, formatted report with:
- Activity summary with productivity score
- Detailed commit history grouped by repository
- Pull request and issue tracking
- Time distribution analysis
- Personalized recommendations

### JSON (`YYYY-MM-DD-report.json`)
Machine-readable format containing:
- Raw activity data
- Complete analysis results
- Metadata and timestamps

### Text (`YYYY-MM-DD-report.txt`)
Simple text format for quick reading

## 🎯 Perfect For

- **Startup Teams**: Eliminate manual daily standups
- **Remote Workers**: Track and communicate progress easily
- **Freelancers**: Generate client reports automatically
- **Personal Productivity**: Understand your coding patterns

## 🛠️ Configuration

Configuration is stored in `~/.easy-tracking/config.json`:

```json
{
  "githubToken": "your-token-here",
  "githubUsername": "your-username",
  "reportDir": "/path/to/reports",
  "timezone": "America/New_York"
}
```

## 📈 Sample Report Output

```markdown
# Daily Progress Report - Monday, January 15, 2024

## 📊 Summary
- **Total Commits:** 8
- **Pull Requests:** 2
- **Issues:** 1
- **Repositories:** 3
- **Productivity Level:** HIGH (Score: 25)

## 💻 Commits (8)

### company/backend-api
- **[a1b2c3d](https://github.com/company/backend-api/commit/a1b2c3d)** (10:30 AM) [feature] Add user authentication endpoint
- **[e4f5g6h](https://github.com/company/backend-api/commit/e4f5g6h)** (2:15 PM) [fix] Fix validation bug in user registration

### company/frontend-app
- **[i7j8k9l](https://github.com/company/frontend-app/commit/i7j8k9l)** (11:45 AM) [feature] Implement login form component
```

## 🔐 Security

- GitHub token is stored locally and never transmitted
- All data processing happens on your machine
- Reports are saved locally to your specified directory

## 🤝 Contributing

This tool is designed to be simple and focused. Feel free to customize it for your team's specific needs!

## 📝 License

MIT License - feel free to use and modify for your team!