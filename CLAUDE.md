# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React-based English word learning web application for rapid "flashcard-style" browsing of 20,000+ English words. The app is a single-page application (SPA) that runs in the browser with optional backend AI capabilities for generating word definitions and examples.

**Deployment**: GitHub Actions auto-deploys to production server on push to `master` branch (see [`README.md`](README.md) for CI/CD details).

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

# Build examples from dataset
npm run build:examples

# --- Backend & AI Commands ---

# Start Express server for AI APIs (definitions, examples) and TTS on port 3001
npm run server

# Enrich word data using local Ollama
npm run enrich:ollama

# Enrich word data using Doubao (ByteDance) API
npm run enrich:doubao

# Enrich all words with comprehensive data
npm run enrich:all

# Monitor enrichment progress
npm run monitor

# --- Database Commands ---

# Initialize SQLite database
npm run db:init

# Backup database
npm run db:backup
```

**Node.js version**: 18+ required

## Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 5.0.8
- **Backend**: Express.js (optional, for AI generation and TTS)
- **Database**: better-sqlite3 (optional, for caching)
- **State Management**: React Hooks with LocalStorage persistence
- **AI Providers**: Ollama (local), DeepSeek, Doubao (cloud)
- **Text-to-Speech**: Edge TTS via server API (replaced browser Web Speech API)

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
Progress/Favorites/Settings/MasteredWords
       ↓
Optional: AI API Server (Express) ←→ Ollama/DeepSeek/Doubao
                                      ↓
                                  Edge TTS Audio
```

**Data Flow Components:**

1. **Word Data Loading** ([`src/utils/datasetLoader.js`](src/utils/datasetLoader.js)):
   - Primary: Local JSON databases in [`src/data/`](src/data/)
     - `filtered_words.json` - Main word list (~1.2MB)
     - `words_with_examples.json` - Enhanced data with examples (~500KB)
   - Secondary: External CSV from Hugging Face (optional fallback)
   - `loadEnglishWordDataset()` loads words, `toWordRecords()` converts to standard format

2. **Progress Persistence** ([`src/utils/storage.js`](src/utils/storage.js)):
   - `ProgressManager`: Current index, daily count, completed rounds
   - `FavoritesManager`: Word favoriting
   - `SettingsManager`: User preferences
   - `MasteredWordsManager`: Track learned words (filtered from learning flow)
   - All stored in localStorage with keys prefixed `english_app_*`
   - Optional API sync via [`src/utils/apiStorage.js`](src/utils/apiStorage.js)

3. **Text-to-Speech** ([`src/utils/speech.js`](src/utils/speech.js)):
   - Uses server-side Edge TTS for audio generation
   - API endpoint: `/api/tts` (POST with text, voice, rate parameters)
   - Supports US/UK voice variants (`en-US-GuyNeural`, `en-GB-SoniaNeural`)
   - Handles audio streaming and proper cleanup

4. **AI Integration**:
   - [`src/utils/ollama.ts`](src/utils/ollama.ts) - Local Ollama models (default: qwen2.5:3b)
   - [`src/utils/wordDefinitionsGenerator.ts`](src/utils/wordDefinitionsGenerator.ts) - Cloud APIs (DeepSeek, Doubao)
   - [`server/index.js`](server/index.js) - Express API server for `/api/definitions`, `/api/examples`, `/api/tts`

### Component Structure

**App.jsx** - Root component managing page routing:
- `home` - Landing page (`HomePage.jsx`)
- `learning` - Learning interface (default, `LearningPage.jsx`)
- `settings` - Configuration (`SettingsPage.jsx`)
- `mastered` - Mastered words tracker (`MasteredWordsPage.jsx`)

**Pages** ([`src/pages/`](src/pages/)):
- `HomePage.jsx` - Landing page with start button
- `SettingsPage.jsx` - Configuration for AI provider, daily goals, TTS settings
- `MasteredWordsPage.jsx` - View and manage mastered words

**Main Components** ([`src/components/`](src/components/)):
- `LearningPage.jsx` - Core learning interface, manages word navigation, filters mastered words, handles keyboard shortcuts
- `WordCard.jsx` - Single word display with definitions, examples, pronunciation, favorites, mastery toggle
- `NavigationControls.jsx` - Fixed bottom navigation (mobile-optimized)
- `AIGenerateButton.jsx` - AI generation UI for definitions/examples

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

2. **Text-to-Speech**: Uses server-side Edge TTS via `/api/tts` endpoint. Previous attempts using browser Web Speech API and easy-speech library were replaced due to mobile compatibility issues.

3. **Mastered Words Filtering**: `LearningPage` automatically filters mastered words from the learning flow. Words can be marked as mastered in `WordCard` component.

4. **Keyboard Navigation**: Arrow keys (← →) are bound in `LearningPage.jsx` for word navigation

5. **Index Safety**: When loading progress, the index is clamped to valid bounds to prevent out-of-range errors if word count changes

6. **Round Completion**: When reaching the last word, automatically cycles back to index 0 and increments `completedRounds`

7. **Path Aliases**: Always use `@/` prefix for imports (e.g., `@/components/WordCard`)

8. **No Testing Framework**: Currently no test setup. Consider Vitest (matches Vite ecosystem)

9. **Vite Proxy**: Development server proxies `/api` requests to `localhost:3001` (backend server)

### Environment Variables

See [`.env.example`](.env.example) for:

**AI Provider Configuration:**
- `LLM_PROVIDER` - Choose: `deepseek` | `doubao` | `ollama`
- `OLLAMA_ENDPOINT`, `OLLAMA_MODEL` - Ollama configuration (default: `qwen2.5:3b`)
- `DEEPSEEK_API_KEY`, `DEEPSEEK_ENDPOINT`, `DEEPSEEK_MODEL` - DeepSeek configuration
- `DOUBAO_API_KEY`, `DOUBAO_ENDPOINT`, `DOUBAO_MODEL` - Doubao configuration

**Data Sources:**
- `USE_DATASET` - Use HuggingFace dataset as word source
- `DATASET_URL` - HuggingFace CSV dataset URL
- `DICT_URL` - ECDICT dictionary URL for Chinese translations

**Generation Settings:**
- `TOTAL_WORDS` - Target word count (default: 20000)
- `EXAMPLES_PER_WORD` - Examples to generate per word (default: 10)
- `CHUNK_SIZE` - Batch processing size
- `MIN_LEN`, `MAX_LEN` - Word length filters
- `START_INDEX`, `LIMIT`, `RETRY`, `RETRY_DELAY` - Batch processing controls

### Output Files

- Enriched words: `src/data/words_with_examples.json`
- Vocabulary database: `src/data/vocabularyDatabase.js`
- Generated examples: `src/data/generated/word_examples.json`

## Development Notes

- The app is designed to scale to 20,000+ words
- Modular architecture allows easy addition of new AI providers
- All AI-generated content is cached to minimize API calls
- Progress is auto-saved to localStorage after each word navigation

### Backend Server (Optional)

The Express server in [`server/index.js`](server/index.js) provides:
- `/api/definitions` - Generate word definitions using configured AI provider
- `/api/examples` - Generate example sentences for words
- `/api/tts` - Text-to-speech using Edge TTS
- SQLite database integration for caching generated content

Server runs on port 3001 and is proxied via Vite during development.

### Recent Architecture Changes

Based on git history, significant recent changes include:
- **TTS System Evolution**: Browser Web Speech API → easy-speech library → Google TTS → Edge TTS (current)
- **Mobile Compatibility**: Multiple iterations to address mobile browser speech playback issues
- **Mastered Words Feature**: Added ability to mark words as mastered and filter them from learning flow

### Files to Check for Common Tasks

| Task | Files |
|------|-------|
| Add new page | `src/pages/`, `src/App.jsx` (routing) |
| Modify word display | `src/components/WordCard.jsx` |
| Change navigation | `src/components/NavigationControls.jsx`, `src/components/LearningPage.jsx` |
| Add AI provider | `src/utils/wordDefinitionsGenerator.ts`, `server/index.js` |
| Modify storage | `src/utils/storage.js`, `src/utils/apiStorage.js` |
| Change TTS behavior | `src/utils/speech.js`, `server/index.js` (TTS endpoint) |
