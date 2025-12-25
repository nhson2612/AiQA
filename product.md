# 📜 AiQA - Hồ Sơ Năng Lực & Hiến Pháp Dự Án

> **Tài liệu này là "nguồn sự thật duy nhất" (Single Source of Truth) về tầm nhìn, kiến trúc và quy tắc cốt lõi của AiQA.**

## 1. 🎯 Tầm Nhìn & Sứ Mệnh (Vision & Mission)
*   **Sứ mệnh:** Giải phóng con người khỏi việc đọc thủ công hàng trăm trang tài liệu. AiQA biến việc tra cứu thông tin thành cuộc hội thoại tự nhiên, chính xác và tức thì.
*   **Định vị:** Không chỉ là một công cụ RAG, AiQA là một "Trợ lý nghiên cứu thông minh" có khả năng tổng hợp, so sánh và trích dẫn nguồn minh bạch.

## 2. ⚖️ Hiến Pháp Dự Án (Core Constitution)
Đây là những quy tắc **BẤT BIẾN**, mọi dòng code đều phải tuân thủ:

1.  **Người dùng là trên hết (User Obsession):**
    *   Mọi tương tác UI phải có phản hồi dưới 100ms (dùng Optimistic UI).
    *   Không bao giờ để người dùng chờ đợi mà không biết chuyện gì đang xảy ra (Luôn có Loading Skeleton / Progress Bar).
    *   Thẩm mỹ cực kỳ quan trọng: Giao diện phải Hiện đại, Sạch sẽ, Vibrant (theo style của `examples/homepage.html`).

2.  **Trung thực tuyệt đối (Zero Hallucination Goal):**
    *   AI **bắt buộc** phải trích dẫn nguồn (ví dụ: `[Trang 5]`).
    *   Nếu tài liệu không có thông tin, AI phải trả lời "Không tìm thấy", tuyệt đối không bịa đặt.

3.  **Chất lượng Code (Engineering Excellence):**
    *   **No `any`**: TypeScript phải được dùng triệt để (Strict mode).
    *   **Controller mỏng, Service dày**: Logic nghiệp vụ nằm ở Service, Controller chỉ điều hướng request/response.
    *   **Clean Architecture**: Tách biệt rõ ràng Data Access, Business Logic và API Layer.

## 3. 🛠️ Tech Stack & Kiến Trúc

### Frontend (Giao diện)
*   **Framework:** React 18 (Vite)
*   **Ngôn ngữ:** TypeScript
*   **Styling:** Tailwind CSS (Mobile-first, Dark mode ready)
*   **State Management:** Recoil (Client state), React Query (Server state)
*   **Hiệu ứng:** Framer Motion (cho các micro-interaction mượt mà)

### Backend (Lõi xử lý)
*   **Runtime:** Node.js
*   **Framework:** Express.js (với kiến trúc Module)
*   **Database (Primary):** SQLite (Dev), PostgreSQL (Production - via Docker)
*   **Database (Vector):** Pinecone (Lưu trữ Embeddings để tìm kiếm ngữ nghĩa)
*   **ORM:** TypeORM
*   **Caching/Queue:** Redis

### AI Engine (Trí tuệ nhân tạo)
*   **LLM:** OpenAI (GPT-4o/GPT-3.5-turbo) hoặc Groq (cho tốc độ cao)
*   **Embeddings:** Google Gemini Embeddings (`text-embedding-004`)
*   **Framework:** LangChain
*   **Cơ chế:** RAG (Retrieval-Augmented Generation) với Multi-query Retrieval.

## 4. 🧩 Cấu Trúc Dự Án (Key Directories)

```
AiQA/
├── backend/
│   ├── src/
│   │   ├── config/       # Cấu hình (DB, Env, Constants)
│   │   ├── entities/     # TypeORM Entities (User, Pdf, Conversation...)
│   │   ├── routes/       # API Routes definitions
│   │   ├── services/     # Business Logic (Nơi chứa logic chính của AI)
│   │   │   ├── chat.service.ts      # Xử lý hội thoại & Prompting
│   │   │   ├── retriever.service.ts # Logic tìm kiếm vector
│   │   │   └── llm.service.ts       # Wrapper gọi AI
│   │   └── server.ts     # Entry point
├── frontend/
│   ├── src/
│   │   ├── atoms/        # Recoil States
│   │   ├── components/   # React Components (Atomic design: common, chat, auth...)
│   │   ├── hooks/        # Custom Hooks
│   │   └── pages/        # Route Pages
└── examples/             # Các bản mẫu UI/UX để tham khảo
```

## 5. 🚀 Roadmap & Tính Năng (Dự kiến)

*   **Phase 1 (Hiện tại):** Chat với 1 file PDF, Streaming response, Trích dẫn nguồn.
*   **Phase 2 (Sắp tới):**
    *   🎙️ **Podcast Mode:** Biến tài liệu thành Audio hội thoại.
    *   🌐 **Multi-doc Chat:** Hỏi 1 câu trả lời từ nhiều tài liệu.
    *   🗣️ **Voice Interaction:** Ra lệnh bằng giọng nói.
    *   🧠 **Mind Map:** Tự động tóm tắt thành sơ đồ tư duy.

---
*Tài liệu này được cập nhật lần cuối vào ngày 24/12/2025. Mọi thay đổi về kiến trúc phải được cập nhật vào đây.*
