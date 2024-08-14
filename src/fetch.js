#!/usr/bin/env node

import 'dotenv/config'
import { Octokit } from 'octokit'

import { GITHUB_REST_API_VERSION } from '../constants/project'
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
  for await (const { data } of issuesIterator) {
    issues.push(...data)
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
    issuesByLabel.push({
      label,
      issues,
    })
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
    issuesByMilestone.push({
      milestone,
      issues,
    })
  }

  return issuesByMilestone
}

async function main() {
  await getIssues()
  await getIssuesByLabel()
  await getIssuesByMilestone()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
