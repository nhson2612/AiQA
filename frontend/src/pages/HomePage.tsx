import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import user1 from '@/assets/images/user-1.png'
import user2 from '@/assets/images/user-2.png'
import user3 from '@/assets/images/user-3.png'
import bgImage from '@/assets/images/background-image.png'

export const HomePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <>
      <style>{`
        .geometric-bg {
            clip-path: polygon(0 0, 100% 0, 100% 85%, 0% 100%);
        }
        .sharp-card {
            border-left: 4px solid #fe512a;
        }
      `}</style>
      <div className="bg-background-light dark:bg-background-dark text-[#1d0f0c] dark:text-white antialiased transition-colors duration-300 font-display">

        <main>
          {/* Hero Section */}
          <section className="relative pt-12 pb-24 px-6 lg:px-40">
            <div className="max-w-[1200px] mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col gap-8 order-2 lg:order-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/10 border border-primary/20 w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-primary text-xs font-bold uppercase tracking-widest">New: GPT-4o Integration</span>
                  </div>
                  <div className="flex flex-col gap-6">
                    <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-[#1d0f0c] dark:text-white">
                      Unlock the <span className="text-primary">Intelligence</span> Within Your Documents.
                    </h1>
                    <p className="text-lg lg:text-xl text-[#a15645] dark:text-[#d2b5ae] font-normal leading-relaxed max-w-[540px]">
                      AiQA transforms static PDFs and data into interactive insights through OCR, streaming AI chat, and automated mindmapping.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Link to={user ? "/documents" : "/auth/signup"}>
                      <button className="flex min-w-[160px] cursor-pointer items-center justify-center rounded h-14 px-8 bg-primary text-white text-base font-bold tracking-tight hover:scale-[1.02] active:scale-100 transition-all">
                        {user ? "Upload Documents" : "Get Started for Free"}
                      </button>
                    </Link>
                    <button className="flex min-w-[160px] cursor-pointer items-center justify-center rounded h-14 px-8 border-2 border-primary text-primary text-base font-bold tracking-tight hover:bg-primary/5 transition-all">
                      Book a Demo
                    </button>
                  </div>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 bg-cover bg-center"
                        style={{ backgroundImage: `url(${user1})` }}
                      ></div>
                      <div className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 bg-cover bg-center"
                        style={{ backgroundImage: `url(${user2})` }}
                      ></div>
                      <div className="w-10 h-10 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 bg-cover bg-center"
                        style={{ backgroundImage: `url(${user3})` }}
                      ></div>
                    </div>
                    <p className="text-sm font-medium text-[#a15645] dark:text-[#d2b5ae]">
                      <span className="text-[#1d0f0c] dark:text-white font-bold">5,000+</span> teams trust AiQA
                    </p>
                  </div>
                </div>
                <div className="relative order-1 lg:order-2">
                  <div className="w-full aspect-square bg-cover bg-center rounded-xl shadow-2xl relative z-10 overflow-hidden border border-white/20"
                    style={{ backgroundImage: `url(${bgImage})` }}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent mix-blend-overlay"></div>
                  </div>
                  {/* Sharp accents */}
                  <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 -z-0 rotate-12"></div>
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 border border-primary/20 -z-0 -rotate-12"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section Header */}
          <section className="bg-white dark:bg-[#1a0d0a] py-20 px-6 lg:px-40 border-y border-[#f4e9e6] dark:border-[#3a2521]">
            <div className="max-w-[1200px] mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div className="max-w-[640px]">
                  <h2 className="text-primary text-sm font-bold uppercase tracking-[0.2em] mb-4">Precision-Engineered Intelligence</h2>
                  <h3 className="text-4xl lg:text-5xl font-black leading-tight dark:text-white">
                    Engineered for high-stakes document workflows.
                  </h3>
                </div>
                <p className="text-[#a15645] dark:text-[#d2b5ae] text-lg max-w-[400px]">
                  Our suite of AI tools is designed to maximize clarity and speed up information retrieval across your organization.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="group flex flex-col gap-6 p-8 bg-background-light dark:bg-background-dark border border-[#ead2cd] dark:border-[#3a2521] rounded-lg sharp-card hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined !text-3xl">description</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-bold dark:text-white">Document Management</h4>
                    <p className="text-[#a15645] dark:text-[#d2b5ae] text-base leading-relaxed">
                      High-speed OCR and PDF parsing for seamless data extraction. Turn unsearchable scanned documents into structured knowledge.
                    </p>
                  </div>
                  <div className="mt-auto">
                    <a className="text-primary font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer">
                      Learn More <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                    </a>
                  </div>
                </div>
                {/* Feature 2 */}
                <div className="group flex flex-col gap-6 p-8 bg-background-light dark:bg-background-dark border border-[#ead2cd] dark:border-[#3a2521] rounded-lg sharp-card hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined !text-3xl">forum</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-bold dark:text-white">Intelligent AI Chat</h4>
                    <p className="text-[#a15645] dark:text-[#d2b5ae] text-base leading-relaxed">
                      Real-time streaming responses with global document context. Ask anything about your library and get cited answers instantly.
                    </p>
                  </div>
                  <div className="mt-auto">
                    <a className="text-primary font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer">
                      Learn More <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                    </a>
                  </div>
                </div>
                {/* Feature 3 */}
                <div className="group flex flex-col gap-6 p-8 bg-background-light dark:bg-background-dark border border-[#ead2cd] dark:border-[#3a2521] rounded-lg sharp-card hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined !text-3xl">account_tree</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xl font-bold dark:text-white">Mindmap Generation</h4>
                    <p className="text-[#a15645] dark:text-[#d2b5ae] text-base leading-relaxed">
                      Instant visual structuring of complex data. Automatically generate sharp, logical maps of your document hierarchy and key themes.
                    </p>
                  </div>
                  <div className="mt-auto">
                    <a className="text-primary font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer">
                      Learn More <span className="material-symbols-outlined !text-sm">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 px-6 lg:px-40 relative overflow-hidden">
            {/* Background Shape */}
            <div className="absolute inset-0 bg-primary skew-y-[-2deg] origin-right translate-y-12"></div>
            <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col items-center text-center">
              <div className="flex flex-col gap-6 max-w-[800px]">
                <h2 className="text-white text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                  Ready to transform your document workflow?
                </h2>
                <p className="text-white/80 text-lg lg:text-xl font-medium">
                  Join thousands of professionals using AiQA to master their document intelligence. Start for free today, no credit card required.
                </p>
              </div>
              <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link to={user ? "/documents" : "/auth/signup"}>
                  <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-10 bg-white text-primary text-lg font-bold hover:bg-background-light transition-all shadow-xl">
                    Get Started for Free
                  </button>
                </Link>
                <button className="flex min-w-[200px] cursor-pointer items-center justify-center rounded-lg h-14 px-10 border-2 border-white text-white text-lg font-bold hover:bg-white/10 transition-all">
                  Talk to Sales
                </button>
              </div>
              <p className="mt-8 text-white/60 text-sm font-medium">
                Available on Web, macOS, and Windows.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-background-light dark:bg-background-dark py-16 px-6 lg:px-40 border-t border-[#f4e9e6] dark:border-[#3a2521]">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
            <div className="col-span-2 lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="size-6 text-primary">
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V44Z" fillRule="evenodd"></path>
                  </svg>
                </div>
                <h2 className="text-lg font-bold dark:text-white">AiQA</h2>
              </div>
              <p className="text-[#a15645] dark:text-[#d2b5ae] text-sm max-w-[280px]">
                Empowering professional teams with precision AI-driven document intelligence and visual insights.
              </p>
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded border border-[#ead2cd] dark:border-[#3a2521] flex items-center justify-center text-[#1d0f0c] dark:text-white hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined !text-xl">public</span>
                </a>
                <a className="w-10 h-10 rounded border border-[#ead2cd] dark:border-[#3a2521] flex items-center justify-center text-[#1d0f0c] dark:text-white hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer">
                  <span className="material-symbols-outlined !text-xl">mail</span>
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold dark:text-white">Product</h5>
              <nav className="flex flex-col gap-3">
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">OCR Tech</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">AI Chat</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Integrations</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Security</a>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold dark:text-white">Company</h5>
              <nav className="flex flex-col gap-3">
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">About Us</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Careers</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Blog</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Legal</a>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-bold dark:text-white">Support</h5>
              <nav className="flex flex-col gap-3">
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Help Center</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">API Docs</a>
                <a className="text-sm text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Community</a>
              </nav>
            </div>
          </div>
          <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-[#f4e9e6] dark:border-[#3a2521] flex flex-col md:flex-row justify-between gap-4">
            <p className="text-xs text-[#a15645] dark:text-[#d2b5ae]">© 2026 AiQA Technologies Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="text-xs text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Privacy Policy</a>
              <a className="text-xs text-[#a15645] dark:text-[#d2b5ae] hover:text-primary cursor-pointer">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
