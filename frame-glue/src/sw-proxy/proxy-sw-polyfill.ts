/// <reference lib="webworker" />
// export empty type because of tsc --isolatedModules flag
export type {}
declare const self: ServiceWorkerGlobalScope
declare const globalThis: ServiceWorkerGlobalScope
import {
  proxiedRequestToFetchEvent,
  responseToResponseInit,
} from "./fetchConversions"
import { ProxiedFetchRequest, ProxiedResponse } from "./sw-passthrough-api"
// To be run within a web worker!

export function handleIframeProxiedRequests(port: MessagePort) {
  port.addEventListener(
    "message",
    (event: MessageEvent<ProxiedFetchRequest>) => {
      const fetchEvent = proxiedRequestToFetchEvent(event.data)
      handleProxiedFetchEvent(fetchEvent).then(async res => {
        port.postMessage({
          arrBuf: await res.arrayBuffer(),
          responseInit: responseToResponseInit(res),
          symbol: event.data.symbol,
        } satisfies ProxiedResponse)
      })
    }
  )
}

export async function handleProxiedFetchEvent(
  event: FetchEvent
): Promise<Response> {
  let resolve: (value: Response) => void
  const out = new Promise<Response>(res => (resolve = res))
  event.waitUntil = (f: Promise<Response>) => {
    f.then(res => {
      resolve(res)
    })
  }
  dispatchEvent(event)
  self.addEventListener("fetch", function (ev) {
    if (self.onfetch) self.onfetch(ev)
  })
  // FIXME: Need to use `new Worker()` to handle proxied events instead
  // See:
  // https://github.com/nodejs/node/issues/43280 - why eval is bad
  // https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker - how to use new Worker()
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1360870&GoAheadAndLogIn=1 - limitations in Firefox
  // when it comes to module service workers
  return out
}

async function initProxy() {
  const { port1, port2 } = new MessageChannel()
  handleIframeProxiedRequests(port1)
  postMessage("init-proxied-sw port", [port2])
  return new Response("OK", {
    status: 200,
  })
}
initProxy()
