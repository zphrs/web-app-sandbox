/// <reference lib="webworker" />
export type {}
declare const self: ServiceWorkerGlobalScope
import { requestAsObject } from "./fetchConversions"
import type { ProxiedFetchRequest, ProxiedResult } from "./sw-passthrough-api"

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
  console.log("main sw set")
  setMainSw(event.ports[0])
  mainSwPromise = new Promise<MessagePort>(res => {
    setMainSw = res
  })
  setMainSw(event.ports[0])
})

self.addEventListener("fetch", event => {
  event.respondWith(handleFetch(event))
})

export async function handleFetch(event: FetchEvent): Promise<Response> {
  const url = new URL(event.request.url)
  if (url.origin == self.origin && url.pathname == "/") {
    return await fetch(event.request)
  }
  const mainSw = await mainSwPromise
  mainSw.start()
  const symbol = crypto.randomUUID()
  console.log(event)
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
      (msgEvent: MessageEvent<ProxiedResult>) => {
        const { symbol: resSymbol, arrBuf, responseInit } = msgEvent.data
        console.log(symbol)
        if (resSymbol != symbol) return
        controller.abort() // same as fetch request
        const out = new Response(
          arrBuf as ArrayBuffer,
          responseInit as ResponseInit
        )
        res(out)
      },
      { signal: controller.signal }
    )
  })
}
