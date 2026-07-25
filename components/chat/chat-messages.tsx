"use client"

import { useEffect, useRef } from "react"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage } from "@/lib/types"

interface ChatMessagesProps {
  messages: ChatMessage[]
  streamingContent?: string
  streaming?: boolean
}

function MarkdownContent({ content }: { content: string }) {
  // Simple rendering: split by code blocks and handle basic markdown
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3)
          const firstLine = code.indexOf("\n")
          const lang = firstLine > 0 ? code.slice(0, firstLine).trim() : ""
          const codeContent = firstLine > 0 ? code.slice(firstLine + 1) : code
          return (
            <pre key={i} className="my-2 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              {lang && (
                <div className="mb-1 text-xs text-muted-foreground">{lang}</div>
              )}
              <code>{codeContent}</code>
            </pre>
          )
        }
        // Split by double newlines for paragraphs
        return part.split(/\n\n+/).map((para, j) => {
          const trimmed = para.trim()
          if (!trimmed) return null
          return (
            <p key={`${i}-${j}`} className="mb-2 last:mb-0">
              {trimmed}
            </p>
          )
        })
      })}
    </>
  )
}

export function ChatMessages({
  messages,
  streamingContent,
  streaming,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-medium">Start a conversation</h3>
          <p className="text-sm">Send a message to begin chatting with the AI.</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <MarkdownContent content={msg.content} />
            </Card>
          </div>
        ))}

        {/* Streaming message */}
        {streaming && streamingContent && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] bg-muted px-4 py-3">
              <MarkdownContent content={streamingContent} />
              <span className="inline-block h-4 w-2 animate-pulse bg-foreground/50 ml-1" />
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
