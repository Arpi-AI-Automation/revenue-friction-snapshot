import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug) {
    return NextResponse.json({ error: 'Slug required.' }, { status: 400 })
  }

  // TODO: Read from Upstash Redis when auditor is implemented
  return NextResponse.json({ error: 'Not found.' }, { status: 404 })
}
