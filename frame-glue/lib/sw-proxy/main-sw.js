import { requestFromObject, responseToResponseInit } from "./fetchConversions";
const sw = self;
sw.addEventListener("fetch", event => {
    event.respondWith(handleFetch(event));
});
export function handleIframeProxiedRequests(port) {
    port.addEventListener("message", (event) => {
        const request = requestFromObject(event.data.request);
        const fetchEvent = new FetchEvent("fetch", {
            request,
            clientId: event.data.clientId,
            resultingClientId: event.data.resultingClientId,
        });
        handleProxiedFetchEvent
            .bind(sw, fetchEvent)()
            .then(async (res) => {
            port.postMessage({
                arrBuf: await res.arrayBuffer(),
                responseInit: responseToResponseInit(res),
                symbol: event.data.symbol,
            });
        });
    });
}
export async function handleProxiedFetchEvent(event) {
    let resolve;
    const out = new Promise(res => (resolve = res));
    event.waitUntil = (f) => {
        f.then(res => {
            resolve(res);
        });
    };
    this.dispatchEvent(event);
    sw.addEventListener("fetch", function (ev) {
        if (sw.onfetch)
            sw.onfetch(ev);
    });
    // calling eval directly is in fact the desired behavior to share the global
    // scope
    // NOTE: note that doing so means this worker and the other worker share
    // a global scope -- possibly dangerous and misleading
    // FIXME: Need to instead use `new Worker()` but would need to override
    // globalThis with the above which would do the above through message passing
    // See:
    // https://github.com/nodejs/node/issues/43280 - why eval is bad
    // https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker - how to use new Worker()
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1360870&GoAheadAndLogIn=1 - limitations in Firefox
    // when it comes to module service workers
    return out;
}
async function handleInitProxy(event) {
    const client = await sw.clients.get(event.clientId);
    const { port1, port2 } = new MessageChannel();
    handleIframeProxiedRequests(port1);
    client.postMessage("init-proxied-sw port", [port2]);
    return new Response("OK", {
        status: 200,
    });
}
export async function handleFetch(event) {
    const url = new URL(event.request.url);
    const isInit = url.origin == self.origin && url.pathname == "/sw-api/init-proxied-sw";
    if (isInit)
        handleInitProxy(event);
    return fetch(event.request);
}
