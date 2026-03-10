const BASE_URL = 'https://api.deezer.com'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const rawPath = Array.isArray(request.query.path) ? request.query.path.join('/') : request.query.path

  if (!rawPath) {
    response.status(400).json({ error: 'Missing Deezer endpoint path.' })
    return
  }

  const upstreamParams = new URLSearchParams()

  Object.entries(request.query).forEach(([key, value]) => {
    if (key === 'path' || value == null) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => upstreamParams.append(key, item))
      return
    }

    upstreamParams.set(key, value)
  })

  if (!upstreamParams.has('output')) {
    upstreamParams.set('output', 'json')
  }

  const upstreamUrl = `${BASE_URL}/${rawPath}?${upstreamParams.toString()}`
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
