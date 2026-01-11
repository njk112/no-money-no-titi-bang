export interface Item {
  id: number
  name: string
  icon_url: string | null
  buy_limit: number | null
  members: boolean
  high_alch: number | null
  low_alch: number | null
  high_price: number | null
  low_price: number | null
  high_time: string | null
  low_time: string | null
  profit_margin: number | null
  max_profit: number | null
  ge_tracker_url?: string
}

export interface ItemsParams {
  page?: number
  search?: string
  min_price?: number
  max_price?: number
  min_margin?: number
  max_margin?: number
  min_buy_limit?: number
  members?: boolean
  sort?: 'profit' | 'margin' | 'price' | 'name' | 'buy_limit'
  order?: 'asc' | 'desc'
}

export interface ItemsResponse {
  data: Item[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface SuggestionItem extends Item {
  suggested_quantity: number
  estimated_profit: number
}

export interface SuggestionsResponse {
  data: SuggestionItem[]
}
