import { ProxiedFetchRequest } from "./sw-passthrough-api"

export function stringifiableRequestInit(
  obj: object
): Exclude<RequestInit & { url: string }, "headers"> {
  const filtered: RequestInit = {}
  for (const k in obj) {
    const key = k as keyof typeof obj
    if (
      ["boolean", "number", "string"].includes(typeof obj[key]) ||
      obj[key] === null
    )
      filtered[key] = obj[key]
  }
  return filtered as RequestInit & { url: string }
}

export function responseToResponseInit(res: Response): ResponseInit {
  return {
    headers: Object.fromEntries(res.headers),
    status: res.status,
    statusText: res.statusText,
  }
}

export function proxiedRequestToFetchEvent(data: ProxiedFetchRequest) {
  const request = requestFromObject(data.request)
  return new FetchEvent("fetch", {
    request,
    clientId: data.clientId,
    resultingClientId: data.resultingClientId,
  })
}

export type ClonableRequest = Awaited<ReturnType<typeof requestAsObject>>

export async function requestAsObject(request: Request) {
  const arrayBuffer = await request.arrayBuffer()
  const { url, ...rest } = stringifiableRequestInit(request)
  return {
    url,
    rest: rest,
    headers: Object.fromEntries(request.headers),
    // signal can be omitted because abortSignals aren't functional in service
    // workers anyway
    //
    // see /references.md#1-abortsignal-in-service-worker-nonfunctional
    arrBuf: arrayBuffer,
  }
}

export function requestFromObject(request: ClonableRequest) {
  const out = new Request(request.url, {
    headers: request.headers,
    ...request.rest,
    body: request.arrBuf,
  })
  return out
}
