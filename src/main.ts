import * as fs from 'fs'
import * as core from '@actions/core'
import {context} from '@actions/github'
import {Octokit} from '@octokit/rest'

async function run(): Promise<void> {
  try {
    const commit_sha = core.getInput('commit', {required: true})
    const local_token = core.getInput('repo-token', {required: true})
    const artifact_list = core.getInput('artifacts', {required: true})
    let artifacts_token = core.getInput('artifacts-token', {required: false})
    const artifacts_owner_and_repo = core.getInput('artifacts-repo', {
      required: false
    })
    let artifacts_branch = core.getInput('artifacts-branch', {required: false})
    const artifacts_dir = core.getInput('artifacts-dir', {required: false})

    if (!artifacts_token) {
      artifacts_token = local_token
    }

    let artifacts_owner = context.repo.owner
    let artifacts_repo = context.repo.repo
    if (artifacts_owner_and_repo) {
      ;[artifacts_owner, artifacts_repo] = artifacts_owner_and_repo.split(
        '/',
        2
      )
    }

    const local_octokit = new Octokit({
      auth: local_token,
      log: {
        debug: core.debug,
        info: core.info,
        warn: core.warning,
        error: core.error
      }
    })

    const artifacts_octokit = new Octokit({
      auth: artifacts_token,
      log: {
        debug: core.debug,
        info: core.info,
        warn: core.warning,
        error: core.error
      }
    })

    if (!artifacts_branch) {
      const repo = await artifacts_octokit.rest.repos.get({
        owner: artifacts_owner,
        repo: artifacts_repo
      })
      artifacts_branch = repo.data.default_branch
    }

    core.info(`Artifacts repo: ${artifacts_owner}/${artifacts_repo}`)
    core.info(`Artifacts branch: ${artifacts_branch}`)

    const findComment = async (body: string): Promise<number | null> => {
      const comments = await local_octokit.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number
      })

      for (const comment of comments.data) {
        if (!comment.user || comment.user.login !== 'github-actions[bot]') {
          continue
        }

        if (!comment.body || !comment.body.includes(body)) {
          continue
        }

        return comment.id
      }

      return null
    }

    const updateComment = async (
      comment_id: number,
      body: string
    ): Promise<void> => {
      core.info(`Updating comment ${comment_id}`)

      await local_octokit.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id,
        body
      })
    }

    const createComment = async (body: string): Promise<void> => {
      core.info(`Posting new comment`)

      await local_octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body
      })
    }

    const findFileSha = async (
      filename: string
    ): Promise<string | undefined> => {
      try {
        const files = await artifacts_octokit.rest.repos.getContent({
          owner: artifacts_owner,
          repo: artifacts_repo,
          path: artifacts_dir,
          ref: artifacts_branch
        })

        if (Array.isArray(files.data)) {
          for (const file of files.data) {
            if (file.name === filename) {
              return file.sha
            }
          }
        }
      } catch (error) {
        /* empty */
      }

      return undefined
    }

    const uploadFile = async (
      filename: string,
      filecontent: Buffer
    ): Promise<string> => {
      const old_sha = await findFileSha(filename)

      if (old_sha) {
        core.info(`Uploading file ${filename} (old sha ${old_sha})`)
      } else {
        core.info(`Uploading file ${filename} (first time)`)
      }

      const file_path = artifacts_dir
        ? `${artifacts_dir}/${filename}`
        : filename

      const repo_url = `https://github.com/${context.repo.owner}/${context.repo.repo}`
      const short_sha = commit_sha.substring(0, 5)

      const message = `Upload ${filename} (${short_sha})

Pull request: ${repo_url}/pull/${context.issue.number}
Commit: ${repo_url}/commit/${commit_sha}
`

      await artifacts_octokit.rest.repos.createOrUpdateFileContents({
        owner: artifacts_owner,
        repo: artifacts_repo,
        path: file_path,
        message,
        content: filecontent.toString('base64'),
        branch: artifacts_branch,
        sha: old_sha
      })

      const artifacts_repo_url = `https://github.com/${artifacts_owner}/${artifacts_repo}`
      return `${artifacts_repo_url}/blob/${artifacts_branch}/${file_path}?raw=true`
    }

    const title = 'Pull request artifacts'
    let body = `## 🤖 ${title}
| file | commit |
| ---- | ------ |
`

    for (const artifact of artifact_list.split(/\s+/)) {
      const path = artifact.trim()

      const basename = path.split('/').reverse()[0]
      const content = fs.readFileSync(path)

      const target_name = `pr${context.issue.number}-${basename}`
      const target_link = await uploadFile(target_name, content)

      body += `| [\`${target_name}\`](${target_link}) | ${commit_sha} |`
      body += '\n'
    }

    const comment_id = await findComment(title)
    if (comment_id) {
      await updateComment(comment_id, body)
    } else {
      await createComment(body)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('Failed')
    }
  }
}

run()
