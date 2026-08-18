import { cachedFetch } from './cache'

const ALTERNATIVE_ME = 'https://api.alternative.me/fng'

export async function getFearGreed(limit = 30) {
  const data = await cachedFetch<any>(`fng_${limit}`, `${ALTERNATIVE_ME}/?limit=${limit}`, {}, 300)
  const items: any[] = []
  for (const item of data.data ?? []) {
    const ts = item.timestamp
    items.push({
      value: parseInt(item.value ?? '50', 10),
      classification: item.value_classification ?? 'Neutral',
      timestamp: ts,
      iso_time: ts ? new Date(parseInt(ts, 10) * 1000).toISOString() : null,
    })
  }
  return { current: items[0] ?? null, history: items }
}