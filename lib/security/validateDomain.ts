import { promises as dns } from 'dns'

// ─── Private IP ranges to block (SSRF protection) ────────────────────────────

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',
])

function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
    /^192\.0\.0\./,
    /^198\.1[89]\./,
    /^203\.0\.113\./,
  ]
  if (privateRanges.some(r => r.test(ip))) return true
  if (ip === '::1') return true
  if (ip.toLowerCase().startsWith('fe80:')) return true
  if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true
  return false
}

export interface ValidatedDomain {
  hostname: string
}

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainValidationError'
  }
}

export async function validateDomain(raw: string): Promise<ValidatedDomain> {
  let hostname = raw.trim().toLowerCase()
  hostname = hostname.replace(/^https?:\/\//i, '')
  hostname = hostname.split('/')[0]
  hostname = hostname.split('?')[0]
  hostname = hostname.split('#')[0]
  hostname = hostname.replace(/:\d+$/, '')

  if (!hostname)              throw new DomainValidationError('Domain is required.')
  if (hostname.length > 253)  throw new DomainValidationError('Domain is too long.')
  if (!/^[a-z0-9.-]+$/.test(hostname)) throw new DomainValidationError('Domain contains invalid characters.')
  if (!hostname.includes('.')) throw new DomainValidationError('Enter a valid domain, e.g. brand.com')
  if (hostname.startsWith('.') || hostname.endsWith('.')) throw new DomainValidationError('Invalid domain format.')
  if (BLOCKED_HOSTNAMES.has(hostname)) throw new DomainValidationError('That domain is not allowed.')

  let addresses: string[]
  try {
    const result = await dns.lookup(hostname, { all: true })
    addresses = result.map(r => r.address)
  } catch {
    throw new DomainValidationError(`Could not resolve domain: ${hostname}`)
  }

  if (addresses.length === 0) throw new DomainValidationError(`Could not resolve domain: ${hostname}`)

  for (const ip of addresses) {
    if (isPrivateIP(ip)) throw new DomainValidationError('That domain resolves to a private address.')
  }

  return { hostname }
}
