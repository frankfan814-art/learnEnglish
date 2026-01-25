# AGENTS.md

This guide is for agentic coding assistants working with the English Word Learning App.

## Build & Development Commands

```bash
# Frontend
npm run dev              # Start Vite dev server (port 3000)
npm run build            # Production build
npm run preview          # Preview production build (port 4173)

# Backend & AI
npm run server           # Start Express server (port 3001)
npm run enrich:ollama    # Batch enrich words with local Ollama
npm run enrich:doubao    # Batch enrich with Doubao API
npm run enrich:all       # Comprehensive enrichment pipeline
npm run monitor          # Monitor enrichment progress

# Database
npm run db:init          # Initialize SQLite database
npm run db:backup        # Backup database

# Environment variables for enrichment:
START_INDEX=0 LIMIT=50 npm run enrich:ollama
```

**Note:** No lint, typecheck, or test commands configured. TypeScript strict mode enabled.

## Path Aliases

Configured in `tsconfig.json` and `vite.config.js`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@utils/*` → `src/utils/*`
- `@hooks/*` → `src/hooks/*`
- `@types/*` → `src/types/*`
- `@data/*` → `src/data/*`
- `@styles/*` → `src/styles/*`

## Code Style Guidelines

### File Extensions
- React components: `.jsx`
- TypeScript types/utilities: `.ts`
- Node.js scripts: `.mjs`
- Backend server: `.js` (CommonJS)
- Styles: `.css`

### Imports Order
```jsx
import { useState, useEffect, useCallback } from 'react'
import WordCard from './WordCard'
import { progressManager } from '@utils/storage'
import { STORAGE_KEYS } from '@types/storage.types'
import '../styles/LearningPage.css'
```

### Naming Conventions
| Type | Convention | Examples |
|------|------------|----------|
| Components | PascalCase | `WordCard`, `LearningPage` |
| Functions/Variables | camelCase | `handleNext`, `currentIndex` |
| Classes | PascalCase | `ProgressManager`, `OllamaClient` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEYS`, `API_BASE` |
| Utility files | camelCase | `storage.js`, `speech.js` |

### TypeScript & React Patterns
- Use TypeScript types in `/src/types/` for shared interfaces
- React: functional components with hooks only
- Managers/API clients: class-based with async/await
- Always use try-catch for async operations
- Default export for main component/class, named exports for utilities

### Error Handling
```javascript
try {
  const data = await someAsyncOperation()
} catch (error) {
  console.error('Descriptive error message:', error)
  throw error
}
```

### State Management
- Component state: `useState`, `useRef`
- Memoized callbacks: `useCallback`
- Global state: localStorage with prefix `english_app_*` (see `STORAGE_KEYS`)
- Progress: `progressManager` singleton from `@utils/storage`

### Documentation
- Use JSDoc for complex functions
- Chinese comments for user-facing and complex logic
- Example: `/** 加载学习进度 */`

## Word Object Format
```typescript
{
  id: string
  word: string
  phonetic: string
  definitions: Array<{ partOfSpeech: string, meaning: string }>
  examples: Array<{ sentence: string, translation: string, scenario?: string, usage?: string }>
  collocations?: string[]
  synonyms?: string[]
  antonyms?: string[]
  scenarios?: string[]
  difficulty?: string
  category?: string
}
```

## Key Implementation Notes
1. Mobile-first: fixed bottom navigation, touch-friendly
2. Index safety: clamp indices to valid bounds
3. Round completion: cycle to index 0, increment `completedRounds`
4. Keyboard: arrow keys (← →) in `LearningPage.jsx`
5. AI providers: Ollama (local), DeepSeek, Doubao (cloud)
6. TTS: server-side Edge TTS via `/api/tts`
7. Cache-first: check localStorage before API calls
8. Dynamic imports for AI generators to avoid circular deps

## When Adding Features
1. Check existing patterns in similar components
2. Use path aliases for imports
3. Follow component structure: state → effects → handlers → render
4. Add types in `/src/types/` for new data structures
5. Use localStorage with `english_app_*` prefix for persistence
6. Handle errors with try-catch and console.error
7. Add Chinese comments for complex logic

## Avoid
- Adding dependencies without checking package.json
- Breaking mobile-first design patterns
- Skipping error handling for async operations
- Hardcoding values that should be in settings
