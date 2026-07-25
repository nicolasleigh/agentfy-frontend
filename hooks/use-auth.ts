"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { auth } from "@/lib/api-client"
import type { UserPublic } from "@/lib/types"

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (auth.isLoggedIn()) {
      const stored = auth.getUser()
      if (stored) {
        setUser(stored)
        // verify token is still valid
        auth.me().then(setUser).catch(() => {
          auth.clearToken()
          setUser(null)
          router.push("/login")
        })
      }
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await auth.login({ email, password })
      auth.saveToken(res.access_token, res.user)
      setUser(res.user)
      router.push("/chat")
    },
    [router],
  )

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await auth.register({ email, password, name })
      console.log('res===', res)
      auth.saveToken(res.access_token, res.user)
      setUser(res.user)
      router.push("/chat")
    },
    [router],
  )

  const logout = useCallback(() => {
    auth.clearToken()
    setUser(null)
    router.push("/login")
  }, [router])

  return { user, loading, login, register, logout }
}
