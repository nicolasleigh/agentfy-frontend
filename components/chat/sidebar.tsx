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
import { useConversations } from "@/hooks/use-conversations"
import type { Conversation, UserPublic } from "@/lib/types"
import { auth } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const { items, loading, create, remove, rename } = useConversations()
  const { logout } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [user, setUser] = useState<UserPublic | null>(null)

  useEffect(() => {
    setUser(auth.getUser())
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
                  <>
                    <Button
                      variant={currentId === conv.id ? "secondary" : "ghost"}
                      className="flex-1 justify-start text-sm font-normal h-9 px-3"
                      onClick={() => {
                        router.push(`/chat/${conv.id}`)
                        onClose?.()
                      }}
                    >
                      <span className="truncate">{conv.title}</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Conversation actions"
                            className="shrink-0"
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
                  </>
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
