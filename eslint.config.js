import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const appsScriptGlobals = {
  AdminDirectory: 'readonly',
  CacheService: 'readonly',
  CalendarApp: 'readonly',
  ContentService: 'readonly',
  DriveApp: 'readonly',
  GmailApp: 'readonly',
  HtmlService: 'readonly',
  LanguageApp: 'readonly',
  LockService: 'readonly',
  Logger: 'readonly',
  MailApp: 'readonly',
  MimeType: 'readonly',
  PropertiesService: 'readonly',
  ScriptApp: 'readonly',
  Session: 'readonly',
  SpreadsheetApp: 'readonly',
  UrlFetchApp: 'readonly',
  Utilities: 'readonly',
}

export default defineConfig([
  globalIgnores(['dist', 'gas/_archive', 'src/**/_archive']),
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.mjs', '*.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['gas/**/*.{js,gs}'],
    extends: [
      js.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...appsScriptGlobals,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script',
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
    },
  },
])
