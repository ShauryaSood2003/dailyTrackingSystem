import { Octokit } from '@octokit/rest';
import { loadConfig } from './config.js';

export class GitHubService {
    constructor() {
        const config = loadConfig();
        this.octokit = new Octokit({
            auth: config.githubToken
        });
        this.username = config.githubUsername;
    }

    async getUserActivity(date = new Date()) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            const [commits, pullRequests, issues] = await Promise.all([
                this.getCommitsForDay(startOfDay, endOfDay),
                this.getPullRequestsForDay(startOfDay, endOfDay),
                this.getIssuesForDay(startOfDay, endOfDay)
            ]);

            return {
                date: date.toISOString().split('T')[0],
                commits,
                pullRequests,
                issues,
                totalActivity: commits.length + pullRequests.length + issues.length
            };
        } catch (error) {
            console.error('Error fetching GitHub activity:', error.message);
            throw error;
        }
    }

    async getCommitsForDay(startOfDay, endOfDay) {
        const commits = [];
        
        try {
            const repos = await this.getUserRepos();
            
            for (const repo of repos) {
                try {
                    const { data: repoCommits } = await this.octokit.repos.listCommits({
                        owner: repo.owner.login,
                        repo: repo.name,
                        author: this.username,
                        since: startOfDay.toISOString(),
                        until: endOfDay.toISOString()
                    });

                    commits.push(...repoCommits.map(commit => ({
                        repo: repo.full_name,
                        message: commit.commit.message,
                        sha: commit.sha.substring(0, 7),
                        url: commit.html_url,
                        timestamp: commit.commit.author.date
                    })));
                } catch (repoError) {
                    // Skip repos we don't have access to
                    continue;
                }
            }
        } catch (error) {
            console.error('Error fetching commits:', error.message);
        }

        return commits;
    }

    async getPullRequestsForDay(startOfDay, endOfDay) {
        const pullRequests = [];
        
        try {
            const { data: prs } = await this.octokit.search.issuesAndPullRequests({
                q: `author:${this.username} type:pr created:${startOfDay.toISOString().split('T')[0]}..${endOfDay.toISOString().split('T')[0]}`
            });

            pullRequests.push(...prs.items.map(pr => ({
                repo: pr.repository_url.split('/').slice(-2).join('/'),
                title: pr.title,
                number: pr.number,
                url: pr.html_url,
                state: pr.state,
                timestamp: pr.created_at
            })));
        } catch (error) {
            console.error('Error fetching pull requests:', error.message);
        }

        return pullRequests;
    }

    async getIssuesForDay(startOfDay, endOfDay) {
        const issues = [];
        
        try {
            const { data: issueData } = await this.octokit.search.issuesAndPullRequests({
                q: `author:${this.username} type:issue created:${startOfDay.toISOString().split('T')[0]}..${endOfDay.toISOString().split('T')[0]}`
            });

            issues.push(...issueData.items.map(issue => ({
                repo: issue.repository_url.split('/').slice(-2).join('/'),
                title: issue.title,
                number: issue.number,
                url: issue.html_url,
                state: issue.state,
                timestamp: issue.created_at
            })));
        } catch (error) {
            console.error('Error fetching issues:', error.message);
        }

        return issues;
    }

    async getUserRepos() {
        try {
            const { data: repos } = await this.octokit.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 100
            });
            return repos;
        } catch (error) {
            console.error('Error fetching repositories:', error.message);
            return [];
        }
    }
}