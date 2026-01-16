# AiQA Backend Context

## Project Overview
This directory contains the backend services for the **AiQA** application. It is built with **Node.js**, **Express**, and **TypeScript**, providing API endpoints for authentication, document management (PDFs), and AI-powered chat functionality.

### Architecture & Tech Stack
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Database:** TypeORM (supports SQLite for dev, PostgreSQL for prod)
*   **Vector DB:** Pinecone (via `@pinecone-database/pinecone`)
*   **AI Orchestration:** LangChain (Agents, Tools, Workflows)
*   **Caching/Sessions:** Redis
*   **Logging:** Winston (Structured logging)
*   **Validation:** Zod

## Key Directories & Files

### `src/`
*   **`server.ts`**: Entry point. Sets up Express, middleware (CORS, Helmet, Session), and connects to the database.
*   **`config/`**: Configuration files for Database (`database.ts`) and Redis (`redis.ts`).
*   **`routes/`**: API Route definitions (`auth`, `pdf`, `conversation`, `score`, `library`).
*   **`entities/`**: TypeORM data models (`User`, `Pdf`, `Conversation`, `Message`, `Score`).
*   **`services/`**: Core business logic (e.g., `logger.service.ts`, `pdfProcessor.service.ts`).
*   **`agents/`**: AI Logic implementation using the Agent/Workflow pattern.
    *   **`chat/`**: Handles Q&A logic (`ChatAgent.ts`, `AnswerQuestionWorkflow`).
    *   **`document/`**: Handles PDF ingestion and processing (`DocumentAgent.ts`, `IngestPdfWorkflow`).
    *   **`core/`**: Base classes for Steps, Tools, and Workflows.

### Configuration Files
*   **`package.json`**: Dependencies and scripts.
*   **`.env`**: Environment variables (must be created).
*   **`LOGGING.md`**: Detailed guide on the logging system.

## Setup & Running

### Prerequisites
*   Node.js & npm
*   Redis (for session management)
*   Pinecone API Key & Index
*   OpenAI / Google GenAI API Keys

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file based on the requirements in `src/config/` and `src/server.ts`. Key variables include:
*   `PORT`
*   `DATABASE_URL` (or defaults to SQLite `database.sqlite`)
*   `REDIS_URL` / `REDIS_HOST`, `REDIS_PORT`
*   `OPENAI_API_KEY`
*   `PINECONE_API_KEY`, `PINECONE_INDEX`
*   `SESSION_SECRET`

### Scripts
*   **Development:** `npm run dev` (Runs with `nodemon` + `ts-node`)
*   **Build:** `npm run build` (Compiles to `dist/`)
*   **Start:** `npm start` (Runs compiled code from `dist/server.js`)

## Development Conventions

### Logging
*   **Strict Rule:** Do not use `console.log` for application logic. Use the provided `logger` from `src/services/logger.service.ts`.
*   **Context:** Use `createContextLogger(req)` or pass context objects to loggers to maintain request traceability.
*   **Levels:** Use `logger.error` for errors, `logger.warn` for warnings, `logger.info` for general events, and `logger.debug` for dev details.
*   See `LOGGING.md` for full details.

### Database
*   Uses TypeORM with `DataSource`.
*   Entities are defined in `src/entities/` and must be registered in `src/config/database.ts`.
*   Default strategy checks `DATABASE_URL` for Postgres, otherwise falls back to local SQLite.

### AI Agents
*   Logic is encapsulated in "Agents" (`src/agents/`).
*   Agents execute "Workflows" which consist of sequential "Steps".
*   "Tools" wrap external capabilities (LLM, Retriever, etc.).

### Error Handling
*   Use custom error classes (`AppError`, `ValidationError`, `AuthError`, etc.) from `src/services/logger.service.ts`.
*   Global error handler in `server.ts` catches these and formats consistent JSON responses.
