import type { StreamDelta } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export interface StreamCallbacks {
  onDelta: (content: string) => void
  onFinish: (reason: string | null, conversationId: string | null) => void
  onError: (error: Error) => void
}

/**
 * Send a streaming chat completion request via SSE.
 * Returns an abort function to cancel the request.
 */
export function streamChat(
  body: {
    model?: string
    messages: { role: string; content: string }[]
    temperature?: number | null
    conversation_id?: string | null
    rag_enabled?: boolean
  },
  callbacks: StreamCallbacks,
): () => void {
  const token = localStorage.getItem("access_token")
  const controller = new AbortController()
  let finished = false
  let conversationId: string | null = null

  const safeOnFinish = (reason: string | null) => {
    if (finished) return
    finished = true
    callbacks.onFinish(reason, conversationId)
  }

  ;(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...body, stream: true }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: res.statusText }))
        callbacks.onError(
          new Error(errBody.detail || `HTTP ${res.status}`),
        )
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        callbacks.onError(new Error("No response body"))
        return
      }

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith("data: ")) continue

          const data = trimmed.slice(6)
          if (data === "[DONE]") {
            safeOnFinish("stop")
            return
          }

          try {
            const parsed: StreamDelta = JSON.parse(data)
            if (parsed.conversation_id) {
              conversationId = parsed.conversation_id
            }
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              callbacks.onDelta(content)
            }
            const fr = parsed.choices?.[0]?.finish_reason
            if (fr) {
              safeOnFinish(fr)
            }
          } catch {
            // skip malformed chunk
          }
        }
      }

      safeOnFinish("stop")
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      callbacks.onError(err as Error)
    }
  })()

  return () => controller.abort()
}
