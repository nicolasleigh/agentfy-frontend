"use client"

import { useCallback, useEffect, useState } from "react"

import { conversations } from "@/lib/api-client"
import type { Conversation } from "@/lib/types"

// Cache the list across component remounts. Next.js remounts the page tree
// when navigating between dynamic segments (e.g. /chat/A -> /chat/B), which
// would otherwise flash "Loading..." in the sidebar on every switch.
let cachedItems: Conversation[] | null = null

export function useConversations() {
  const [items, setItems] = useState<Conversation[]>(() => cachedItems ?? [])
  // Only show the loading placeholder on a genuine first load — subsequent
  // mounts already have cached items to render immediately.
  const [loading, setLoading] = useState(() => cachedItems === null)

  const fetchList = useCallback(async () => {
    try {
      const res = await conversations.list()
      cachedItems = res.conversations
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
    setItems((prev) => {
      const next = [conv, ...prev]
      cachedItems = next
      return next
    })
    return conv
  }, [])

  const remove = useCallback(async (id: string) => {
    await conversations.delete(id)
    setItems((prev) => {
      const next = prev.filter((c) => c.id !== id)
      cachedItems = next
      return next
    })
  }, [])

  const rename = useCallback(async (id: string, title: string) => {
    const updated = await conversations.update(id, title)
    setItems((prev) => {
      const next = prev.map((c) => (c.id === id ? updated : c))
      cachedItems = next
      return next
    })
    return updated
  }, [])

  return { items, loading, create, remove, rename, refresh: fetchList }
}
