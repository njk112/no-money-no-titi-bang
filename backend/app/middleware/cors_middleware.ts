import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const allowedOrigins = ['http://localhost:3000']
    const origin = ctx.request.header('origin')

    if (origin && allowedOrigins.includes(origin)) {
      ctx.response.header('Access-Control-Allow-Origin', origin)
    }

    ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    ctx.response.header('Access-Control-Allow-Credentials', 'true')

    // Handle preflight requests
    if (ctx.request.method() === 'OPTIONS') {
      ctx.response.status(204)
      return
    }

    return next()
  }
}
