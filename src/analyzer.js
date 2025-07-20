export class ActivityAnalyzer {
    constructor() {
        this.commitPatterns = {
            feature: /^(feat|feature|add|implement)/i,
            fix: /^(fix|bug|hotfix|patch)/i,
            refactor: /^(refactor|restructure|optimize)/i,
            docs: /^(docs|doc|documentation)/i,
            style: /^(style|format|lint)/i,
            test: /^(test|spec|testing)/i,
            chore: /^(chore|maintenance|update|upgrade)/i,
            config: /^(config|setup|env)/i
        };
    }

    analyzeActivity(activityData) {
        const analysis = {
            summary: this.generateSummary(activityData),
            commitAnalysis: this.analyzeCommits(activityData.commits),
            productivity: this.calculateProductivity(activityData),
            timeDistribution: this.analyzeTimeDistribution(activityData),
            recommendations: this.generateRecommendations(activityData)
        };

        return analysis;
    }

    generateSummary(activityData) {
        const { commits, pullRequests, issues } = activityData;
        
        return {
            totalCommits: commits.length,
            totalPullRequests: pullRequests.length,
            totalIssues: issues.length,
            repositoriesWorkedOn: [...new Set([
                ...commits.map(c => c.repo),
                ...pullRequests.map(pr => pr.repo),
                ...issues.map(i => i.repo)
            ])],
            firstActivity: this.getFirstActivity(activityData),
            lastActivity: this.getLastActivity(activityData)
        };
    }

    analyzeCommits(commits) {
        const categories = {};
        const repos = {};
        
        commits.forEach(commit => {
            // Categorize commit by type
            const category = this.categorizeCommit(commit.message);
            categories[category] = (categories[category] || 0) + 1;
            
            // Track commits per repo
            repos[commit.repo] = (repos[commit.repo] || 0) + 1;
        });

        return {
            byCategory: categories,
            byRepository: repos,
            detailedCommits: commits.map(commit => ({
                ...commit,
                category: this.categorizeCommit(commit.message),
                impact: this.assessCommitImpact(commit.message)
            }))
        };
    }

    categorizeCommit(message) {
        for (const [category, pattern] of Object.entries(this.commitPatterns)) {
            if (pattern.test(message)) {
                return category;
            }
        }
        return 'other';
    }

    assessCommitImpact(message) {
        const lines = message.split('\n');
        const firstLine = lines[0].toLowerCase();
        
        if (firstLine.includes('major') || firstLine.includes('breaking')) return 'high';
        if (firstLine.includes('minor') || firstLine.includes('enhancement')) return 'medium';
        if (firstLine.includes('patch') || firstLine.includes('fix')) return 'low';
        
        // Assess by message length and detail
        if (lines.length > 3 || firstLine.length > 50) return 'medium';
        return 'low';
    }

    calculateProductivity(activityData) {
        const { commits, pullRequests, issues } = activityData;
        
        // Simple productivity scoring
        const commitScore = commits.length * 2;
        const prScore = pullRequests.length * 5;
        const issueScore = issues.length * 3;
        
        const totalScore = commitScore + prScore + issueScore;
        
        let level;
        if (totalScore >= 20) level = 'high';
        else if (totalScore >= 10) level = 'medium';
        else if (totalScore > 0) level = 'low';
        else level = 'none';

        return {
            score: totalScore,
            level,
            breakdown: {
                commits: commitScore,
                pullRequests: prScore,
                issues: issueScore
            }
        };
    }

    analyzeTimeDistribution(activityData) {
        const allActivities = [
            ...activityData.commits.map(c => ({ ...c, type: 'commit' })),
            ...activityData.pullRequests.map(pr => ({ ...pr, type: 'pullRequest' })),
            ...activityData.issues.map(i => ({ ...i, type: 'issue' }))
        ];

        const timeSlots = {
            morning: 0,   // 6-12
            afternoon: 0, // 12-18
            evening: 0,   // 18-22
            night: 0      // 22-6
        };

        allActivities.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            if (hour >= 6 && hour < 12) timeSlots.morning++;
            else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
            else if (hour >= 18 && hour < 22) timeSlots.evening++;
            else timeSlots.night++;
        });

        return timeSlots;
    }

    generateRecommendations(activityData) {
        const recommendations = [];
        const { commits, pullRequests } = activityData;

        if (commits.length === 0 && pullRequests.length === 0) {
            recommendations.push("Consider making some commits or opening pull requests to track your progress.");
        }

        if (commits.length > 10) {
            recommendations.push("Great commit activity! Consider grouping related changes into fewer, more meaningful commits.");
        }

        if (pullRequests.length === 0 && commits.length > 0) {
            recommendations.push("You have commits but no pull requests. Consider creating PRs to get code reviews.");
        }

        const commitAnalysis = this.analyzeCommits(commits);
        const categories = Object.keys(commitAnalysis.byCategory);
        
        if (categories.length === 1) {
            recommendations.push("Consider diversifying your work - mix features, fixes, and refactoring.");
        }

        return recommendations;
    }

    getFirstActivity(activityData) {
        const allActivities = [
            ...activityData.commits,
            ...activityData.pullRequests,
            ...activityData.issues
        ];

        if (allActivities.length === 0) return null;

        return allActivities.reduce((earliest, activity) => {
            const activityTime = new Date(activity.timestamp);
            return !earliest || activityTime < new Date(earliest.timestamp) ? activity : earliest;
        });
    }

    getLastActivity(activityData) {
        const allActivities = [
            ...activityData.commits,
            ...activityData.pullRequests,
            ...activityData.issues
        ];

        if (allActivities.length === 0) return null;

        return allActivities.reduce((latest, activity) => {
            const activityTime = new Date(activity.timestamp);
            return !latest || activityTime > new Date(latest.timestamp) ? activity : latest;
        });
    }
}