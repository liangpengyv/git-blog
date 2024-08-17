import 'dotenv/config'
import { Octokit } from 'octokit'
import fs from 'fs-extra'

import {
  GITHUB_REST_API_VERSION,
  DATA_DIR,
  DATA_PATH_OF_ISSUES,
  DATA_PATH_OF_ISSUES_BY_LABEL,
  DATA_PATH_OF_ISSUES_BY_MILESTONE,
} from '../constants/project'
import { github } from '../config.json'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function getIssues() {
  const issues = []
  const issuesIterator = octokit.paginate.iterator(
    octokit.rest.issues.listForRepo,
    {
      owner: github.owner,
      repo: github.repo,
      per_page: 100,
      headers: {
        'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
      },
    },
  )
  for await (const { data: currentPageIssues } of issuesIterator) {
    for (let i = 0; i < currentPageIssues.length; i++) {
      const comments = []
      const commentsIterator = octokit.paginate.iterator(
        octokit.rest.issues.listComments,
        {
          owner: github.owner,
          repo: github.repo,
          issue_number: currentPageIssues[i].number,
          per_page: 100,
          headers: {
            'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
          },
        },
      )
      for await (const { data: currentPageComments } of commentsIterator) {
        comments.push(...currentPageComments)
      }
      currentPageIssues[i].comments_data = comments
    }
    issues.push(...currentPageIssues)
  }

  return issues
}

async function getIssuesByLabel() {
  const labels = []
  const labelsIterator = octokit.paginate.iterator(
    octokit.rest.issues.listLabelsForRepo,
    {
      owner: github.owner,
      repo: github.repo,
      per_page: 100,
      headers: {
        'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
      },
    },
  )
  for await (const { data } of labelsIterator) {
    labels.push(...data)
  }

  const issuesByLabel = []
  for (const label of labels) {
    const issues = []
    const issuesIterator = octokit.paginate.iterator(
      octokit.rest.issues.listForRepo,
      {
        owner: github.owner,
        repo: github.repo,
        per_page: 100,
        labels: [label.name],
        headers: {
          'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
        },
      },
    )
    for await (const { data } of issuesIterator) {
      issues.push(...data)
    }
    if (issues.length > 0) {
      issuesByLabel.push({
        label,
        issues,
      })
    }
  }

  return issuesByLabel
}

async function getIssuesByMilestone() {
  const milestones = []
  const milestonesIterator = octokit.paginate.iterator(
    octokit.rest.issues.listMilestones,
    {
      owner: github.owner,
      repo: github.repo,
      per_page: 100,
      headers: {
        'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
      },
    },
  )
  for await (const { data } of milestonesIterator) {
    milestones.push(...data)
  }

  const issuesByMilestone = []
  for (const milestone of milestones) {
    const issues = []
    const issuesIterator = octokit.paginate.iterator(
      octokit.rest.issues.listForRepo,
      {
        owner: github.owner,
        repo: github.repo,
        per_page: 100,
        milestone: milestone.number,
        headers: {
          'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
        },
      },
    )
    for await (const { data } of issuesIterator) {
      issues.push(...data)
    }

    if (issues.length > 0) {
      issuesByMilestone.push({
        milestone,
        issues,
      })
    }
  }

  return issuesByMilestone
}

async function saveDataAsFile(filePath, data) {
  await fs.writeJSON(filePath, data, { encoding: 'utf-8' })
}

async function main() {
  console.log('Fetching GitHub Issues, please wait...')

  if (!(await fs.pathExists(DATA_DIR))) await fs.mkdir(DATA_DIR)

  await saveDataAsFile(DATA_PATH_OF_ISSUES, await getIssues())
  await saveDataAsFile(DATA_PATH_OF_ISSUES_BY_LABEL, await getIssuesByLabel())
  await saveDataAsFile(
    DATA_PATH_OF_ISSUES_BY_MILESTONE,
    await getIssuesByMilestone(),
  )

  console.log('Fetched GitHub Issues successfully')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
