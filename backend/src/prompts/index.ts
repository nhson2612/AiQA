// Chat prompts
export {
    CHAT_SYSTEM_PROMPT,
    CHAT_TITLE_PROMPT,
    CHAT_SUGGESTIONS_PROMPT,
    buildUserMessageWithContext,
} from './chat.prompts'

// Library chat prompts
export { LIBRARY_SYSTEM_PROMPT, buildLibraryUserMessage } from './library.prompts'

// Mind map prompts
export { MINDMAP_SYSTEM_PROMPT, buildMindMapUserMessage } from './mindmap.prompts'

// Types
export type { PromptTemplate, ChatContext, LibraryContext, MindMapContext } from './types'
