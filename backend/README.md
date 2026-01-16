# AiQA Backend

Hệ thống Backend cho ứng dụng AiQA - Nền tảng Hỏi đáp thông minh dựa trên tài liệu (RAG). Được xây dựng với Node.js, Express, TypeScript và tích hợp các công nghệ AI tiên tiến.

## 🌟 Tính năng Chính

*   **Xử lý Tài liệu (RAG Pipeline):**
    *   Upload và phân tích tệp PDF.
    *   Hỗ trợ OCR (Optical Character Recognition) sử dụng Tesseract cho các tài liệu dạng ảnh.
    *   Tự động chia nhỏ văn bản (Chunking) và tạo Embeddings.
*   **Hỏi đáp Thông minh (AI Chat):**
    *   Trả lời câu hỏi dựa trên ngữ cảnh tài liệu đã tải lên.
    *   Sử dụng LangChain kết hợp với OpenAI hoặc Google Gemini.
    *   Lưu trữ Vector Search với Pinecone.
*   **Mindmap Generator:** Tự động tạo sơ đồ tư duy (Mindmap) từ nội dung tài liệu.
*   **Quản lý Người dùng & Bảo mật:**
    *   Đăng ký/Đăng nhập người dùng.
    *   Quản lý phiên đăng nhập (Session) với Redis.
*   **Cơ sở dữ liệu linh hoạt:** Hỗ trợ SQLite (cho phát triển nhanh) và PostgreSQL (cho production).

## 🛠 Tech Stack

*   **Runtime:** Node.js, TypeScript
*   **Framework:** Express.js (v5)
*   **Database:** TypeORM (hỗ trợ SQLite & PostgreSQL)
*   **Vector DB:** Pinecone
*   **AI/LLM:** LangChain, OpenAI API, Google GenAI
*   **Caching/Session:** Redis, connect-redis
*   **OCR:** Tesseract.js / node-tesseract-ocr

## 📋 Yêu cầu Hệ thống

*   **Node.js:** v18 trở lên
*   **Docker:** (Khuyến nghị) Để chạy Redis và PostgreSQL.
*   **Tesseract OCR:** Cần cài đặt trên hệ thống nếu sử dụng tính năng OCR.
    *   Ubuntu: `sudo apt-get install tesseract-ocr`
    *   macOS: `brew install tesseract`

## 🚀 Cài đặt & Cấu hình

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Cấu hình Môi trường (.env)

Tạo tệp `.env` tại thư mục gốc `backend/` và điền các thông tin sau:

```env
# Server
PORT=3000
NODE_ENV=development

# Authentication
SESSION_SECRET=your_super_secret_session_key

# Database
# Để trống để sử dụng SQLite mặc định (database.sqlite)
# Hoặc điền connection string cho PostgreSQL
# DATABASE_URL=postgres://user:pass@localhost:5432/aiqa_db

# Redis (Session Store)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=

# AI & Vector DB Services
OPENAI_API_KEY=sk-...
# Nếu dùng Google Gemini thay thế
# GOOGLE_API_KEY=...

# Pinecone (Vector Database)
PINECONE_API_KEY=...
PINECONE_INDEX=...

# Tesseract (Optional path config)
# TESSERACT_LANG=eng
```

### 3. Khởi chạy Database & Redis (Docker)

Sử dụng `docker-compose.yml` ở thư mục gốc của dự án (nếu có) hoặc chạy riêng lẻ:

```bash
# Ví dụ chạy Redis nhanh bằng Docker
docker run -d -p 6379:6379 redis
```

## 🏃‍♂️ Chạy Ứng dụng

### Chế độ Phát triển (Development)
Chạy server với `nodemon` để tự động reload khi sửa code:

```bash
npm run dev
```

### Build & Chạy Production

```bash
# Biên dịch TypeScript sang JavaScript (thư mục dist/)
npm run build

# Chạy server từ code đã biên dịch
npm start
```

## 📂 Cấu trúc Thư mục

*   `src/agents/`: Logic cho các AI Agent (Chat, Document Processing, Mindmap).
*   `src/config/`: Cấu hình Database, Redis, Environment.
*   `src/entities/`: Các TypeORM Entities (User, Pdf, Conversation...).
*   `src/routes/`: Định nghĩa API endpoints.
*   `src/services/`: Business logic chính (ChatService, PdfProcessor...).
*   `src/prompts/`: Các mẫu câu lệnh (Prompts) cho AI.
*   `uploads/`: Thư mục tạm chứa file upload.

## 📝 API Endpoints Chính

*   `POST /auth/register`: Đăng ký.
*   `POST /auth/login`: Đăng nhập.
*   `POST /library/upload`: Upload PDF và xử lý (OCR/Embeddings).
*   `POST /conversation`: Tạo cuộc hội thoại mới.
*   `POST /conversation/:id/chat`: Gửi tin nhắn và nhận câu trả lời từ AI.
