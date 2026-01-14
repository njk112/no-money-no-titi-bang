const API_URL = process.env.API_URL || 'http://localhost:3333'

export class ServerApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ServerApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  cookies?: string
}

async function serverRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, cookies } = options
  const url = `${API_URL}${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (cookies) {
    headers['Cookie'] = cookies
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new ServerApiError(response.status, error.message || 'Request failed')
  }

  return response.json() as Promise<T>
}

export const serverApi = {
  get: <T>(endpoint: string, cookies?: string) =>
    serverRequest<T>(endpoint, { method: 'GET', cookies }),

  post: <T>(endpoint: string, body: unknown, cookies?: string) =>
    serverRequest<T>(endpoint, { method: 'POST', body, cookies }),

  put: <T>(endpoint: string, body: unknown, cookies?: string) =>
    serverRequest<T>(endpoint, { method: 'PUT', body, cookies }),

  delete: <T>(endpoint: string, cookies?: string) =>
    serverRequest<T>(endpoint, { method: 'DELETE', cookies }),
}
