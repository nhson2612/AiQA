import React from 'react'
import { useRecoilState } from 'recoil'
import { useNavigate } from 'react-router-dom'
import { selectedPdfIdsAtom } from '@/atoms/synthesisAtom'

export const SynthesisActionBar: React.FC = () => {
    const [selectedPdfIds, setSelectedPdfIds] = useRecoilState(selectedPdfIdsAtom)
    const navigate = useNavigate()

    if (selectedPdfIds.length === 0) {
        return null
    }

    const handleClearSelection = () => {
        setSelectedPdfIds([])
    }

    const handleSynthesize = () => {
        // Navigate to synthesis page with selected IDs as query param
        const idsParam = selectedPdfIds.join(',')
        navigate(`/synthesis?ids=${encodeURIComponent(idsParam)}`)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary text-white text-sm font-bold">
                                {selectedPdfIds.length}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                                {selectedPdfIds.length === 1 ? 'tài liệu' : 'tài liệu'} đã chọn
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClearSelection}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Bỏ chọn
                        </button>
                        <button
                            onClick={handleSynthesize}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">auto_awesome</span>
                            Phân tích & So sánh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
