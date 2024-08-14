import path from 'node:path'

export const GITHUB_REST_API_VERSION = '2022-11-28'

export const TEMPLATES_DIR = 'templates'
export const OUTPUT_DIR = 'public'

export const DATA_DIR = 'data'
export const DATA_PATH_OF_ISSUES = path.join(DATA_DIR, 'issues.json')
export const DATA_PATH_OF_ISSUES_BY_LABEL = path.join(
  DATA_DIR,
  'issues-by-label.json',
)
export const DATA_PATH_OF_ISSUES_BY_MILESTONE = path.join(
  DATA_DIR,
  'issues-by-milestone.json',
)
