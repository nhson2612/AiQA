import { atom, selector } from 'recoil'

/**
 * Selected PDF IDs for document synthesis
 */
export const selectedPdfIdsAtom = atom<string[]>({
    key: 'selectedPdfIdsAtom',
    default: [],
})

/**
 * Whether synthesis mode is active (at least one document selected)
 */
export const isSynthesisModeAtom = selector<boolean>({
    key: 'isSynthesisModeAtom',
    get: ({ get }) => {
        const selectedIds = get(selectedPdfIdsAtom)
        return selectedIds.length > 0
    },
})

/**
 * Current synthesis conversation ID (persisted during session)
 */
export const synthesisConversationIdAtom = atom<string | null>({
    key: 'synthesisConversationIdAtom',
    default: null,
})
