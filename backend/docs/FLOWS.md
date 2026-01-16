# AiQA System Operational Flows

This document details the core operational flows of the AiQA backend system, specifically focusing on PDF Ingestion and Chat Interaction.

## 1. PDF Ingestion Flow (RAG Setup)

This flow describes how a user uploads a PDF and how the system processes it to make it searchable via RAG (Retrieval-Augmented Generation).

### Overview
1.  **Upload:** User sends a PDF file via API.
2.  **Storage:** File is saved to local disk (`uploads/`) and metadata to Database.
3.  **Processing (Async):** The system triggers an asynchronous background process.
4.  **Extraction:** Text and images are extracted from the PDF.
5.  **Embedding:** Text is chunked, embedded (converted to vectors), and stored in Pinecone.

### Diagram

```mermaid
sequenceDiagram
    participant User
    participant API as API (Express)
    participant DB as SQLite/Postgres
    participant Disk as Local Storage
    participant Workflow as IngestPdfWorkflow
    participant Step1 as ExtractTextStep
    participant Step2 as ProcessImagesStep
    participant Embed as EmbeddingTool
    participant Pinecone as Pinecone Vector DB

    User->>API: POST /api/pdfs (multipart/form-data)
    
    rect rgb(200, 255, 200)
        Note over API: Sync Phase
        API->>Disk: Save file (multer)
        API->>DB: Create PDF Record (status: pending)
        API-->>User: Return 200 OK (PDF Metadata)
    end

    rect rgb(220, 220, 255)
        Note over API, Pinecone: Async Background Phase
        API->>Workflow: Start Processing
        Workflow->>Step1: Execute ExtractTextStep
        Step1->>Disk: Read PDF
        Step1-->>Workflow: Return Raw Text
        
        Workflow->>Step2: Execute ProcessImagesStep
        Step2-->>Workflow: Return Processed Images (OCR/Captions)
        
        Workflow->>Embed: Execute EmbeddingTool
        Embed->>Embed: Chunk Text
        Embed->>Pinecone: Store Vectors (Embeddings)
        
        Note over API: Update processing status (implied via logs/state)
    end
```

### Key Components

*   **Endpoint:** `POST /api/pdfs`
*   **Controller:** `src/routes/pdf.routes.ts`
*   **Workflow:** `src/agents/document/workflows/IngestPdfWorkflow.ts`
*   **Tools:**
    *   `EmbeddingTool`: Handles interaction with OpenAI (for embeddings) and Pinecone.
    *   `processPdf` (Service): Wrapper for `pdf-parse` or similar libraries.

---

## 2. Chat Interaction Flow (RAG Execution)

This flow describes how a user asks a question about a document and receives an AI-generated answer based on the document's content.

### Overview
1.  **Request:** User sends a message (query) associated with a PDF.
2.  **Context Building:** System analyzes the query and retrieves relevant chunks from Pinecone.
3.  **LLM Generation:** System constructs a prompt with the retrieved context and sends it to the LLM.
4.  **Response:** The LLM streams the answer back to the user, followed by suggested follow-up questions.

### Diagram

```mermaid
sequenceDiagram
    participant User
    participant API as API (Express)
    participant DB as SQLite/Postgres
    participant Agent as ChatAgent
    participant Step1 as GenerateSearchQueries
    participant Step2 as RetrieveContext
    participant Pinecone as Pinecone Vector DB
    participant LLM as LLM (OpenAI/Gemini)

    User->>API: POST /api/conversations/:id/messages
    API->>DB: Save User Message
    API->>Agent: stream(userQuery, history, pdfId)

    rect rgb(255, 240, 200)
        Note over Agent: Step 1: Query Optimization
        Agent->>Step1: Generate search queries
        Step1->>LLM: "Rephrase this query for search..."
        LLM-->>Step1: Optimized Queries
    end

    rect rgb(200, 240, 255)
        Note over Agent: Step 2: Retrieval
        Agent->>Step2: Retrieve Context
        Step2->>Pinecone: Vector Search (Optimized Queries)
        Pinecone-->>Step2: Matched Text Chunks
    end

    rect rgb(220, 255, 220)
        Note over Agent: Step 3: Generation & Streaming
        Agent->>LLM: Stream Answer (Prompt + Context + History)
        loop Token Stream
            LLM-->>Agent: Token
            Agent-->>API: Token
            API-->>User: SSE Event (data: content)
        end
    end

    rect rgb(255, 220, 220)
        Note over Agent: Step 4: Post-Processing
        Agent->>LLM: Generate Suggestions
        LLM-->>Agent: Suggestions JSON
        Agent-->>API: Suggestions
        API-->>User: SSE Event (type: suggestions)
        API->>DB: Save Assistant Message
        API-->>User: [DONE]
    end
```

### Key Components

*   **Endpoint:** `POST /api/conversations/:id/messages`
*   **Controller:** `src/routes/conversation.routes.ts`
*   **Agent:** `src/agents/chat/ChatAgent.ts`
*   **Steps:**
    *   `GenerateSearchQueriesStep`: Optimizes user input for vector search.
    *   `RetrieveContextStep`: Queries Pinecone.
    *   `LlmTool`: Handles streaming interaction with the AI model.
