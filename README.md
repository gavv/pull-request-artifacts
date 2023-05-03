# pull-request-artifacts [![build](https://github.com/gavv/pull-request-artifacts/actions/workflows/build.yml/badge.svg)](https://github.com/gavv/pull-request-artifacts/actions/workflows/build.yml)

This GitHub Action uploads specified build artifacts (arbitrary files) from a PR to given repo and posts a PR comment with links to the uploaded artifacts.

For example, you can use it to automatically upload APK or App Bundle to make it easy to test the PR during review.

![](screenshot.png)

## Parameters

| parameter          | description                                                      |
| ---------          | -----------                                                      |
| `commit`           | Commit hash that triggered PR                                    |
| `repo-token`       | Token for current repo (used to post PR comment)                 |
| `artifacts`        | Whitespace-separated list of files to upload                     |
| `artifacts-token`  | Token for artifacts repo (defaults to repo-token)                |
| `artifacts-repo`   | Repo where to upload artifacts (defaults to current repo)        |
| `artifacts-branch` | Branch where to upload artifacts (defaults to default branch)    |
| `artifacts-dir`    | Directory where to upload artifacts (defaults to root directory) |

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
        uses: gavv/pull-request-artifacts@v1.0.0
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
          #artifacts-branch: artifacts

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
