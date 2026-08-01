"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { conversations } from "@/lib/api-client"
import { streamChat } from "@/lib/chat-stream"
import type { ChatMessage, MessageResponse } from "@/lib/types"

export function useChatMessages() {
  const params = useParams()
  const router = useRouter()
  const convId = params?.id as string | undefined

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  // Start loading when mounted on a conversation page so the empty state
  // ("Start a conversation") never flashes before history arrives.
  const [loadingHistory, setLoadingHistory] = useState(() => Boolean(convId))
  const abortRef = useRef<(() => void) | null>(null)

  // Load history when conversation changes. Keep the previous messages
  // visible while fetching — the UI overlays a loading spinner instead of
  // flashing an empty state.
  useEffect(() => {
    if (!convId) {
      setMessages([])
      setLoadingHistory(false)
      return
    }

    let cancelled = false
    setLoadingHistory(true)

    conversations
      .getMessages(convId)
      .then((res) => {
        if (cancelled) return
        setMessages(
          res.messages.map((m: MessageResponse) => ({
            role: m.role as ChatMessage["role"],
            content: m.content,
          })),
        )
      })
      .catch(() => {
        // conversation might not exist
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [convId])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = { role: "user", content }
      const updatedMessages = [...messages, userMsg]
      setMessages(updatedMessages)

      setStreaming(true)
      setStreamingContent("")

      const body = {
        model: process.env.NEXT_PUBLIC_MODEL || "llama3.1:8b",
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        conversation_id: convId || null,
        rag_enabled: true,
      }

      let fullContent = ""

      const abort = streamChat(body, {
        onDelta: (text) => {
          fullContent += text
          setStreamingContent(fullContent)
        },
        onFinish: (_reason, conversationId) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullContent },
          ])
          setStreamingContent("")
          setStreaming(false)

          // First message sent from /chat auto-created a conversation on the
          // backend. Navigate to it and refresh the sidebar list.
          if (!convId && conversationId) {
            router.replace(`/chat/${conversationId}`)
            window.dispatchEvent(new Event("conversations:refresh"))
          }
        },
        onError: (err) => {
          console.error("Stream error:", err)
          setStreamingContent("")
          setStreaming(false)
        },
      })

      abortRef.current = abort
    },
    [messages, convId],
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.()
    abortRef.current = null
    setStreaming(false)
    setStreamingContent("")
  }, [])

  return {
    messages,
    streaming,
    streamingContent,
    loadingHistory,
    sendMessage,
    stopStreaming,
  }
}
