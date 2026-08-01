"use client"

import { useCallback, useEffect, useState } from "react"

import { conversations } from "@/lib/api-client"
import type { Conversation } from "@/lib/types"

export function useConversations() {
  const [items, setItems] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchList = useCallback(async () => {
    try {
      const res = await conversations.list()
      setItems(res.conversations)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Refetch when a conversation is auto-created elsewhere (e.g. the first
  // message sent from /chat). Dispatched by use-chat.ts.
  useEffect(() => {
    const onRefresh = () => fetchList()
    window.addEventListener("conversations:refresh", onRefresh)
    return () => window.removeEventListener("conversations:refresh", onRefresh)
  }, [fetchList])

  const create = useCallback(async (title?: string) => {
    const conv = await conversations.create(title)
    setItems((prev) => [conv, ...prev])
    return conv
  }, [])

  const remove = useCallback(
    async (id: string) => {
      await conversations.delete(id)
      setItems((prev) => prev.filter((c) => c.id !== id))
    },
    [],
  )

  const rename = useCallback(async (id: string, title: string) => {
    const updated = await conversations.update(id, title)
    setItems((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }, [])

  return { items, loading, create, remove, rename, refresh: fetchList }
}
