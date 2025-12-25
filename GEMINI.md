# AiQA Project Context

## Project Overview
**AiQA** is a full-stack AI-powered Question Answering application. It allows users to upload documents (PDFs), manage conversations, and receive AI-generated answers based on the content of those documents using RAG (Retrieval-Augmented Generation).

### Tech Stack
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Recoil (State Management), React Query, Axios.
*   **Backend:** Node.js, Express, TypeScript, TypeORM.
*   **AI/ML:** LangChain, OpenAI, Pinecone (Vector Database).
*   **Database:**
    *   **Codebase:** Currently configured for **SQLite** (`backend/src/config/database.ts`).
    *   **Infrastructure:** `docker-compose.yml` provisions **PostgreSQL**, indicating a likely intended switch or production setup.
*   **Caching/Sessions:** Redis (via `connect-redis` and `ioredis`).
*   **Infrastructure:** Docker & Docker Compose.

## Building and Running

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn
*   Docker & Docker Compose (optional, for running dependencies like Redis/Postgres)

### Environment Setup
1.  **Backend:** Create `backend/.env` (refer to `docker-compose.yml` environment variables for required keys: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `SESSION_SECRET`, etc.).
2.  **Frontend:** Create `frontend/.env` (if needed, though `VITE_API_URL` is often set).

### Development Scripts

**Backend** (`/backend`)
*   `npm run dev`: Starts the backend in development mode with `nodemon` and `ts-node`.
*   `npm run build`: Compiles TypeScript to JavaScript (`dist/`).
*   `npm start`: Runs the compiled code.

**Frontend** (`/frontend`)
*   `npm run dev`: Starts the Vite development server (usually port 5173).
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Previews the production build.
*   `npm run lint`: Runs ESLint.

### Docker
*   `docker-compose up --build`: Builds and starts the entire stack (Postgres, Redis, Backend, Frontend).
    *   *Note:* Verify `backend/src/config/database.ts` matches your desired database strategy (currently hardcoded to SQLite despite Docker providing Postgres).

## Key Files & Structure

### Backend (`/backend`)
*   **`src/server.ts`**: Application entry point. Configures Express, Middleware (CORS, Helmet, Morgan, Session), and Routes.
*   **`src/config/database.ts`**: TypeORM Data Source configuration. **Critical:** Currently hardcoded to `sqlite`.
*   **`src/routes/`**: API Route definitions (`auth`, `conversation`, `pdf`, `score`).
*   **`src/services/`**: Business logic, including `llm.service.ts` and `chat.service.ts` for AI interactions.
*   **`src/entities/`**: TypeORM entities (`User`, `Pdf`, `Conversation`, `Message`, `Score`).

### Frontend (`/frontend`)
*   **`src/main.tsx`**: React entry point.
*   **`src/App.tsx`**: Main application component containing Routing logic (`react-router-dom`) and Global Providers (`RecoilRoot`, `QueryClientProvider`).
*   **`src/components/`**: UI components organized by feature (`auth`, `chat`, `documents`) and `common` elements.
*   **`src/atoms/`**: Recoil state atoms (`authAtom`, `chatAtom`, `documentsAtom`).
*   **`src/hooks/`**: Custom React hooks for data fetching and logic.

## Development Conventions
*   **Styling:** Tailwind CSS is used for styling.
*   **State Management:** Recoil for global client state, React Query for server state.
*   **Code Style:** ESLint and Prettier are configured.
*   **API:** RESTful API structure with Express routes and controllers (implied in services/routes).
