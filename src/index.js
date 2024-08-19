import 'dotenv/config'
import path from 'node:path'
import fs from 'fs-extra'
import { Octokit } from 'octokit'
import { marked } from 'marked'
import express from 'express'
import open from 'open'

import {
  TEMPLATES_DIR,
  OUTPUT_DIR,
  GITHUB_REST_API_VERSION,
} from './constants/project'
import { github } from '../config.json'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function getIssuesTotalCount() {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        issues(states: OPEN) {
          totalCount
        }
      }
    }
  `
  const response = await octokit.graphql(query, {
    owner: github.owner,
    repo: github.repo,
  })
  return response.repository.issues.totalCount
}

function initOutputDir() {
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true })
  }
  fs.mkdirSync(OUTPUT_DIR)

  fs.copySync(path.join(TEMPLATES_DIR, 'css'), path.join(OUTPUT_DIR, 'css'))
}

async function getIssues() {
  const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner: github.owner,
    repo: github.repo,
    headers: {
      'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
    },
  })
  return response.data
}

async function getIssueComments(issueNumber) {
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/issues/{issue_number}/comments',
    {
      owner: github.owner,
      repo: github.repo,
      issue_number: issueNumber,
      headers: {
        'X-GitHub-Api-Version': GITHUB_REST_API_VERSION,
      },
    },
  )
  return response.data
}

async function convertPosts(issues) {
  const posts = []
  for (const issue of issues) {
    const commentArr = await getIssueComments(issue.number)
    posts.push({
      title: issue.title,
      content: marked(issue.body),
      comments: commentArr.map((comment) => ({
        content: comment.body,
        avatar: comment.user.avatar_url,
        username: comment.user.login,
      })),
    })
  }
  return posts
}

function loadTemplate(templateName) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, templateName), 'utf-8')
}

function saveHtml(content, filename) {
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), content, 'utf-8')
}

function generateIndex(posts) {
  const template = loadTemplate('index.html')
  const postListHtml = posts
    .map(
      (post) => `
        <li>
          <a href="${post.title}.html">
            ${post.title}
          </a>
        </li>
      `,
    )
    .join('\n')
  const htmlContent = template.replace('{{posts}}', postListHtml)
  saveHtml(htmlContent, 'index.html')
}

function generatePosts(posts) {
  const template = loadTemplate('post.html')
  posts.forEach((post) => {
    const htmlContent = template
      .replace('{{title}}', post.title)
      .replace('{{content}}', post.content)
      .replace(
        '{{comments}}',
        post.comments
          .map((comment) => marked(comment.content))
          .join('\n<br />'),
      )
    saveHtml(htmlContent, post.title + '.html')
  })
}

function runServer() {
  const app = express()
  const port = 3000
  app.use(express.static(OUTPUT_DIR))
  app.listen(port, () => {
    console.log(
      `Local server is running, please visit http://localhost:${port}`,
    )
    open(`http://localhost:${port}`)
  })
}

async function main() {
  console.log('Generating...')
  console.log('totalCount: ', await getIssuesTotalCount())
  initOutputDir()
  const issues = await getIssues()
  const posts = await convertPosts(issues)
  generateIndex(posts)
  generatePosts(posts)
  if (process.env.NODE_ENV === 'development') runServer()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
