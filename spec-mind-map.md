# 🧠 Specification: Auto-Generated Mind Map

## 1. Overview
The **Mind Map** feature aims to provide users with an instant, visual overview of a document's core structure and key concepts immediately after upload. This transforms linear text into a spatial representation, aiding rapid comprehension and memory retention.

## 2. Goals
*   **Instant Value:** Users see a structured summary without typing a single prompt.
*   **Visual Navigation:** Allow users to grasp the "big picture" before diving into details.
*   **Zero-Effort:** Completely automated process triggered by document upload.

## 3. User Experience (UX)
1.  **Trigger:** The user uploads a PDF document successfully.
2.  **Feedback:** While the system processes the file (embedding & indexing), a parallel process starts generating the mind map. A "Generative UI" state (e.g., "Constructing Knowledge Graph...") is displayed.
3.  **Result:**
    *   A dedicated "Mind Map" tab or section appears on the Document Detail page.
    *   An interactive, colorful, and hierarchical diagram is rendered.
    *   Users can zoom, pan, and expand/collapse branches.
4.  **Interaction:** Clicking a node in the mind map could ideally scroll to the relevant section in the PDF or open a chat context about that specific topic (Future scope).

## 4. Technical Specifications

### 4.1 Backend
*   **Trigger Point:** In `pdf.controller.ts` (or equivalent upload handler), after the PDF is parsed and saved.
*   **AI Processing:**
    *   **Service:** `LLMService` needs a new method `generateMindMap(textContext: string): Promise<MindMapNode>`.
    *   **Prompting:** A structured prompt asking the LLM to analyze the document and return a **hierarchical JSON** structure.
    *   **Format:**
        ```json
        {
          "id": "root",
          "label": "Main Topic",
          "children": [
            {
              "id": "branch-1",
              "label": "Key Concept 1",
              "children": [...]
            }
          ]
        }
        ```
*   **Storage:**
    *   Update `Pdf` entity to include a `mindMapData` column (type: `json` or `text`).
    *   Store the generated JSON structure here.

### 4.2 Frontend
*   **Library:** Use **React Flow** (recommended) or a lightweight alternative like `react-d3-tree` or `framer-motion` for custom SVG rendering.
*   **Component:** `MindMapViewer.tsx`.
*   **State:**
    *   Use `react-query` to fetch the `mindMapData` along with document details.
    *   Handle `loading` state gracefully with a skeleton or a "brainstorming" animation.

## 5. Requirements Alignment (@product.md)
*   **User Obsession:** The generated map must be visually appealing ("Vibrant") and interactive. If generation takes time (>100ms), show an optimistic "Building map..." status.
*   **Zero Hallucination:** The prompt must strictly instruct the AI to use *only* the provided text context.
*   **Tech Stack:**
    *   **FE:** React + Tailwind + React Flow.
    *   **BE:** Node.js + LangChain (for structured output parsing).

## 6. Edge Cases
*   **Large Documents:** The LLM context window might be exceeded.
    *   *Solution:* Use the document summary (if available) or the first N chunk tokens to generate the map. Alternatively, use a map-reduce chain for very large docs (Phase 2).
*   **Failure:** If AI fails to generate valid JSON, show a graceful error or a "Retry" button, do not break the page.

## 7. Implementation Steps
1.  **DB Migration:** Add `mindMapSummary` (JSON) column to `Pdf` table.
2.  **Backend Logic:** Implement `generateMindMap` in `ChatService` or `LLMService` using OpenAI function calling or JSON mode.
3.  **API:** Expose this data in the `GET /pdfs/:id` endpoint.
4.  **Frontend:** Install `reactflow` and build the visualization component.
