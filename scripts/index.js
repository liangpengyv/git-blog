import { Octokit } from "octokit"
import { marked } from "marked";
import path, { join } from "node:path";
import fs from 'node:fs'

const TEMPLATES_DIR = 'templates'
const OUTPUT_DIR = 'public'

const octokit = new Octokit({
  auth: process.env.TOKEN, // GitHub Action
  // auth: '', // dev
});

async function getIssues() {
  const response = await octokit.request("GET /repos/liangpengyv/git-blog/issues")
  return response.data
}

function convertPosts(issues) {
  const posts = issues.map(issue => {
    const title = issue.title
    const content = marked(issue.body)
    return { title, content }
  })
  return posts
}

function loadTemplate(tempalteName) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, tempalteName), 'utf-8')
}

function saveHtml(content, filename) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR)
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), content, 'utf-8')
}

function generateIndex(posts) {
  const template = loadTemplate('index.html')
  const postListHtml = posts.map(post => `
    <li>
      <a href="${post.title}.html">
        ${post.title}
      </a>
    </li>
  `).join('\n')
  const htmlContent = template.replace('{{posts}}', postListHtml)
  saveHtml(htmlContent, 'index.html')
}

function generatePosts(posts) {
  const template = loadTemplate('post.html')
  posts.forEach(post => {
    const htmlContent = template.replace('{{title}}', post.title).replace('{{content}}', post.content)
    saveHtml(htmlContent, post.title + '.html')
  });
}

async function main() {
  const issues = await getIssues()
  const posts = convertPosts(issues)
  generateIndex(posts)
  generatePosts(posts)
}

main().catch(console.error)