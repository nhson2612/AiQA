import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const HomePage: React.FC = () => {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="bg-background-light text-[#131118] font-display overflow-x-hidden antialiased selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-[#f2f0f4] bg-white/90 backdrop-blur-md transition-all">
        <div className="px-4 md:px-10 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4 text-[#131118]">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <h2 className="text-[#131118] text-xl font-extrabold tracking-tight">AiQA</h2>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-8">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-[#131118] text-sm font-semibold hover:text-primary transition-colors">Trang chủ</Link>
              <Link to="/documents" className="text-[#131118] text-sm font-semibold hover:text-primary transition-colors">Tài liệu</Link>
            </div>
            <div className="flex gap-3">
              {user ? (
                <Link to="/documents">
                  <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:translate-y-[-1px]">
                    <span className="truncate">Vào ứng dụng</span>
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/signin">
                    <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-[#f2f0f4] hover:bg-[#e4e1e8] text-[#131118] text-sm font-bold transition-colors">
                      <span className="truncate">Đăng nhập</span>
                    </button>
                  </Link>
                  <Link to="/auth/signup">
                    <button className="flex items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-lg shadow-primary/25 transition-all hover:translate-y-[-1px]">
                      <span className="truncate">Đăng ký</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden p-2 text-[#131118]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-[#f2f0f4] p-4 flex flex-col gap-4 shadow-lg">
            <Link to="/" className="text-[#131118] text-sm font-semibold hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Trang chủ</Link>
            <a href="#features" className="text-[#6f6189] text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Tính năng</a>
            <a href="#pricing" className="text-[#6f6189] text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Giá</a>
            <a href="#contact" className="text-[#6f6189] text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Liên hệ</a>
            <div className="h-px bg-gray-100 my-2"></div>
            {user ? (
              <Link to="/documents" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold">
                  Vào ứng dụng
                </button>
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full flex items-center justify-center rounded-lg h-10 px-5 bg-[#f2f0f4] text-[#131118] text-sm font-bold">
                    Đăng nhập
                  </button>
                </Link>
                <Link to="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full flex items-center justify-center rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold">
                    Đăng ký
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-white">
        <div className="absolute inset-0 hero-pattern pointer-events-none"></div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          </div>
          <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-black text-[#131118] leading-[1.15] tracking-tight mb-6">
            Giải đáp mọi thắc mắc từ <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">tài liệu của bạn</span> với AI
          </h1>
          <p className="max-w-2xl text-lg sm:text-xl text-[#6f6189] leading-relaxed mb-10">
            Sử dụng AI tiên tiến và công nghệ RAG để trích xuất thông tin chính xác từ mọi loại file PDF, Word, và TXT. Tiết kiệm 90% thời gian đọc tài liệu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full justify-center">
            <Link to={user ? "/documents" : "/auth/signup"}>
              <button className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white text-base font-bold shadow-xl shadow-primary/30 transition-all hover:scale-105 w-full sm:w-auto">
                <span className="material-symbols-outlined mr-2">upload_file</span>
                {user ? "Tải File Lên Ngay" : "Bắt Đầu Miễn Phí"}
              </button>
            </Link>
            <button className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-white border border-[#dfdbe6] hover:bg-gray-50 text-[#131118] text-base font-bold transition-all w-full sm:w-auto">
              <span className="material-symbols-outlined mr-2">play_circle</span>
              Xem Demo
            </button>
          </div>

          {/* Drag & Drop Area (Visual Only - links to documents page) */}
          <Link to={user ? "/documents" : "/auth/signup"} className="w-full max-w-3xl mx-auto block group/upload">
            <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-[#dfdbe6] p-2 sm:p-3 hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#dfdbe6] bg-[#fcfbfc] px-6 py-12 group-hover/upload:bg-primary/5 group-hover/upload:border-primary/40 transition-all cursor-pointer">
                <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary mb-2">
                  <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-[#131118] text-lg font-bold">Kéo và thả file của bạn vào đây</p>
                  <p className="text-[#6f6189] text-sm">Hỗ trợ PDF, DOCX, TXT. Tối đa 10MB.</p>
                </div>
                <button className="mt-4 flex items-center justify-center rounded-lg h-9 px-4 bg-white border border-[#dfdbe6] text-[#131118] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                  Chọn File từ máy tính
                </button>
              </div>
            </div>
          </Link>
          <p className="mt-6 text-sm text-[#6f6189] flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-green-500">check_circle</span>
            Không cần thẻ tín dụng. 3 lượt hỏi miễn phí mỗi ngày.
          </p>
        </div>
      </header>

      {/* Stats / Trusted By */}
      <section className="border-y border-[#f2f0f4] bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-[#6f6189] uppercase tracking-wider mb-6">Được tin dùng bởi hơn 10,000 người dùng</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale transition-all hover:grayscale-0">
            <span className="text-xl font-bold text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">diamond</span>Bullshi Corp</span>
            <span className="text-xl font-bold text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">change_history</span> StupidTechGlobal</span>
            <span className="text-xl font-bold text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">category</span> FakeCorp</span>
            <span className="text-xl font-bold text-gray-400 flex items-center gap-2"><span className="material-symbols-outlined">blur_on</span> DummyCorp</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background-light relative" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Header Column */}
            <div className="flex flex-col gap-6 md:w-1/3 md:sticky md:top-32">
              <div className="inline-flex items-center gap-2 text-primary font-bold">
                <span className="h-px w-8 bg-primary"></span>
                <span>Quy trình</span>
              </div>
              <h2 className="text-[#131118] text-3xl md:text-4xl font-black leading-tight">
                Cách hoạt động<br />trong 3 bước
              </h2>
              <p className="text-[#6f6189] text-base leading-relaxed">
                Không cần thiết lập phức tạp. AiQA tự động hóa quy trình đọc hiểu tài liệu giúp bạn tập trung vào việc ra quyết định.
              </p>
              <button className="w-fit mt-2 flex items-center text-primary font-bold hover:underline gap-1 group">
                Tìm hiểu thêm về công nghệ
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            {/* Steps Column */}
            <div className="grid grid-cols-1 gap-6 md:w-2/3">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-8 border border-[#dfdbe6] shadow-sm hover:shadow-md transition-shadow flex gap-6 items-start">
                <div className="shrink-0 size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">cloud_upload</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-[#131118]">1. Tải lên tài liệu</h3>
                  <p className="text-[#6f6189]">Kéo thả file PDF, Word hoặc dán văn bản trực tiếp. Hệ thống hỗ trợ file lên đến 500 trang.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-8 border border-[#dfdbe6] shadow-sm hover:shadow-md transition-shadow flex gap-6 items-start">
                <div className="shrink-0 size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-[#131118]">2. AI Phân tích &amp; Học</h3>
                  <p className="text-[#6f6189]">Hệ thống AI sẽ đọc, cấu trúc hóa dữ liệu và lập chỉ mục nội dung trong vài giây.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-8 border border-[#dfdbe6] shadow-sm hover:shadow-md transition-shadow flex gap-6 items-start">
                <div className="shrink-0 size-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">forum</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-[#131118]">3. Hỏi đáp tức thì</h3>
                  <p className="text-[#6f6189]">Đặt câu hỏi bằng ngôn ngữ tự nhiên và nhận câu trả lời chính xác kèm trích dẫn nguồn.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#131118] mb-4">Tại sao nên chọn AiQA?</h2>
            <p className="text-[#6f6189] text-lg">Chúng tôi tối ưu hóa trải nghiệm làm việc với tài liệu của bạn</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group flex flex-col gap-4 p-6 rounded-2xl bg-[#f8f9fa] hover:bg-white hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-[#dfdbe6] transition-all">
              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#131118] mb-2">Chính xác tuyệt đối</h3>
                <p className="text-sm text-[#6f6189] leading-relaxed">Công nghệ RAG giảm thiểu ảo giác của AI, đảm bảo câu trả lời dựa trên dữ liệu thật.</p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="group flex flex-col gap-4 p-6 rounded-2xl bg-[#f8f9fa] hover:bg-white hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-[#dfdbe6] transition-all">
              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#131118] mb-2">Tốc độ siêu nhanh</h3>
                <p className="text-sm text-[#6f6189] leading-relaxed">Xử lý tài liệu dài hàng trăm trang chỉ trong tích tắc. Không còn phải đọc thủ công.</p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="group flex flex-col gap-4 p-6 rounded-2xl bg-[#f8f9fa] hover:bg-white hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-[#dfdbe6] transition-all">
              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#131118] mb-2">Đa dạng định dạng</h3>
                <p className="text-sm text-[#6f6189] leading-relaxed">Hỗ trợ hầu hết các định dạng văn bản phổ biến hiện nay: PDF, DOCX, TXT, MD.</p>
              </div>
            </div>
            {/* Feature 4 */}
            <div className="group flex flex-col gap-4 p-6 rounded-2xl bg-[#f8f9fa] hover:bg-white hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-[#dfdbe6] transition-all">
              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#131118] mb-2">Bảo mật dữ liệu</h3>
                <p className="text-sm text-[#6f6189] leading-relaxed">Dữ liệu của bạn được mã hóa và không được sử dụng để đào tạo các mô hình công cộng.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto rounded-3xl bg-primary overflow-hidden relative shadow-2xl shadow-primary/40 text-center px-6 py-16 sm:px-12 sm:py-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -top-24 -right-24 size-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 size-64 bg-black/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center gap-8">
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
              Sẵn sàng trải nghiệm sức mạnh của AI?
            </h2>
            <p className="text-white/80 text-lg max-w-2xl">
              Đừng để đống tài liệu làm chậm tiến độ công việc của bạn. Bắt đầu hỏi đáp với tài liệu ngay hôm nay.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to={user ? "/documents" : "/auth/signup"}>
                <button className="bg-white text-primary hover:bg-gray-100 h-12 px-8 rounded-xl font-bold text-base shadow-lg transition-transform hover:scale-105 flex items-center justify-center w-full">
                  Dùng thử miễn phí
                </button>
              </Link>
              <button className="bg-primary-hover border border-white/20 text-white hover:bg-primary-hover/80 h-12 px-8 rounded-xl font-bold text-base transition-colors flex items-center justify-center">
                Liên hệ tư vấn
              </button>
            </div>
            <p className="text-white/60 text-sm mt-4">Không yêu cầu thẻ tín dụng • Hủy bất kỳ lúc nào</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#f2f0f4] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                </div>
                <span className="text-lg font-bold text-[#131118]">AiQA</span>
              </div>
              <p className="text-[#6f6189] text-sm max-w-xs leading-relaxed">
                Nền tảng hỏi đáp tài liệu thông minh giúp bạn tiết kiệm thời gian và nâng cao hiệu suất làm việc với sức mạnh của AI.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-[#131118]">Sản phẩm</h4>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Tính năng</a>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Bảng giá</a>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">API</a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-[#131118]">Hỗ trợ</h4>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Hướng dẫn</a>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Cộng đồng</a>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Liên hệ</a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-[#131118]">Pháp lý</h4>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Điều khoản</a>
              <a className="text-[#6f6189] text-sm hover:text-primary transition-colors" href="#">Chính sách bảo mật</a>
            </div>
          </div>
          <div className="border-t border-[#f2f0f4] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#6f6189] text-sm">© 2024 AiQA Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <a className="text-[#6f6189] hover:text-primary transition-colors" href="#">
                <span className="sr-only">Facebook</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
                </svg>
              </a>
              <a className="text-[#6f6189] hover:text-primary transition-colors" href="#">
                <span className="sr-only">Twitter</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84">
                  </path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}