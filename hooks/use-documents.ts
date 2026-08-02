"use client"

import { useCallback, useEffect, useState } from "react"

import { documents as documentsApi } from "@/lib/api-client"
import type { Document } from "@/lib/types"

// Cache across component remounts. Next.js remounts the page tree when
// navigating between dynamic segments (e.g. /chat/A -> /chat/B), which
// would otherwise flash "Loading..." in the sidebar on every switch.
let cachedItems: Document[] | null = null

export function useDocuments() {
  const [items, setItems] = useState<Document[]>(() => cachedItems ?? [])
  // Only show the loading placeholder on a genuine first load — subsequent
  // mounts already have cached items to render immediately.
  const [loading, setLoading] = useState(() => cachedItems === null)

  const fetchList = useCallback(async () => {
    try {
      const res = await documentsApi.list()
      cachedItems = res.documents
      setItems(res.documents)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const upload = useCallback(async (file: File) => {
    const doc = await documentsApi.upload(file)
    setItems((prev) => {
      const next = [doc, ...prev]
      cachedItems = next
      return next
    })
    return doc
  }, [])

  const remove = useCallback(async (id: string) => {
    await documentsApi.delete(id)
    setItems((prev) => {
      const next = prev.filter((d) => d.id !== id)
      cachedItems = next
      return next
    })
  }, [])

  return { items, loading, upload, remove, refresh: fetchList }
}
