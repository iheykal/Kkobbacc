export function getR2Endpoint(): string {
  let endpoint = process.env.R2_ENDPOINT || ''

  // Trim and normalize
  endpoint = endpoint.trim()

  // Handle cases like `R2_ENDPOINT=https://...`
  if (endpoint.includes('R2_ENDPOINT=')) {
    endpoint = endpoint.split('R2_ENDPOINT=')[1]
  } else if (endpoint.includes('r2_endpoint=')) {
    endpoint = endpoint.split('r2_endpoint=')[1]
  }

  // If it contains protocol, keep as-is; otherwise, prefix https://
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    endpoint = `https://${endpoint}`
  }

  return endpoint
}
