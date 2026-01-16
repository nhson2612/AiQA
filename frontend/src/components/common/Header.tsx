import { useAuth } from "@/hooks/useAuth"
import { Link } from "react-router-dom"

export const Header: React.FC = () => {
    const { user } = useAuth()
    return (
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-solid border-[#f4e9e6] dark:border-[#3a2521] px-6 lg:px-40 py-4" >
            <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="size-8 text-primary">
                        <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V44Z" fillRule="evenodd"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">AiQA</h2>
                </Link>
                <nav className="hidden md:flex items-center gap-10">
                    <Link to="/documents" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Documents</Link>
                    <Link to="/library-chat" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Library Chat</Link>
                    <Link to="/scores" className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Scores</Link>
                </nav>
                <div className="flex items-center gap-3">
                    {user ? (
                        <Link to="/documents">
                            <button className="px-5 h-10 items-center justify-center bg-primary text-white text-sm font-bold rounded hover:shadow-lg hover:shadow-primary/20 transition-all">
                                Go to App
                            </button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/auth/signin">
                                <button className="hidden sm:flex px-5 h-10 items-center justify-center bg-[#f4e9e6] dark:bg-[#3a2521] text-[#1d0f0c] dark:text-white text-sm font-bold rounded hover:opacity-90 transition-all">
                                    Sign In
                                </button>
                            </Link>
                            <Link to="/auth/signup">
                                <button className="px-5 h-10 items-center justify-center bg-primary text-white text-sm font-bold rounded hover:shadow-lg hover:shadow-primary/20 transition-all">
                                    Get Started
                                </button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header >
    )
}