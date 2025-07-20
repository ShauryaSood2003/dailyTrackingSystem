import inquirer from 'inquirer';
import chalk from 'chalk';

export class InteractiveInput {
    constructor() {
        this.timeCategories = [
            'Development',
            'Meetings', 
            'Code Review',
            'Planning',
            'Testing',
            'Documentation',
            'Learning',
            'Other'
        ];
    }

    async collectManualInput() {
        console.log(chalk.blue('\n📝 Let\'s add some manual details to your report!\n'));
        
        const manualData = {
            timeAllocation: await this.collectTimeAllocation(),
            codeReviews: await this.collectCodeReviews(),
            blockers: await this.collectBlockers(),
            tomorrowPlans: await this.collectTomorrowPlans()
        };

        return manualData;
    }

    async collectTimeAllocation() {
        console.log(chalk.cyan('⏰ Time Allocation (in hours)'));
        console.log(chalk.gray('Enter approximate hours spent on each activity today:\n'));

        const timeQuestions = this.timeCategories.map(category => ({
            type: 'input',
            name: category.toLowerCase().replace(' ', ''),
            message: `${category}:`,
            default: '0',
            validate: (input) => {
                const num = parseFloat(input);
                if (isNaN(num) || num < 0) {
                    return 'Please enter a valid number (0 or greater)';
                }
                if (num > 24) {
                    return 'Please enter a realistic number of hours (24 or less)';
                }
                return true;
            },
            filter: (input) => parseFloat(input) || 0
        }));

        const timeAnswers = await inquirer.prompt(timeQuestions);
        
        // Calculate total hours
        const totalHours = Object.values(timeAnswers).reduce((sum, hours) => sum + hours, 0);
        
        if (totalHours > 0) {
            console.log(chalk.gray(`\n📊 Total tracked time: ${totalHours.toFixed(1)} hours`));
            
            if (totalHours > 12) {
                console.log(chalk.yellow('⚠️  That\'s a lot of work! Make sure to take breaks.'));
            }
        }

        // Convert back to readable format
        const allocation = {};
        this.timeCategories.forEach(category => {
            const key = category.toLowerCase().replace(' ', '');
            allocation[category] = timeAnswers[key];
        });

        return allocation;
    }

    async collectCodeReviews() {
        console.log(chalk.cyan('\n🔍 Code Reviews & Reviews Given'));
        
        const reviewAnswers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'hadReviews',
                message: 'Did you participate in any code reviews today?',
                default: false
            }
        ]);

        if (!reviewAnswers.hadReviews) {
            return {
                participated: false,
                reviews: []
            };
        }

        const reviews = [];
        let addMore = true;

        while (addMore) {
            const reviewDetails = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: 'Type of review:',
                    choices: [
                        'Reviewed someone else\'s PR',
                        'My PR was reviewed',
                        'Pair programming/Live review',
                        'Other'
                    ]
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Brief description (repo/PR name, what was reviewed):',
                    validate: (input) => input.trim().length > 0 || 'Please enter a description'
                },
                {
                    type: 'list',
                    name: 'outcome',
                    message: 'Outcome:',
                    choices: [
                        'Approved',
                        'Requested changes',
                        'In progress',
                        'Merged',
                        'Other'
                    ]
                }
            ]);

            reviews.push(reviewDetails);

            const continueAnswer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'addAnother',
                    message: 'Add another code review?',
                    default: false
                }
            ]);

            addMore = continueAnswer.addAnother;
        }

        return {
            participated: true,
            reviews
        };
    }

    async collectBlockers() {
        console.log(chalk.cyan('\n🚧 Blockers & Challenges'));
        
        const blockerAnswers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'hadBlockers',
                message: 'Did you encounter any blockers or challenges today?',
                default: false
            }
        ]);

        if (!blockerAnswers.hadBlockers) {
            return {
                hadBlockers: false,
                blockers: []
            };
        }

        const blockers = [];
        let addMore = true;

        while (addMore) {
            const blockerDetails = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'type',
                    message: 'Type of blocker:',
                    choices: [
                        'Technical issue',
                        'Waiting for review/approval',
                        'External dependency',
                        'Unclear requirements',
                        'Environment/tooling issue',
                        'Knowledge gap',
                        'Other'
                    ]
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Describe the blocker:',
                    validate: (input) => input.trim().length > 0 || 'Please enter a description'
                },
                {
                    type: 'list',
                    name: 'status',
                    message: 'Current status:',
                    choices: [
                        'Resolved',
                        'In progress',
                        'Need help',
                        'Escalated',
                        'Waiting'
                    ]
                },
                {
                    type: 'input',
                    name: 'nextSteps',
                    message: 'Next steps to resolve (optional):',
                    default: ''
                }
            ]);

            blockers.push(blockerDetails);

            const continueAnswer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'addAnother',
                    message: 'Add another blocker?',
                    default: false
                }
            ]);

            addMore = continueAnswer.addAnother;
        }

        return {
            hadBlockers: true,
            blockers
        };
    }

    async collectTomorrowPlans() {
        console.log(chalk.cyan('\n📅 Tomorrow\'s Plans'));
        
        const plans = [];
        let addMore = true;

        console.log(chalk.gray('Add your planned tasks for tomorrow:\n'));

        while (addMore) {
            const planDetails = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'task',
                    message: 'Planned task/goal:',
                    validate: (input) => input.trim().length > 0 || 'Please enter a task'
                },
                {
                    type: 'list',
                    name: 'priority',
                    message: 'Priority:',
                    choices: ['High', 'Medium', 'Low'],
                    default: 'Medium'
                },
                {
                    type: 'input',
                    name: 'estimatedTime',
                    message: 'Estimated time (hours, optional):',
                    default: '',
                    filter: (input) => {
                        const num = parseFloat(input);
                        return isNaN(num) ? null : num;
                    }
                }
            ]);

            plans.push(planDetails);

            const continueAnswer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'addAnother',
                    message: 'Add another planned task?',
                    default: true
                }
            ]);

            addMore = continueAnswer.addAnother;
        }

        return plans;
    }

    async askForManualInput() {
        console.log(chalk.blue('\n🤔 Would you like to add manual details to your report?'));
        console.log(chalk.gray('This includes time allocation, code reviews, blockers, and tomorrow\'s plans.\n'));

        const answer = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'wantManualInput',
                message: 'Add manual details?',
                default: true
            }
        ]);

        return answer.wantManualInput;
    }
}