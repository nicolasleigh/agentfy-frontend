"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { DocumentsSection } from "@/components/chat/documents-section"
import { useConversations } from "@/hooks/use-conversations"
import type { Conversation, UserPublic } from "@/lib/types"
import { auth } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface SidebarProps {
  onClose?: () => void
}

// Cache across remounts so the user name doesn't flash in on every
// navigation (Next.js remounts the page tree between dynamic segments).
let cachedUser: UserPublic | null = null

export function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const { items, loading, create, remove, rename } = useConversations()
  const { logout } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [user, setUser] = useState<UserPublic | null>(() => cachedUser)
  // JS-driven press state for the row (CSS :active would also fire when
  // pressing the inner "..." button — the thing we're trying to avoid).
  const [pressedId, setPressedId] = useState<string | null>(null)

  useEffect(() => {
    const u = auth.getUser()
    cachedUser = u
    setUser(u)
  }, [])

  const currentId = params?.id as string | undefined

  async function handleNew() {
    const conv = await create()
    router.push(`/chat/${conv.id}`)
    onClose?.()
  }

  async function handleRename(id: string) {
    if (editTitle.trim()) {
      await rename(id, editTitle.trim())
    }
    setEditingId(null)
  }

  function startEdit(conv: Conversation) {
    setEditingId(conv.id)
    setEditTitle(conv.title)
  }

  async function handleDelete(id: string) {
    await remove(id)
    if (currentId === id) {
      router.push("/chat")
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">Conversations</h2>
        <Button variant="outline" size="sm" onClick={handleNew}>
          + New
        </Button>
      </div>

      {/* Documents */}
      <DocumentsSection />

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {items.map((conv) => (
              <div key={conv.id} className="flex items-center gap-1">
                {editingId === conv.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleRename(conv.id)
                    }}
                    onBlur={() => handleRename(conv.id)}
                    className="flex-1"
                  >
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </form>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      router.push(`/chat/${conv.id}`)
                      onClose?.()
                    }}
                    onKeyDown={(e) => {
                      // ignore keydowns bubbled from the nested "..." button
                      if (e.target !== e.currentTarget) return
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        router.push(`/chat/${conv.id}`)
                        onClose?.()
                      }
                    }}
                    onPointerDown={() => setPressedId(conv.id)}
                    onPointerUp={() => setPressedId(null)}
                    onPointerLeave={() => setPressedId(null)}
                    onPointerCancel={() => setPressedId(null)}
                    className={cn(
                      "flex h-9 flex-1 cursor-pointer select-none items-center gap-1.5 rounded-lg px-3 text-sm font-normal outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/50",
                      currentId === conv.id
                        ? "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
                        : "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
                      pressedId === conv.id && "translate-y-px",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-left">
                      {conv.title}
                    </span>

                    {/* stopPropagation on click/pointerdown: pressing "..." must
                        neither navigate nor trigger the row's press state. */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            aria-label="Conversation actions"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(conv)}>
                          <PencilIcon className="size-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(conv.id)}
                        >
                          <TrashIcon className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* User footer */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm text-muted-foreground">
            {user?.name || user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
