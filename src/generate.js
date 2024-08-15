import path from 'node:path'
import fs from 'fs-extra'
import ejs from 'ejs'
import { marked } from 'marked'

import {
  TEMPLATES_DIR,
  DATA_PATH_OF_ISSUES,
  DATA_PATH_OF_ISSUES_BY_LABEL,
  DATA_PATH_OF_ISSUES_BY_MILESTONE,
  OUTPUT_DIR,
} from '../constants/project'
import { theme } from '../config.json'

async function loadDataFromFile(filePath) {
  return await fs.readJson(filePath, { encoding: 'utf-8' })
}

async function generateHtmlFromTemplate(templatePath, outputPath, data) {
  const html = await ejs.renderFile(templatePath, data)
  await fs.outputFile(outputPath, html, { encoding: 'utf-8' })
}

async function generatePage(issues) {
  const pageCount = Math.ceil(issues.length / theme.perPage)
  for (let i = 0; i < pageCount; i++) {
    await generateHtmlFromTemplate(
      path.join(TEMPLATES_DIR, 'page.ejs'),
      i === 0
        ? path.join(OUTPUT_DIR, 'index.html')
        : path.join(OUTPUT_DIR, 'page', `${i + 1}.html`),
      {
        issues: issues.slice(theme.perPage * i, theme.perPage * (i + 1)),
        pageCount,
        currentPage: i + 1,
      },
    )
  }
}

async function generatePost(issues) {
  for (const issue of issues) {
    await generateHtmlFromTemplate(
      path.join(TEMPLATES_DIR, 'post.ejs'),
      path.join(OUTPUT_DIR, 'post', `${issue.id}.html`),
      {
        title: issue.title,
        content: marked(issue.body ?? ''),
        comments: issue.comments_data.map((comment) => ({
          avatar: comment.user.avatar_url,
          username: comment.user.login,
          content: marked(comment.body ?? ''),
        })),
      },
    )
  }
}

async function main() {
  console.log('Generating pages, please wait...')

  const issues = await loadDataFromFile(DATA_PATH_OF_ISSUES)
  const issuesByLabel = await loadDataFromFile(DATA_PATH_OF_ISSUES_BY_LABEL)
  const issuesByMilestone = await loadDataFromFile(
    DATA_PATH_OF_ISSUES_BY_MILESTONE,
  )

  await generatePage(issues)
  await generatePost(issues)

  console.log('Generated pages successfully')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
