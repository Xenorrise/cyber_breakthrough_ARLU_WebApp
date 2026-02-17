import { NextRequest, NextResponse } from "next/server"

type RouteParams = {
  path?: string[]
}

type RouteContext = {
  params: RouteParams | Promise<RouteParams>
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]

function getBackendBaseUrl(): string {
  const raw =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:5133"

  return raw.replace(/\/+$/, "")
}

async function handler(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const params = await context.params
  const path = params.path?.join("/") ?? ""
  const backendBaseUrl = getBackendBaseUrl()
  const targetUrl = new URL(path, `${backendBaseUrl}/`)
  targetUrl.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  for (const name of HOP_BY_HOP_HEADERS) {
    headers.delete(name)
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const body = hasBody ? await request.arrayBuffer() : undefined

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    })

    const responseHeaders = new Headers(upstreamResponse.headers)
    for (const name of HOP_BY_HOP_HEADERS) {
      responseHeaders.delete(name)
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return NextResponse.json(
      {
        code: "backend_unreachable",
        message: `Failed to reach backend at ${backendBaseUrl}`,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
export const HEAD = handler
