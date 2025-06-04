/// <reference lib="webworker" />
import { requestAsObject } from "./fetchConversions";
let setMainSw;
let mainSwPromise = new Promise(res => {
    setMainSw = res;
});
self.addEventListener("install", () => {
    self.skipWaiting(); // makes service worker install immediately
});
self.addEventListener("activate", e => {
    // makes service worker activate immediately for all requests going forward
    e.waitUntil(self.clients.claim());
});
self.addEventListener("message", event => {
    // should only ever be the port to the main page's sw
    // if *this* service worker is being mounted to the page
    setMainSw(event.ports[0]);
});
self.addEventListener("fetch", event => {
    event.respondWith(handleFetch(event));
});
export async function handleFetch(event) {
    const mainSw = await mainSwPromise;
    const symbol = [
        event.request.method,
        event.request.url,
        "@",
        event.timeStamp,
    ].join(" ");
    mainSw.postMessage({
        request: await requestAsObject(event.request),
        clientId: event.clientId,
        resultingClientId: event.resultingClientId,
        symbol,
    });
    const controller = new AbortController();
    return new Promise(res => {
        mainSw.addEventListener("message", (msgEvent) => {
            const { symbol: resSymbol } = msgEvent.data;
            if (resSymbol != symbol)
                return;
            controller.abort(); // same as fetch request
            const out = new Response(msgEvent.data.arrBuf, msgEvent.data.responseInit);
            res(out);
        }, { signal: controller.signal });
    });
}
