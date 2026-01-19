# AGENTS.md

This guide is for agentic coding assistants working with the English Word Learning App.

## Build & Development Commands

```bash
# Development
npm run dev              # Start Vite dev server on port 3000
npm run build            # Production build
npm run preview          # Preview production build on port 4173

# Backend & AI
npm run server           # Start Express server on port 3001
npm run enrich:ollama    # Batch enrich words with local Ollama
npm run enrich:doubao    # Batch enrich with Doubao API
npm run enrich:all       # Comprehensive enrichment pipeline
npm run monitor          # Monitor enrichment progress

# Environment variables for enrichment:
START_INDEX=0 LIMIT=50 npm run enrich:ollama  # Process specific word range
```

**Note:** No lint, typecheck, or test commands are configured. Before making changes, consider adding:
- ESLint/Prettier for code formatting
- Vitest (matches Vite ecosystem) for testing
- TypeScript type checking (already strict mode enabled)

## Path Aliases

Always use these aliases configured in `vite.config.js` and `tsconfig.json`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@utils/*` → `src/utils/*`
- `@hooks/*` → `src/hooks/*`
- `@types/*` → `src/types/*`
- `@data/*` → `src/data/*`
- `@styles/*` → `src/styles/*`

## Code Style Guidelines

### File Extensions & Structure
- React components: `.jsx` (e.g., `WordCard.jsx`, `LearningPage.jsx`)
- TypeScript types: `.ts` (e.g., `src/types/word.types.ts`)
- Utilities with types: `.ts` (e.g., `src/utils/ollama.ts`)
- Node.js scripts: `.mjs` (e.g., `scripts/enrichWordsWithOllama.mjs`)
- Backend server: `.js` (CommonJS compatible, e.g., `server/index.js`)
- Styles: `.css` (e.g., `src/styles/WordCard.css`)

### Imports
```jsx
// Order: React hooks → local imports → styles
import { useState, useEffect, useCallback } from 'react'
import WordCard from './WordCard'
import { progressManager } from '@utils/storage'
import { STORAGE_KEYS } from '@types/storage.types'
import '../styles/LearningPage.css'
```

### Naming Conventions
- **Components**: PascalCase (`WordCard`, `LearningPage`, `NavigationControls`)
- **Functions/Variables**: camelCase (`handleNext`, `currentIndex`, `loadDefinitions`)
- **Classes**: PascalCase (`ProgressManager`, `OllamaClient`, `WordDefinitionsGenerator`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEYS`, `API_BASE`, `DEFAULT_MODEL`)
- **Files**: PascalCase for components, camelCase for utilities (`storage.js`, `speech.js`)

### TypeScript & JavaScript Patterns
- Use TypeScript type definitions in `/src/types/` for all shared interfaces
- React components: functional components with hooks only
- Managers/API clients: class-based (e.g., `ProgressManager`, `OllamaClient`)
- Async operations: always use async/await with try-catch
- Exports: default export for main component/class, named exports for utilities

Example class structure:
```typescript
export class MyClass {
  private field: string

  constructor(field: string) {
    this.field = field
  }

  async doSomething(): Promise<Result> {
    try {
      // logic
    } catch (error) {
      console.error('Operation failed:', error)
      throw error
    }
  }
}
```

### React Component Patterns
```jsx
const MyComponent = ({ prop1, onAction }) => {
  const [state, setState] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    // init logic
  }, [])

  const handleAction = useCallback(() => {
    // action logic
  }, [dependencies])

  return <div>...</div>
}

export default MyComponent
```

### State Management
- Component state: `useState`, `useRef` for refs
- Memoized callbacks: `useCallback` to prevent unnecessary re-renders
- Global state: localStorage with keys prefixed `english_app_*` (defined in `STORAGE_KEYS`)
- Progress: `progressManager` singleton instance from `@utils/storage`

### Error Handling
```javascript
try {
  const data = await someAsyncOperation()
} catch (error) {
  console.error('Descriptive error message:', error)
  // Provide fallback or rethrow
}
```

### Documentation
- Use JSDoc comments for complex functions (Chinese comments are used in this codebase)
- Comments in Chinese for user-facing and complex logic explanations
- Example:
```javascript
/**
 * 加载学习进度
 */
loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS)
    if (saved) {
      this.progress = JSON.parse(saved)
    } else {
      this.progress = { /* defaults */ }
    }
  } catch (error) {
    console.error('加载进度失败:', error)
    this.progress = { /* defaults */ }
  }
}
```

### Data Structures
**Word object format** (from `@types/word.types.ts`):
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

### localStorage Keys
All storage keys are defined in `@types/storage.types.ts` as `STORAGE_KEYS`:
- `english_app_progress` - Learning progress
- `english_app_favorites` - Favorite words
- `english_app_settings` - User settings
- `english_app_last_study_date` - Last study date tracking
- `english_app_custom_examples` - AI-generated examples cache
- `english_app_definitions_cache` - Definitions cache

### Key Implementation Notes
1. **Mobile-first design**: Fixed bottom navigation, touch-friendly controls
2. **Index safety**: Always clamp indices to valid bounds to prevent out-of-range errors
3. **Round completion**: When reaching last word, cycle to index 0 and increment `completedRounds`
4. **Keyboard navigation**: Arrow keys (← →) bound in `LearningPage.jsx`
5. **No testing**: Currently no test framework - add Vitest if needed
6. **Speech API**: Uses Web Speech API - requires compatible browser
7. **AI providers**: Supports Ollama (local), DeepSeek, Doubao (cloud)
8. **TypeScript strict mode**: Enabled in `tsconfig.json` - maintain type safety
9. **Dynamic imports**: Use for AI generators to avoid circular dependencies
10. **Cache-first**: Always check localStorage caches before API calls

### When Adding Features
1. Check existing patterns in similar components
2. Use path aliases for imports
3. Follow the component structure (state → effects → handlers → render)
4. Add TypeScript types in `/src/types/` if creating new data structures
5. Use localStorage for persistence (prefix with `english_app_`)
6. Handle errors gracefully with try-catch and console.error
7. Add appropriate comments in Chinese for complex logic

### Avoid
- Comments unless explaining complex logic (per CLAUDE.md)
- Adding new dependencies without checking package.json
- Breaking mobile-first design patterns
- Skipping error handling for async operations
- Hardcoding values that should be in settings
