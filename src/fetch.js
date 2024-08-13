#!/usr/bin/env node

import 'dotenv/config'
import { Octokit } from 'octokit'

import { GITHUB_REST_API_VERSION } from '../constants/project'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function getIssues() {
  const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner: 'liangpengyv',
    repo: 'git-blog',
    headers: {
      'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
    },
  })
  console.log(response)
}

async function main() {
  await getIssues()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
