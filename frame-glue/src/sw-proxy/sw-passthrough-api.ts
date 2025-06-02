import {
  ClonableRequest,
  responseToResponseInit,
  requestAsObject,
  proxiedRequestToFetchEvent,
} from "./fetchConversions"

export type ProxiedFetchRequest = {
  request: ClonableRequest
  clientId: string
  resultingClientId: string
  symbol: string
}

export type ProxiedResponse = {
  arrBuf: ArrayBuffer
  responseInit: ResponseInit
  symbol: string
}

async function sendProxiedResponse(
  port: MessagePort,
  symbol: string,
  res: Response
) {
  port.postMessage({
    arrBuf: await res.arrayBuffer(),
    responseInit: responseToResponseInit(res),
    symbol: symbol,
  } satisfies ProxiedResponse)
}
async function receiveProxiedResponse(
  port: MessagePort,
  symbol: string
): Promise<Response> {
  const controller = new AbortController()
  return new Promise(res => {
    port.addEventListener(
      "message",
      (msgEvent: MessageEvent<ProxiedResponse>) => {
        const { symbol: resSymbol } = msgEvent.data
        if (resSymbol != symbol) return
        controller.abort() // same as fetch request
        const out = new Response(
          msgEvent.data.arrBuf as ArrayBuffer,
          msgEvent.data.responseInit as ResponseInit
        )
        res(out)
      },
      { signal: controller.signal }
    )
  })
}
/**
 * Used in an onfetch event in the iframe's swervice worker
 * @param port
 * @param symbol
 * @param request
 * @param clientId
 * @param resultingClientId
 * @returns
 */
export async function proxyFetchEvent(
  port: MessagePort,
  event: FetchEvent
): Promise<Response> {
  const symbol = [
    event.request.method,
    event.request.url,
    "@",
    event.timeStamp,
  ].join(" ")
  port.postMessage({
    request: await requestAsObject(event.request),
    clientId: event.clientId,
    resultingClientId: event.resultingClientId,
    symbol,
  } satisfies ProxiedFetchRequest)
  return receiveProxiedResponse(port, symbol)
}
/**
 * Used on the client's main page (or within a worker) to handle requests
 * @param port
 * @param onfetch
 */
export async function handleProxiedFetchEvent(
  port: MessagePort,
  onfetch: (event: FetchEvent) => any
) {
  port.addEventListener(
    "message",
    async (ev: MessageEvent<ProxiedFetchRequest>) => {
      const fetchEvent = proxiedRequestToFetchEvent(ev.data)
      fetchEvent.respondWith = async r => {
        sendProxiedResponse(port, ev.data.symbol, await r)
      }
      onfetch(fetchEvent)
    }
  )
}
