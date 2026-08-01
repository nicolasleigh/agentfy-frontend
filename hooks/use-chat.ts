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
  const abortRef = useRef<(() => void) | null>(null)
  const convIdRef = useRef<string | undefined>(convId)

  // Load history when conversation changes
  useEffect(() => {
    convIdRef.current = convId

    if (!convId) {
      setMessages([])
      return
    }

    conversations
      .getMessages(convId)
      .then((res) => {
        // only apply if we're still on this conversation
        if (convIdRef.current === convId) {
          setMessages(
            res.messages.map((m: MessageResponse) => ({
              role: m.role as ChatMessage["role"],
              content: m.content,
            })),
          )
        }
      })
      .catch(() => {
        // conversation might not exist
      })
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
    sendMessage,
    stopStreaming,
  }
}
