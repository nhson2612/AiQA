# Chiến lược Di chuyển Lưu trữ: Từ Local File System sang Amazon S3

Tài liệu này phác thảo kế hoạch kỹ thuật, kiến trúc mới và các thách thức khi chuyển đổi hệ thống lưu trữ tệp tin của AiQA từ ổ cứng cục bộ (Local Disk) sang Cloud Object Storage (Amazon S3).

## 1. So sánh Kiến trúc

### Hiện tại (Local Storage)
*   **Upload:** Middleware `multer` nhận stream và ghi trực tiếp vào thư mục `./uploads/`.
*   **Database:** Lưu đường dẫn file cục bộ (ví dụ: `uploads/file-123.pdf`).
*   **Xử lý (Processing):** Các Agent (`DocumentAgent`, `PdfTools`) đọc file trực tiếp từ đường dẫn `./uploads/...` bằng `fs.readFile` hoặc CLI tools (`pdfimages`).
*   **Download:** Serve file trực tiếp từ ổ cứng server thông qua `res.download()`.

### Tương lai (Amazon S3)
*   **Upload:** Middleware `multer-s3` nhận stream và upload thẳng lên S3 Bucket. Server không lưu file gốc lâu dài.
*   **Database:** Lưu S3 Object Key (ví dụ: `pdfs/file-123.pdf`) và URL (S3 Location).
*   **Xử lý (Processing):** 
    *   File nằm trên Cloud, không phải trên ổ cứng Server.
    *   Cần tải file từ S3 về thư mục tạm (`/tmp`) để các công cụ CLI xử lý.
*   **Download:**
    *   **Option A (Proxy):** Stream từ S3 -> Server -> Client (Giữ API hiện tại).
    *   **Option B (Signed URL):** Server tạo URL tạm thời có chữ ký, Client tải trực tiếp từ S3 (Giảm tải cho Server).

## 2. Các Thay đổi Kỹ thuật Cốt lõi

### A. Upload Middleware
*   **Thay thế:** `multer.diskStorage` ➔ `multer-s3`.
*   **Dữ liệu:** `req.file.path` (local path) sẽ biến mất. Thay vào đó là `req.file.location` (S3 URL) và `req.file.key` (S3 Key).

### B. PDF Processing Service (Thách thức lớn nhất)
Các công cụ hiện tại như `pdfimages` (Poppler) và `tesseract` hoạt động dựa trên **File Path** của hệ điều hành. Chúng không thể đọc trực tiếp từ S3 URL.

**Giải pháp: Quy trình "Download-Process-Delete"**
1.  **Download:** Khi cần xử lý, Service tải file từ S3 về thư mục tạm (`/tmp/uuid.pdf`).
2.  **Process:** Gọi `DocumentAgent` với đường dẫn file tạm này (như logic cũ).
3.  **Cleanup:** Sau khi xử lý xong (hoặc gặp lỗi), xóa file tạm ngay lập tức để giải phóng dung lượng.

### C. Quản lý File (Delete/Get)
*   Thay `fs.unlink` bằng lệnh `DeleteObjectCommand` của S3 SDK.
*   Thay `fs.exists` bằng lệnh `HeadObjectCommand`.

## 3. Thách thức & Rủi ro

### 1. Tương thích Công cụ (Legacy Tools Compatibility)
*   **Vấn đề:** `PdfImagesTool` gọi lệnh shell `pdfimages`. Lệnh này bắt buộc phải có file input trên đĩa.
*   **Tác động:** Không thể stream trực tiếp từ S3 vào `pdfimages`. Bắt buộc phải có bước trung gian tải về đĩa (IO overhead).

### 2. Độ trễ (Latency)
*   **Vấn đề:** Quy trình xử lý sẽ chậm hơn do phải tải file từ S3 về Server trước khi bắt đầu OCR/Parsing.
*   **Giải pháp:** Cần User Experience tốt (Progress bar, Notification) vì thời gian chờ sẽ tăng, đặc biệt với file lớn.

### 3. Môi trường Development (DX)
*   **Vấn đề:** Dev cần mạng Internet và AWS Credentials để chạy tính năng upload/xử lý. Không thể code offline hoàn toàn phần này.
*   **Giải pháp:** Có thể dùng **LocalStack** hoặc **MinIO** để giả lập S3 trên local docker nếu cần offline, hoặc giữ logic `if (isDev) useDisk else useS3` (tuy nhiên cách này làm code phức tạp và dễ lỗi sai lệch môi trường).

### 4. Chi phí (Cost)
*   S3 tính phí lưu trữ và request (GET/PUT). Cần cấu hình **Lifecycle Rules** để xóa các file rác hoặc file tạm nếu không cần thiết.

## 4. Lộ trình Thực hiện

1.  **Cài đặt Dependencies:** `@aws-sdk/client-s3`, `multer-s3`.
2.  **Cấu hình:** Tạo `src/config/s3.ts`.
3.  **Refactor Upload:** Chuyển `upload.ts` sang hỗ trợ S3.
4.  **Refactor Processor:** Viết hàm utility `downloadS3FileToTemp` và tích hợp vào `pdfProcessor.service.ts`.
5.  **Refactor Routes:** Cập nhật `pdf.routes.ts` để xử lý logic xóa và download mới.
6.  **Kiểm thử:** Upload file, verify trên AWS Console, verify tính năng Chat/OCR hoạt động.
