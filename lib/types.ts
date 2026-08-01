// ─── Auth ───────────────────────────────────────────────
export interface UserPublic {
  id: string
  email: string
  name: string | null
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserPublic
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

// ─── Chat ───────────────────────────────────────────────
export type ChatRole = "system" | "user" | "assistant" | "tool"

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatCompletionRequest {
  model?: string
  messages: ChatMessage[]
  temperature?: number | null
  stream?: boolean
  conversation_id?: string | null
  rag_enabled?: boolean
}

export interface ChatCompletionChoice {
  index: number
  message: ChatMessage
  finish_reason: string
}

export interface ChatCompletionUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatCompletionResponse {
  id: string
  object: "chat.completion"
  created: number
  model: string
  choices: ChatCompletionChoice[]
  usage: ChatCompletionUsage
}

// ─── Stream chunk ───────────────────────────────────────
export interface StreamDelta {
  choices: {
    index: number
    delta: { content?: string }
    finish_reason: string | null
  }[]
  /** Set on the leading meta chunk when a conversation was auto-created. */
  conversation_id?: string
}

// ─── Conversation ───────────────────────────────────────
export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationListResponse {
  conversations: Conversation[]
  total: number
}

export interface ConversationMessagesResponse {
  messages: MessageResponse[]
  total: number
}

export interface MessageResponse {
  id: string
  role: ChatRole
  content: string
  created_at: string
}

// ─── Document ───────────────────────────────────────────
export interface Document {
  id: string
  filename: string
  content_type: string
  created_at: string
}

export interface DocumentListResponse {
  documents: Document[]
  total: number
}
