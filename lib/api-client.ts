import { safeLocalStorage } from "./browser"
import type {
  TokenResponse,
  UserPublic,
  ChatCompletionRequest,
  ChatCompletionResponse,
  Conversation,
  ConversationListResponse,
  ConversationMessagesResponse,
  Document,
  DocumentListResponse,
} from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  return safeLocalStorage.getItem("access_token")
}

function clearToken() {
  safeLocalStorage.removeItem("access_token")
  safeLocalStorage.removeItem("user")
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Don't set Content-Type for FormData (let browser set it)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new ApiError(401, "Unauthorized")
  }

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(
      res.status,
      body.detail || `Request failed with status ${res.status}`,
    )
  }

  return res.json()
}

// ─── Auth ───────────────────────────────────────────────
export const auth = {
  register: (data: { email: string; password: string; name?: string }) =>
    // console.log('==========='),
    request<TokenResponse>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<UserPublic>("/v1/auth/me"),

  saveToken(token: string, user: UserPublic) {
    safeLocalStorage.setItem("access_token", token)
    safeLocalStorage.setItem("user", JSON.stringify(user))
  },

  getToken,
  clearToken,

  getUser(): UserPublic | null {
    const raw = safeLocalStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  },

  isLoggedIn(): boolean {
    return !!getToken()
  },
}

// ─── Chat ───────────────────────────────────────────────
export const chat = {
  completions: (data: ChatCompletionRequest) =>
    request<ChatCompletionResponse>("/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({ ...data, stream: false }),
    }),
}

// ─── Conversations ──────────────────────────────────────
export const conversations = {
  list: () =>
    request<ConversationListResponse>("/v1/conversations"),

  get: (id: string) =>
    request<Conversation>(`/v1/conversations/${id}`),

  create: (title?: string) =>
    request<Conversation>("/v1/conversations", {
      method: "POST",
      body: JSON.stringify({ title: title || "New Chat" }),
    }),

  update: (id: string, title: string) =>
    request<Conversation>(`/v1/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  delete: (id: string) =>
    request<void>(`/v1/conversations/${id}`, { method: "DELETE" }),

  getMessages: (id: string) =>
    request<ConversationMessagesResponse>(
      `/v1/conversations/${id}/messages`,
    ),
}

// ─── Documents ──────────────────────────────────────────
export const documents = {
  upload: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return request<Document>("/v1/documents", {
      method: "POST",
      body: form,
    })
  },

  list: () => request<DocumentListResponse>("/v1/documents"),

  get: (id: string) =>
    request<Document>(`/v1/documents/${id}`),

  delete: (id: string) =>
    request<void>(`/v1/documents/${id}`, { method: "DELETE" }),
}
