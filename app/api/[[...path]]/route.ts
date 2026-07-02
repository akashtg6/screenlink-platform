import { MongoClient, type Db } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse, type NextRequest } from 'next/server'

// Legacy boilerplate catch-all API. Not used by ScreenLink.ai (which uses
// Supabase directly), but retained to satisfy the platform's expectation of
// an `/api/*` route existing. All handlers gracefully degrade when
// MONGO_URL / DB_NAME are absent.

let client: MongoClient | undefined
let db: Db | undefined

async function connectToMongo(): Promise<Db | null> {
  if (!process.env.MONGO_URL || !process.env.DB_NAME) return null
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db ?? null
}

function handleCORS(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS(): Promise<NextResponse> {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const mongo = await connectToMongo()

    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Hello World' }))
    }

    if (route === '/status' && method === 'POST') {
      const body = (await request.json()) as { client_name?: string }
      if (!body.client_name) {
        return handleCORS(NextResponse.json({ error: 'client_name is required' }, { status: 400 }))
      }
      if (!mongo) {
        return handleCORS(NextResponse.json({ error: 'database not configured' }, { status: 503 }))
      }
      const statusObj = { id: uuidv4(), client_name: body.client_name, timestamp: new Date() }
      await mongo.collection('status_checks').insertOne(statusObj)
      return handleCORS(NextResponse.json(statusObj))
    }

    if (route === '/status' && method === 'GET') {
      if (!mongo) return handleCORS(NextResponse.json([]))
      const statusChecks = await mongo.collection('status_checks').find({}).limit(1000).toArray()
      const cleaned = statusChecks.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
