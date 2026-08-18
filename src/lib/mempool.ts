import { cachedFetch } from './cache'

const MEMPOOL_BASE = 'https://mempool.space/api'

export async function getBasicStats() {
  const [hr, blocks] = await Promise.all([
    cachedFetch<any>(`mp_hashrate`, `${MEMPOOL_BASE}/v1/mining/hashrate/24h`, {}, 120),
    cachedFetch<any[]>(`mp_blocks`, `${MEMPOOL_BASE}/blocks?height=`, {}, 120),
  ])
  const currentBlock = blocks[0] ?? {}
  return {
    hashrate_24h: hr.currentHashrate ?? null,
    difficulty: hr.currentDifficulty ?? null,
    total_blocks: currentBlock.height ?? null,
    latest_block_time: currentBlock.timestamp ? new Date(currentBlock.timestamp * 1000).toISOString() : null,
    latest_block_tx: currentBlock.tx_count ?? null,
    timestamp: new Date().toISOString(),
  }
}

export async function getMempoolFees() {
  const data = await cachedFetch<any>(`mp_fees`, `${MEMPOOL_BASE}/v1/fees/recommended`, {}, 60)
  return {
    fastest_fee: data.fastestFee ?? null,
    half_hour_fee: data.halfHourFee ?? null,
    hour_fee: data.hourFee ?? null,
    economy_fee: data.economyFee ?? null,
    minimum_fee: data.minimumFee ?? null,
    timestamp: new Date().toISOString(),
  }
}

export async function getLatestBlock() {
  const blocks = await cachedFetch<any[]>(`mp_blocks`, `${MEMPOOL_BASE}/blocks?height=`, {}, 120)
  const b = blocks[0]
  if (!b) return null
  return {
    height: b.height ?? null,
    timestamp: b.timestamp ? new Date(b.timestamp * 1000).toISOString() : null,
    size: b.size ?? null,
    weight: b.weight ?? null,
    tx_count: b.tx_count ?? null,
    difficulty: b.difficulty ?? null,
  }
}