/// <reference lib="webworker" />

import { requestAsObject } from "./fetchConversions"
import { ProxiedFetchRequest, ProxiedResponse } from "./sw-passthrough-api"

// export empty type because of tsc --isolatedModules flag
export type {}
declare const self: ServiceWorkerGlobalScope

let setMainSw: (port: MessagePort) => void
let mainSwPromise = new Promise<MessagePort>(res => {
  setMainSw = res
})

self.addEventListener("install", () => {
  self.skipWaiting() // makes service worker install immediately
})

self.addEventListener("activate", e => {
  // makes service worker activate immediately for all requests going forward
  e.waitUntil(self.clients.claim())
})

self.addEventListener("message", event => {
  // should only ever be the port to the main page's sw
  // if *this* service worker is being mounted to the page
  setMainSw(event.ports[0])
})

self.addEventListener("fetch", event => {
  event.respondWith(handleFetch(event))
})

export async function handleFetch(event: FetchEvent): Promise<Response> {
  const mainSw = await mainSwPromise
  const symbol = [
    event.request.method,
    event.request.url,
    "@",
    event.timeStamp,
  ].join(" ")

  mainSw.postMessage({
    request: await requestAsObject(event.request),
    clientId: event.clientId,
    resultingClientId: event.resultingClientId,
    symbol,
  } satisfies ProxiedFetchRequest)
  const controller = new AbortController()
  return new Promise(res => {
    mainSw.addEventListener(
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
