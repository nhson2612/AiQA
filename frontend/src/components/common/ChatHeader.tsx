import { Link } from "react-router-dom"

interface ChatHeaderProps {
    documentName: string
    viewMode: 'chat' | 'mindmap'
    onViewModeChange: (mode: 'chat' | 'mindmap') => void
    onDownload: () => void
    isDownloading: boolean
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    documentName,
    viewMode,
    onViewModeChange,
    onDownload,
    isDownloading
}) => {
    return (
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a0d0a] px-6 py-3 h-16 sticky top-0 z-50">
            <div className="flex items-center gap-6">
                <Link
                    to="/documents"
                    className="flex items-center gap-2 text-sm font-medium text-[#a15645] hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </Link>
                <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest text-[#a15645] font-bold">Document</span>
                    <h1 className="text-sm font-bold truncate max-w-[200px]">{documentName}</h1>
                </div>
            </div>

            {/* Central Segmented Toggle */}
            <div className="flex h-10 w-64 items-center justify-center rounded bg-gray-100 dark:bg-[#2d1a16] p-1">
                <label className={`flex cursor-pointer h-full grow items-center justify-center rounded px-2 transition-all ${viewMode === 'chat'
                        ? 'bg-white dark:bg-[#1d0f0c] shadow-sm text-primary'
                        : 'text-[#a15645] hover:text-primary'
                    }`}>
                    <span className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                        <span className="text-sm font-bold leading-normal">Chat</span>
                    </span>
                    <input
                        type="radio"
                        name="view-mode"
                        value="chat"
                        checked={viewMode === 'chat'}
                        onChange={() => onViewModeChange('chat')}
                        className="invisible w-0"
                    />
                </label>
                <label className={`flex cursor-pointer h-full grow items-center justify-center rounded px-2 transition-all ${viewMode === 'mindmap'
                        ? 'bg-white dark:bg-[#1d0f0c] shadow-sm text-primary'
                        : 'text-[#a15645] hover:text-primary'
                    }`}>
                    <span className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[18px]">account_tree</span>
                        <span className="text-sm font-bold leading-normal">Mind Map</span>
                    </span>
                    <input
                        type="radio"
                        name="view-mode"
                        value="mindmap"
                        checked={viewMode === 'mindmap'}
                        onChange={() => onViewModeChange('mindmap')}
                        className="invisible w-0"
                    />
                </label>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center justify-center gap-2 rounded border border-gray-200 dark:border-gray-800 h-10 px-4 text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined">share</span>
                    Share
                </button>
                <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 rounded bg-primary text-white h-10 px-4 text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    <span className="material-symbols-outlined">download</span>
                    {isDownloading ? 'Downloading...' : 'Download'}
                </button>
            </div>
        </header>
    )
}