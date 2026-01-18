# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React-based English word learning web application for rapid "flashcard-style" browsing of 20,000+ English words. The app is a single-page application (SPA) that runs in the browser with optional backend AI capabilities for generating word definitions and examples.

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

# --- Backend & AI Commands ---

# Start Express server for AI APIs (definitions, examples) on port 3001
npm run server

# Enrich word data using local Ollama
npm run enrich:ollama

# Enrich word data using Doubao (ByteDance) API
npm run enrich:doubao

# Enrich all words with comprehensive data
npm run enrich:all

# Monitor enrichment progress
npm run monitor
```

**Node.js version**: 18+ required

## Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 5.0.8
- **Backend**: Express.js (optional, for AI generation)
- **State Management**: React Hooks
- **AI Providers**: Ollama (local), DeepSeek, Doubao (cloud)

### Path Aliases (configured in tsconfig.json and vite.config.js)
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

```
Frontend (React) ←→ LocalStorage ←→ Word Data
                      ↓
                 Progress/Favorites/Settings
                      ↓
Optional: AI API Server (Express) ←→ Ollama/DeepSeek/ Doubao
```

1. **Word Data Loading** ([`src/utils/datasetLoader.js`](src/utils/datasetLoader.js)):
   - Primary: Local JSON databases in [`src/data/`](src/data/)
   - Secondary: External CSV from Hugging Face (optional fallback)
   - `loadEnglishWordDataset()` loads words, `toWordRecords()` converts to standard format

2. **Progress Persistence** ([`src/utils/storage.js`](src/utils/storage.js)):
   - `ProgressManager`: Current index, daily count, completed rounds
   - `FavoritesManager`: Word favoriting
   - `SettingsManager`: User preferences
   - All stored in localStorage with keys prefixed `english_app_*`

3. **AI Integration**:
   - [`src/utils/ollama.ts`](src/utils/ollama.ts) - Local Ollama models (default: qwen2.5:3b)
   - [`src/utils/wordDefinitionsGenerator.ts`](src/utils/wordDefinitionsGenerator.ts) - Cloud APIs (DeepSeek, Doubao)
   - [`server/index.js`](server/index.js) - Express API server for `/api/definitions` and `/api/examples`

### Component Structure

- **Pages**: [`src/pages/`](src/pages/)
  - `HomePage.jsx` - Landing page with start button
  - `SettingsPage.jsx` - Configuration for AI, daily goals, etc.

- **Main Components**: [`src/components/`](src/components/)
  - `LearningPage.jsx` - Core learning interface, manages word navigation and progress
  - `WordCard.jsx` - Single word display with examples, pronunciation, favorites
  - `NavigationControls.jsx` - Fixed bottom navigation (mobile-optimized)

### Key Data Structures

Word object format ([`src/types/word.types.ts`](src/types/word.types.ts)):
```typescript
interface Word {
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

### Scripts Directory

The [`scripts/`](scripts/) directory contains data generation and enrichment tools:
- `enrichWordsWithOllama.mjs` - Batch enrich words using local Ollama
- `enrichWordsWithDoubao.mjs` - Batch enrich using Doubao API
- `enrichAllWords.mjs` - Comprehensive enrichment pipeline
- `generateVocabularyDatabase.js` - Generate vocabulary from scratch using AI
- `monitorProgress.mjs` - Monitor enrichment progress
- `analyze_words.js` - Word analysis utilities

### Enrichment Process

The app supports multiple ways to enrich word data:

**Method 1: Local Ollama**
```bash
# Ensure Ollama is running
ollama serve

# Run enrichment
npm run enrich:ollama

# With environment variables for batching
START_INDEX=0 LIMIT=50 npm run enrich:ollama
```

**Method 2: Cloud API (Doubao/DeepSeek)**
```bash
# Configure .env with API keys
npm run enrich:doubao
```

**Method 3: Backend Server**
```bash
# Start server first
npm run server

# Then use frontend or scripts to fetch definitions/examples
```

See [`RUN_ENRICH.md`](RUN_ENRICH.md) for detailed Ollama instructions, and [`RUN_ENRICH_DOUBAO.md`](RUN_ENRICH_DOUBAO.md) for cloud API usage.

### Important Implementation Notes

1. **Mobile-First Design**: Fixed bottom navigation, default expanded word details, touch-friendly controls

2. **No Testing Framework**: Currently no test setup. Consider Vitest (matches Vite ecosystem)

3. **Speech API**: Uses browser's Web Speech API - requires compatible browser (Chrome/Edge 90+, Firefox 88+, Safari 14+)

4. **Keyboard Navigation**: Arrow keys (← →) are bound in `LearningPage.jsx` for word navigation

5. **Index Safety**: When loading progress, the index is clamped to valid bounds to prevent out-of-range errors if word count changes

6. **Round Completion**: When reaching the last word, automatically cycles back to index 0 and increments `completedRounds`

7. **Path Aliases**: Always use `@/` prefix for imports (e.g., `@/components/WordCard`)

### Environment Variables

See [`.env.example`](.env.example) for:
- Ollama endpoint configuration (`OLLAMA_ENDPOINT`, `OLLAMA_MODEL`)
- DeepSeek API key (`DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`)
- Doubao API credentials (`DOUBAO_API_KEY`, `DOUBAO_MODEL`)
- HuggingFace dataset URL
- Backend API base URL

### Output Files

- Enriched words: `src/data/words_with_examples.json`
- Vocabulary database: `src/data/vocabularyDatabase.js`
- Generated examples: `src/data/generated/word_examples.json`

## Development Notes

- The app is designed to scale to 20,000+ words
- Modular architecture allows easy addition of new AI providers
- All AI-generated content is cached to minimize API calls
- Progress is auto-saved to localStorage after each word navigation
