import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github';
import {GitHub} from '@actions/github/lib/utils';

async function run(): Promise<void> {
    try {
        const githubToken = core.getInput('github-token', {required: true})

        const octokit = new GitHub(getOctokit(githubToken))

        const postComment = async (body: string): Promise<void> => {
            await octokit.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body
            })
        }

        await postComment('hello world')
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
