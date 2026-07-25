"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { ChatClient } from "@/components/chat/chat-client"
import { auth } from "@/lib/api-client"

export default function NewChatPage() {
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push("/login")
    }
  }, [router])

  return <ChatClient />
}
