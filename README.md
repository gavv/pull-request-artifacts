# pull-request-artifacts [![build](https://github.com/gavv/pull-request-artifacts/actions/workflows/build.yml/badge.svg)](https://github.com/gavv/pull-request-artifacts/actions/workflows/build.yml)

This GitHub Action uploads specified build artifacts (arbitrary files) from a PR to given repo and posts a PR comment with links to the uploaded artifacts.

For example, you can use it to automatically upload APK or App Bundle to make it easy to test the PR during review.

![](screenshot.png)

## Parameters

| parameter          | required     | default                       | description                                      |
| ---------          | --------     | -------                       | -----------                                      |
| `commit`           | **required** | -                             | Commit hash that triggered PR                    |
| `repo-token`       | **required** | -                             | Token for current repo (used to post PR comment) |
| `artifacts`        | **required** | -                             | Whitespace-separated list of files to upload     |
| `artifacts-token`  | optional     | same as `repo-token`          | Token for artifacts repo                         |
| `artifacts-repo`   | optional     | current repo                  | Repo where to upload artifacts                   |
| `artifacts-branch` | optional     | default branch                | Branch where to upload artifacts                 |
| `artifacts-prefix` | optional     | `pr{NNN}-` (NNN is PR number) | Prefix for uploaded artifact path (may contain slashes to specify directory) |
| `preserve-path`    | optional     | false                         | Whether to preserve artifact path, otherwise use only basename               |
| `inter-link`       | optional     | true                          | Whether to link the original PR when committing artifacts |
| `post-comment`     | optional     | true                          | Whether to post a comment with links to artifacts         |
| `comment-title`    | optional     | "🤖 Pull request artifacts"   | Header to add to comment in the PR                        |
| `comment-style`    | optional     | `table`                       | How to format comment (can be `table` or `list`)          |

## Example usage

Create a new workflow file `.github/workflows/pull-request-artifacts.yml` with the
contents below. Alternatively you can copy the job below and put it into your
existing workflow.

```yaml
name: Generate attachments

on:
  # This workflow is started only on PRs
  pull_request:
    # Your branch, usually "main" or "master"
    branches: [ "main" ]

jobs:
  # Main job
  build:
    permissions:
      # Required to upload/save artifact, otherwise you'll get
      # "Error: Resource not accessible by integration"
      contents: write
      # Required to post comment, otherwise you'll get
      # "Error: Resource not accessible by integration"
      pull-requests: write

    runs-on: ubuntu-latest
    steps:
      # Put your steps here to generate the files to upload.
      # Usually configure Node.js, build, etc.
      # Finally, upload the artifacts and post comment:
      - name: Pull request artifacts
        uses: gavv/pull-request-artifacts@v2
        with:
          # Commit hash that triggered PR
          commit: ${{ github.event.pull_request.head.sha }}

          # Token for current repo (used to post PR comment)
          repo-token: ${{ secrets.GITHUB_TOKEN }}

          # Optional, uncomment to upload to another repository
          #artifacts-token: ${{ secrets.ANOTHER_TOKEN_WITH_PUSH_ACCESS }}
          #artifacts-repo: some/repository_name

          # Optional, uncomment to upload artifacts to specific branch, otherwise
          # the default branch is used.
          # Note that usually the main branch is protected by rules, so it's not
          # possible to upload there.
          # Perhaps, the best solution is to create an empty unprotected branch
          # dedicated for artifacts.
          # See README for details.
          #artifacts-branch: some_branch

          # Optional, uncomment to preserve artifacts path and add prefix.
          # By default artifacts are uploaded to "pr<pr_number>-<artifact_basename>".
          # With options below, artifacts will be uploaded to "my_prs/<pr_number>/<artifact_path>".
          #artifacts-prefix: "my_prs/${{ github.event.number }}/"
          #preserve-path: true

          # Optional, uncomment to use non-default title and style.
          #comment-title: "My artifacts"
          #comment-style: list

          # Whitespace-separated list of files to upload
          artifacts: |
            some/file.apk
            another/file.ipa
```

## Protected branches

Please keep in mind that your branch where the PR goes to may be protected, which is usually true. For example, you may have some required checks and tests before PR can be merged.

**This action can not upload artifacts to protected branches.**

In this case you need to specify the `artifacts-branch` parameter that points to some unprotected branch
used for uploading artifacts. For example, you can create an empty branch called `artifacts` for that.
To create such empty branch using the following commands:

```console
$ git switch --orphan artifacts
$ git commit --allow-empty -m "Initial commit on orphan branch"
$ git push -u origin artifacts
```

Now you have an empty branch that can be used to store artifacts.
