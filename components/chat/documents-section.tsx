"use client"

import { useRef, useState } from "react"
import {
  FileTextIcon,
  LoaderCircleIcon,
  TrashIcon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ApiError } from "@/lib/api-client"
import { useDocuments } from "@/hooks/use-documents"

// Extensions the backend can ingest (PDF + text types). `accept` is only a
// picker filter — the backend 400 is the real gate for anything else.
const ACCEPT = ".pdf,.txt,.md,.csv,.json,.xml"

export function DocumentsSection() {
  const { items, loading, upload, remove } = useDocuments()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    setError(null)
    setUploading(true)
    try {
      // Sequential: the backend embeds synchronously per upload, so fanning
      // out N concurrent embedding jobs on a multi-select is wasteful.
      for (const file of files) {
        try {
          await upload(file)
        } catch (err) {
          setError(
            err instanceof ApiError
              ? err.message // surfaces backend detail, e.g. "Unsupported content type ..."
              : `Failed to upload ${file.name}`,
          )
          break // fail-fast; files already uploaded in this batch stay
        }
      }
    } finally {
      setUploading(false)
      // Reset the input so re-picking the *same* file fires `change` again.
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove(id)
    } catch {
      setError("Failed to delete document")
    }
  }

  return (
    <div className="border-b px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Documents</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={uploading}
          aria-label="Upload documents"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
        </Button>
      </div>

      {/* Plain native input, not the styled Input wrapper — a hidden file
          picker doesn't need Base UI form-control styling. `hidden` (not
          `sr-only`) so Tab never lands on the invisible input. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
        }}
      />

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {loading ? (
        <p className="py-1 text-xs text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="py-1 text-xs text-muted-foreground">
          No documents yet. Upload PDF, TXT, MD, CSV, JSON, or XML.
        </p>
      ) : (
        <ScrollArea className="max-h-52">
          <ul className="space-y-0.5 pr-1">
            {items.map((doc) => (
              <li key={doc.id} className="flex items-center gap-1.5">
                <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                <span
                  title={doc.filename}
                  className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                >
                  {doc.filename}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Delete ${doc.filename}`}
                  onClick={() => handleDelete(doc.id)}
                >
                  <TrashIcon className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  )
}
