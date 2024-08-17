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

async function generatePosts(issues) {
  for (const issue of issues) {
    await generateHtmlFromTemplate(
      path.join(TEMPLATES_DIR, 'posts', 'index.ejs'),
      path.join(OUTPUT_DIR, 'posts', `${issue.id}`, 'index.html'),
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

async function generatePage(issues) {
  const pageCount = Math.ceil(issues.length / theme.perPage)
  for (let i = 0; i < pageCount; i++) {
    await generateHtmlFromTemplate(
      path.join(TEMPLATES_DIR, 'page', 'index.ejs'),
      i === 0
        ? path.join(OUTPUT_DIR, 'index.html')
        : path.join(OUTPUT_DIR, 'page', `${i + 1}`, 'index.html'),
      {
        posts: issues.slice(theme.perPage * i, theme.perPage * (i + 1)),
        pageCount,
        currentPage: i + 1,
      },
    )
  }
}

async function generateArchives(issues) {
  const postsByMonthMap = new Map()
  issues.forEach((issue) => {
    const date = new Date(issue.created_at)
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (postsByMonthMap.has(month)) {
      postsByMonthMap.get(month).push(issue)
    } else {
      postsByMonthMap.set(month, [issue])
    }
  })

  await generateHtmlFromTemplate(
    path.join(TEMPLATES_DIR, 'archives', 'index.ejs'),
    path.join(OUTPUT_DIR, 'archives', 'index.html'),
    {
      postsByMonthMap,
    },
  )
}

async function generateCategories(issuesByMilestone) {
  await generateHtmlFromTemplate(
    path.join(TEMPLATES_DIR, 'categories', 'index.ejs'),
    path.join(OUTPUT_DIR, 'categories', 'index.html'),
    {
      categories: issuesByMilestone.map((item) => item.milestone),
    },
  )

  for (const issuesOfOneMilestone of issuesByMilestone) {
    const { milestone, issues } = issuesOfOneMilestone
    const pageCount = Math.ceil(issues.length / theme.perPage)
    for (let i = 0; i < pageCount; i++) {
      await generateHtmlFromTemplate(
        path.join(TEMPLATES_DIR, 'categories', 'page.ejs'),
        i === 0
          ? path.join(OUTPUT_DIR, 'categories', `${milestone.id}`, 'index.html')
          : path.join(
              OUTPUT_DIR,
              'categories',
              `${milestone.id}`,
              'page',
              `${i + 1}`,
              'index.html',
            ),
        {
          posts: issues.slice(theme.perPage * i, theme.perPage * (i + 1)),
          category: milestone,
          pageCount,
          currentPage: i + 1,
        },
      )
    }
  }
}

async function generateTags(issuesByLabel) {
  await generateHtmlFromTemplate(
    path.join(TEMPLATES_DIR, 'tags', 'index.ejs'),
    path.join(OUTPUT_DIR, 'tags', 'index.html'),
    {
      tags: issuesByLabel.map((item) => item.label),
    },
  )

  for (const issuesOfOneLabel of issuesByLabel) {
    const { label, issues } = issuesOfOneLabel
    const pageCount = Math.ceil(issues.length / theme.perPage)
    for (let i = 0; i < pageCount; i++) {
      await generateHtmlFromTemplate(
        path.join(TEMPLATES_DIR, 'tags', 'page.ejs'),
        i === 0
          ? path.join(OUTPUT_DIR, 'tags', `${label.id}`, 'index.html')
          : path.join(
              OUTPUT_DIR,
              'tags',
              `${label.id}`,
              'page',
              `${i + 1}`,
              'index.html',
            ),
        {
          posts: issues.slice(theme.perPage * i, theme.perPage * (i + 1)),
          tag: label,
          pageCount,
          currentPage: i + 1,
        },
      )
    }
  }
}

async function main() {
  console.log('Generating pages, please wait...')

  const issues = await loadDataFromFile(DATA_PATH_OF_ISSUES)
  const issuesByLabel = await loadDataFromFile(DATA_PATH_OF_ISSUES_BY_LABEL)
  const issuesByMilestone = await loadDataFromFile(
    DATA_PATH_OF_ISSUES_BY_MILESTONE,
  )

  await generatePosts(issues)
  await generatePage(issues)
  await generateArchives(issues)
  await generateCategories(issuesByMilestone)
  await generateTags(issuesByLabel)

  console.log('Generated pages successfully')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
