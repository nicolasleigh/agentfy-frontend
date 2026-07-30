const isBrowser = typeof window !== "undefined"

export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (!isBrowser) return null
    return localStorage.getItem(key)
  },

  setItem(key: string, value: string) {
    if (!isBrowser) return
    localStorage.setItem(key, value)
  },

  removeItem(key: string) {
    if (!isBrowser) return
    localStorage.removeItem(key)
  },
}
