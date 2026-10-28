import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: false,
    commaDangle: 'never',
    arrowParens: false
  }),
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, $: 'readonly', jQuery: 'readonly' }
    },
    rules: {
      '@stylistic/arrow-parens': 'off',
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/quote-props': 'off',
      '@stylistic/space-before-function-paren': ['error', 'always'],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'off',
      'no-self-assign': 'off',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      // Retain legacy component conventions without expanding the migration into a cleanup.
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'vue/no-unused-components': 'off',
      'vue/no-unused-vars': 'off',
      'vue/require-v-for-key': 'off',
      'vue/return-in-computed-property': 'off'
    }
  }
]
