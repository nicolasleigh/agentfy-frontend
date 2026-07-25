"use client"

import { type FormEvent, useRef, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textRef.current?.focus()
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = textRef.current?.value.trim()
    if (!text) return
    onSend(text)
    if (textRef.current) textRef.current.value = ""
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        ref={textRef}
        placeholder={placeholder || "Send a message..."}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="min-h-[44px] flex-1 resize-none"
        rows={1}
      />
      <Button type="submit" disabled={disabled || !textRef.current?.value?.trim()}>
        Send
      </Button>
    </form>
  )
}
