// The ONLY function in the codebase allowed to make outbound HTTP calls.
// All auditor modules must use this — never call fetch() directly.

const DEFAULT_TIMEOUT_MS = 8_000
const USER_AGENT = 'Mozilla/5.0 (compatible; ARPI-Snapshot/1.0; +https://snapshot.arpiai.com)'

export interface SafeFetchOptions {
  timeoutMs?: number
  headers?: Record<string, string>
}

export class SafeFetchError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'SafeFetchError'
  }
}

export async function safeFetch(
  url: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers = {} } = options

  // Only allow http/https
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SafeFetchError(`Disallowed protocol: ${parsed.protocol}`)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...headers,
      },
      redirect: 'follow',
    })
    return response
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new SafeFetchError(`Request timed out after ${timeoutMs}ms: ${url}`)
    }
    throw new SafeFetchError(`Fetch failed: ${url}`, err)
  } finally {
    clearTimeout(timer)
  }
}

export async function safeFetchText(
  url: string,
  options: SafeFetchOptions = {}
): Promise<string> {
  const res = await safeFetch(url, options)
  return res.text()
}

export async function safeFetchJson<T = unknown>(
  url: string,
  options: SafeFetchOptions = {}
): Promise<T> {
  const res = await safeFetch(url, options)
  return res.json() as Promise<T>
}
