# AiQA - AI-Powered Question Answering System

AiQA is a full-stack Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents, visualize their content through interactive Mind Maps, and have intelligent conversations with the documents using AI.

## 🌟 Features

*   **📄 PDF Document Management**: Upload, store, and process PDF files.
*   **🧠 Interactive Mind Maps**: Visualize document structure and key concepts with auto-generated mind maps.
*   **💬 Context-Aware Chat**: Chat with your documents using advanced RAG techniques. The AI cites specific pages and sources.
*   **💾 Conversation History**: Save and resume chats, with full history tracking.
*   **📈 Scoring & Evaluation**: (Experimental) Metrics to evaluate answer quality.
*   **🔐 Authentication**: Secure user sign-up and sign-in.
*   **⚡ Real-time Updates**: Responsive UI with optimistic updates and loading states.

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: Recoil (Global State), React Query (Server State)
*   **Visualization**: React Flow (Mind Maps), Chart.js
*   **HTTP Client**: Axios

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**:
    *   **Primary**: SQLite (Default for Dev) / PostgreSQL (Provisioned in Docker)
    *   **Vector DB**: Pinecone (for RAG embeddings)
    *   **Caching/Session**: Redis
*   **ORM**: TypeORM

### AI & LLM Services
*   **LLM Provider**: Groq (Llama 3) for fast, high-quality inference.
*   **Embeddings**: Google Gemini (`text-embedding-004`).
*   **Orchestration**: LangChain.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Docker](https://www.docker.com/) & Docker Compose (for Redis/PostgreSQL)
*   API Keys:
    *   **Groq API Key**: For the Chat LLM.
    *   **Google AI API Key**: For text embeddings.
    *   **Pinecone API Key**: For the vector database.

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development
SESSION_SECRET=your_super_secret_session_key
CORS_ORIGIN=http://localhost:5173

# Database (SQLite is used by default in dev)
# DATABASE_TYPE=postgres
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_USER=postgres
# DATABASE_PASSWORD=postgres
# DATABASE_NAME=aiqa

# Redis (Required for Sessions)
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Services (REQUIRED)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama3-8b-8192

GOOGLE_API_KEY=AIza...

PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=aiqa
```

## 🚀 Getting Started

### Option 1: Using Docker (Recommended for Infrastructure)

The easiest way to start the supporting services (Redis, Postgres) is using Docker, while running the app locally for development.

1.  **Start Infrastructure**:
    ```bash
    docker-compose up -d redis postgres
    ```

2.  **Setup Backend**:
    ```bash
    cd backend
    npm install
    # Ensure your .env file is created as above
    npm run dev
    ```

3.  **Setup Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Access the App**:
    Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option 2: Full Docker Deployment

To run the entire stack (Backend + Frontend + DBs) in containers:

1.  Ensure `backend/.env` is properly configured (you may need to change `REDIS_HOST` to `redis` and `DATABASE_HOST` to `postgres` to match container names).
2.  Run:
    ```bash
    docker-compose up --build
    ```

## 📚 Usage Guide

1.  **Sign Up/Login**: Create a new account to access your private dashboard.
2.  **Upload PDF**: Go to the Dashboard and click "Upload PDF". Select a document to process.
3.  **Processing**: The system will parse the PDF, generate embeddings (Google), and store vectors (Pinecone).
4.  **Mind Map**: Click "View Mind Map" on a document card to see a generated visual summary.
5.  **Chat**: Click "Chat" to start a conversation. Ask questions about the document, and the AI will answer with citations.

## 📄 License

This project is licensed under the ISC License.
