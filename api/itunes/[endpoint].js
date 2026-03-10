const ALLOWED_ENDPOINTS = new Set(['lookup', 'search'])

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const endpointParam = Array.isArray(request.query.endpoint)
    ? request.query.endpoint[0]
    : request.query.endpoint

  if (!endpointParam || !ALLOWED_ENDPOINTS.has(endpointParam)) {
    response.status(400).json({ error: 'Unsupported iTunes endpoint.' })
    return
  }

  const upstreamParams = new URLSearchParams()

  Object.entries(request.query).forEach(([key, value]) => {
    if (key === 'endpoint' || value == null) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => upstreamParams.append(key, item))
      return
    }

    upstreamParams.set(key, value)
  })

  const upstreamUrl = `https://itunes.apple.com/${endpointParam}?${upstreamParams.toString()}`
  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Accept: 'application/json',
    },
  })
  const body = await upstreamResponse.text()

  response.setHeader(
    'Content-Type',
    upstreamResponse.headers.get('content-type') ?? 'application/json; charset=utf-8',
  )
  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
  response.status(upstreamResponse.status).send(body)
}
