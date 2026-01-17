# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based English word learning web application designed for rapid "flashcard-style" browsing of 10,000 common English words. The app is a single-page application (SPA) that runs entirely in the browser with no backend required for core functionality.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Node.js version**: 18+ required

## Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 5.0.8
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Routing**: Custom conditional rendering (no external router library)
- **Styling**: Component-specific CSS files
- **Speech**: Web Speech API for pronunciation

### Path Aliases (configured in tsconfig.json)
```typescript
@/*              → src/*
@components/*    → src/components/*
@pages/*         → src/pages/*
@utils/*         → src/utils/*
@hooks/*         → src/hooks/*
@types/*         → src/types/*
@data/*          → src/data/*
@styles/*        → src/styles/*
```

### Core Data Flow

1. **Word Data Loading** ([`src/utils/datasetLoader.js`](src/utils/datasetLoader.js)):
   - Primary: Local JSON databases in [`src/data/`](src/data/)
   - Secondary: External CSV from Hugging Face (optional)
   - `loadEnglishWordDataset()` loads words, `toWordRecords()` converts to standard format

2. **Progress Persistence** ([`src/utils/storage.js`](src/utils/storage.js)):
   - `ProgressManager` class manages current index, daily count, completed rounds
   - `FavoritesManager` handles word favoriting
   - `SettingsManager` stores user preferences
   - All stored in localStorage with keys prefixed `english_app_*`

3. **AI Integration** ([`src/utils/ollama.ts`](src/utils/ollama.ts)):
   - Supports Ollama local models (default: qwen2.5:3b)
   - Optional DeepSeek API for cloud generation
   - Designed to be extensible for additional AI providers

### Component Structure

- **Pages**: [`src/pages/`](src/pages/)
  - `HomePage.jsx` - Landing page with start button
  - `SettingsPage.jsx` - Configuration for AI, daily goals, etc.

- **Main Components**: [`src/components/`](src/components/)
  - `LearningPage.jsx` - Core learning interface, manages word navigation and progress
  - `WordCard.jsx` - Single word display with examples, pronunciation, favorites
  - `NavigationControls.jsx` - Previous/Next navigation buttons

### Key Data Structures

Word object format ([`src/types/word.types.ts`](src/types/word.types.ts)):
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
}
```

### Progress Tracking

The app tracks:
- Current word index (persists across sessions)
- Today's studied word count (resets at midnight)
- Daily learning target (default: 1000 words)
- Completed rounds (auto-resets at 0 after finishing all words)
- Total study days

### Important Implementation Notes

1. **No Testing Framework**: Currently no test setup. When adding tests, consider Vitest (matches Vite ecosystem)

2. **Speech API**: Uses browser's Web Speech API - requires compatible browser (Chrome/Edge 90+, Firefox 88+, Safari 14+)

3. **Keyboard Navigation**: Arrow keys (← →) are bound in `LearningPage.jsx` for word navigation

4. **Index Safety**: When loading progress, the index is clamped to valid bounds to prevent out-of-range errors if word count changes

5. **Round Completion**: When reaching the last word, automatically cycles back to index 0 and increments `completedRounds`

### Environment Variables

See [`.env.example`](.env.example) for:
- Ollama endpoint configuration
- DeepSeek API key (optional)
- HuggingFace dataset URL

## Development Notes

- The app currently has ~20 sample words in [`src/data/wordDatabase.js`](src/data/wordDatabase.js)
- Designed to scale to 10,000+ words
- Modular architecture allows easy addition of:
  - New AI providers (follow the pattern in `ollama.ts`)
  - Additional word data sources
  - New learning features
