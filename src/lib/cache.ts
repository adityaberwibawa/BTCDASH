type CacheEntry = { data: unknown; expires: number }

const store = new Map<string, CacheEntry>()

export async function cachedFetch<T>(key: string, url: string, init?: RequestInit, ttl = 60): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expires > now) return hit.data as T

  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  store.set(key, { data, expires: now + ttl * 1000 })
  return data as T
}

export async function cachedCall<T>(key: string, fn: () => Promise<T>, ttl = 60): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expires > now) return hit.data as T

  const data = await fn()
  store.set(key, { data, expires: now + ttl * 1000 })
  return data
}