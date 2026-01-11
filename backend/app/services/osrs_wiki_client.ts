export interface MappingItem {
  id: number
  name: string
  examine: string
  members: boolean
  lowalch: number
  highalch: number
  limit: number
  value: number
  icon: string
}

export interface LatestPricesResponse {
  data: {
    [itemId: string]: {
      high: number
      highTime: number
      low: number
      lowTime: number
    }
  }
}

const USER_AGENT = 'osrs-ge-tracker - OSRS trading dashboard'
const BASE_URL = 'https://prices.runescape.wiki/api/v1/osrs'
const TIMEOUT_MS = 30000

export default class OsrsWikiClient {
  async fetchMapping(): Promise<MappingItem[]> {
    const response = await fetch(`${BASE_URL}/mapping`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch mapping: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<MappingItem[]>
  }

  async fetchLatestPrices(): Promise<LatestPricesResponse> {
    const response = await fetch(`${BASE_URL}/latest`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch latest prices: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<LatestPricesResponse>
  }
}
