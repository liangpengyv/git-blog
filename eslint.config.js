import globals from 'globals'
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  { languageOptions: { globals: globals.node } },
  js.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
]
