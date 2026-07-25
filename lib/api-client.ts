const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

function clearToken() {
  if (typeof window === "undefined") return
  localStorage.removeItem("access_token")
  localStorage.removeItem("user")
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
    request<import("./types").TokenResponse>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<import("./types").TokenResponse>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<import("./types").UserPublic>("/v1/auth/me"),

  saveToken(token: string, user: import("./types").UserPublic) {
    localStorage.setItem("access_token", token)
    localStorage.setItem("user", JSON.stringify(user))
  },

  getToken,
  clearToken,

  getUser(): import("./types").UserPublic | null {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  },

  isLoggedIn(): boolean {
    return !!getToken()
  },
}

// ─── Chat ───────────────────────────────────────────────
export const chat = {
  completions: (data: import("./types").ChatCompletionRequest) =>
    request<import("./types").ChatCompletionResponse>("/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({ ...data, stream: false }),
    }),
}

// ─── Conversations ──────────────────────────────────────
export const conversations = {
  list: () =>
    request<import("./types").ConversationListResponse>("/v1/conversations"),

  get: (id: string) =>
    request<import("./types").Conversation>(`/v1/conversations/${id}`),

  create: (title?: string) =>
    request<import("./types").Conversation>("/v1/conversations", {
      method: "POST",
      body: JSON.stringify({ title: title || "New Chat" }),
    }),

  update: (id: string, title: string) =>
    request<import("./types").Conversation>(`/v1/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  delete: (id: string) =>
    request<void>(`/v1/conversations/${id}`, { method: "DELETE" }),

  getMessages: (id: string) =>
    request<import("./types").ConversationMessagesResponse>(
      `/v1/conversations/${id}/messages`,
    ),
}

// ─── Documents ──────────────────────────────────────────
export const documents = {
  upload: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return request<import("./types").Document>("/v1/documents", {
      method: "POST",
      body: form,
    })
  },

  list: () =>
    request<import("./types").DocumentListResponse>("/v1/documents"),

  get: (id: string) =>
    request<import("./types").Document>(`/v1/documents/${id}`),

  delete: (id: string) =>
    request<void>(`/v1/documents/${id}`, { method: "DELETE" }),
}
