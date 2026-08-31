"use client"

import { useCallback, useState } from "react"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { Sidebar } from "@/components/chat/sidebar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useChatMessages } from "@/hooks/use-chat"

export function ChatClient() {
  const {
    messages,
    streaming,
    streamingContent,
    loadingHistory,
    toolsEnabled,
    setToolsEnabled,
    currentTool,
    sendMessage,
    stopStreaming,
  } = useChatMessages()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content)
    },
    [sendMessage],
  )

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex md:w-72 lg:w-80 flex-col border-r ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <Sidebar />
      </aside>

      {/* Overlay sidebar on mobile */}
      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-2 border-b px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </Button>
          <h1 className="text-sm font-medium">AI Chat</h1>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>⚙ 工具</span>
            <Switch checked={toolsEnabled} onCheckedChange={setToolsEnabled} />
          </div>
        </header>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          streamingContent={streamingContent}
          streaming={streaming}
          loading={loadingHistory}
          currentTool={currentTool}
        />

        {/* Input area */}
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            {streaming ? (
              <Button
                variant="destructive"
                className="w-full"
                onClick={stopStreaming}
              >
                Stop Generating
              </Button>
            ) : (
              <ChatInput onSend={handleSend} disabled={streaming} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
