/*
Projekta nosaukums: Remontdarbi
Autors: Artjoms Demidovs
Versija: 1.0
Izveides datums: 2026. gada 7. janvāris
Pēdējo izmaiņu datums: 2026. gada 17. marts
Mērķauditorija: Klienti, administratori un sistēmas lietotāji
Projekta mērķis: Nodrošināt remontdarbu pieteikumu iesniegšanu un pārvaldību tīmekļa vidē
Atsauksme uz resursiem: Izmantoti mācību materiāli, Vite, React, Tailwind CSS, Express un PostgreSQL dokumentācija
Faila apraksts: ESLint konfigurācijas fails koda kvalitātes pārbaudei
*/
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// ESLint konfiguracija projektam.
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
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
    },
  },
])
