/// <reference lib="webworker" />

import { handleProxiedFetchEvent } from "frame-glue"
import type { InitParams } from "./Interface"
import { SUBDOMAIN_WILDCARD_URL } from "../envs"
const inited = false
self.addEventListener("message", async (event: MessageEvent<InitParams>) => {
  console.log("proxy init")
  if (inited) {
    console.warn("Proxy SW has already been initialized")
    return
  }
  const { appId } = event.data
  self.postMessage("proxy-sw init done")

  handleProxiedFetchEvent(event.ports[0], event => {
    // TODO: show popup, possibly forward event too
    const initUrl = new URL(event.request.url)
    console.log(event.request)
    if (initUrl.origin != new URL(SUBDOMAIN_WILDCARD_URL).origin) {
      console.log("Blocking external request")
      event.respondWith(
        (async () =>
          new Response(
            "Blocked as cross-origin requests are not guaranteed to be secure",
            {
              status: 500,
            }
          ))()
      )
      return
    }
    const newUrl = new URL(`${origin}/${appId}${initUrl.pathname}`)
    console.log("NEW", newUrl)
    const req = new Request(newUrl, event.request)
    console.log("YAY", req)
    event.respondWith(fetch(req))
  })
})
