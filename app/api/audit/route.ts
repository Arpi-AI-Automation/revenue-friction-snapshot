import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This route will be fully implemented in the auditor build phase.
// Stub is present so the UI form has a valid endpoint to POST to.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'A valid domain is required.' },
        { status: 400 }
      )
    }

    // TODO: Wire validateDomain, rateLimit, auditor, KV storage
    // For now, return a placeholder slug
    return NextResponse.json(
      { error: 'Audit engine not yet implemented.' },
      { status: 501 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    )
  }
}
