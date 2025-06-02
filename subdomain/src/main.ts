import type { ProxiedResult } from "./sw/sw-passthrough-api"

import { domReplacement } from "frame-glue"

domReplacement()

async function initSwProxy(port: MessagePort) {
  if (!("serviceWorker" in navigator))
    throw new Error("Service worker is unsupported.")

  const reg = await navigator.serviceWorker.register(
    import.meta.env.MODE === "production" ? "/sw.js" : "/dev-sw.js?dev-sw",
    { type: import.meta.env.MODE === "production" ? "classic" : "module" }
  )
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (navigator.serviceWorker.controller == null) {
      throw new Error("Service worker is not registered yet")
    }
    navigator.serviceWorker.controller.postMessage("init-sw-proxy", [port])
  })
  window.addEventListener("beforeunload", () => {
    reg.unregister() // unregister to clean up this sw
  })
}
const { port1, port2 } = new MessageChannel()
port1.addEventListener("message", event => {
  console.log(event.data)
  port2.postMessage({
    arrBuf: new ArrayBuffer(),
    responseInit: { status: 200 },
    symbol: event.data.symbol,
  } satisfies ProxiedResult)
})
port1.start()
initSwProxy(port2)

window.addEventListener("message", (event: MessageEvent<any>) => {
  if (event.data == "init-proxied-sw port") {
    const portForSw = event.ports[0]
    initSwProxy(portForSw)
  }
  console.warn("Unknown event type sent to wildcard domain: ", event)
})
