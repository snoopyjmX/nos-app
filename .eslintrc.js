module.exports = {
  extends: [
    'expo',
    'plugin:react-hooks/recommended',
    'plugin:react-native-a11y/basic',
  ],
  plugins: [
    'react-native-a11y',
    'unused-imports'
  ],
  rules: {
    // Dicas só quando o rótulo não basta; exigir em todo elemento gera ruído para leitores de tela.
    'react-native-a11y/has-accessibility-hint': 'off',
    "no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ]
  }
};
