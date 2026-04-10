# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack) at localhost:3000
npm run build        # Production build
npm run lint         # ESLint via next lint
npm run test         # Run all tests (Vitest + jsdom)
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Drop and recreate the database (destructive)
```

Run a single test file:
```bash
npx vitest src/lib/transform/__tests__/jsx-transformer.test.ts
```

All scripts inject `NODE_OPTIONS=--require ./node-compat.cjs` via `cross-env`. This strips `globalThis.localStorage` / `globalThis.sessionStorage` at server startup — Node 25+ exposes these as non-functional stubs that break SSR in libraries that detect Web Storage globals.

## Environment

Copy `.env` and set your key:
```
ANTHROPIC_API_KEY=   # Leave empty to use the mock AI provider
```

When `ANTHROPIC_API_KEY` is absent, the app uses `MockLanguageModel` (static multi-step responses, defined in `src/lib/provider.ts`). The real provider uses `claude-haiku-4-5`.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in chat; the AI writes files into a virtual file system; the result renders in a sandboxed iframe.

### Request flow

```
Browser chat input
  → POST /api/chat  (messages, files snapshot, projectId)
  → streamText() with system prompt + AI tools
  → AI emits tool calls (str_replace_editor, file_manager)
  → FileSystemContext.handleToolCall() applies them to in-memory VFS
  → PreviewFrame re-renders on each VFS change
  → On stream finish: project saved to SQLite via Prisma
```

### Virtual File System (`src/lib/file-system.ts`)

An in-memory `Map<path, node>` tree. All paths are normalized (leading `/`, no trailing slash). Key methods: `createFile`, `readFile`, `updateFile`, `deleteFile`, `rename`, `serialize`/`deserialize` (JSON snapshot stored in `Project.data`). The VFS is hydrated from DB on project load and serialized back on each AI response completion.

### AI tools

Two tools are registered on every `/api/chat` call (defined in `src/lib/tools/`):
- **`str_replace_editor`** — view, create, str_replace, insert, undo_edit on files
- **`file_manager`** — rename and delete files or directories

The system prompt (`src/lib/prompts/generation.tsx`) instructs the AI to use TailwindCSS, keep `/App.jsx` as the entry point, and use `@/` aliases for local imports.

### Live preview pipeline (`src/lib/transform/jsx-transformer.ts`)

1. Takes all files from the VFS as `Map<path, content>`
2. Babel-transforms each `.jsx/.tsx` file (React 19 mode)
3. Detects imports: local files become blob URLs, third-party packages resolve to `esm.sh`
4. Outputs a full HTML document with an ES module import map, rendered in a sandboxed iframe

### Authentication (`src/lib/auth.ts`, `src/actions/index.ts`)

JWT (HS256, 7-day expiry) stored in an HTTP-only cookie. Passwords hashed with bcrypt (10 rounds). Middleware at `src/middleware.ts` guards `/api/projects` and `/api/filesystem`. Anonymous users can generate without logging in; on signup their sessionStorage-tracked work migrates to a new authenticated project (`src/lib/anon-work-tracker.ts`).

### Data model

```
User (id, email, password)
  └── Project (id, name, userId?, messages: JSON, data: JSON)
```

`Project.messages` stores the full chat history; `Project.data` stores the VFS snapshot. Both are JSON strings. `userId` is nullable to support anonymous projects.

### UI layout (`src/app/main-content.tsx`)

Horizontally resizable panels (react-resizable-panels):
- **Left ~35%**: Chat interface (`src/components/chat/`)
- **Right ~65%**: Toggle between live preview (`src/components/preview/`) and code view — file tree + Monaco editor (`src/components/editor/`)

State is shared via two React contexts: `FileSystemContext` (VFS + tool call handler) and `ChatContext` (wraps Vercel AI SDK's `useChat`).

### Key path aliases

`@/*` resolves to `src/*` (configured in `tsconfig.json` and `components.json`).
