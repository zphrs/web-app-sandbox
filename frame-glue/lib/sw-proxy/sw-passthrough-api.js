import { responseToResponseInit, requestAsObject, proxiedRequestToFetchEvent, } from "./fetchConversions";
async function sendProxiedResponse(port, symbol, res) {
    port.postMessage({
        arrBuf: await res.arrayBuffer(),
        responseInit: responseToResponseInit(res),
        symbol: symbol,
    });
}
async function receiveProxiedResponse(port, symbol) {
    const controller = new AbortController();
    return new Promise(res => {
        port.addEventListener("message", (msgEvent) => {
            const { symbol: resSymbol } = msgEvent.data;
            if (resSymbol != symbol)
                return;
            controller.abort(); // same as fetch request
            const out = new Response(msgEvent.data.arrBuf, msgEvent.data.responseInit);
            res(out);
        }, { signal: controller.signal });
    });
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
export async function proxyFetchEvent(port, event) {
    const symbol = [
        event.request.method,
        event.request.url,
        "@",
        event.timeStamp,
    ].join(" ");
    port.postMessage({
        request: await requestAsObject(event.request),
        clientId: event.clientId,
        resultingClientId: event.resultingClientId,
        symbol,
    });
    return receiveProxiedResponse(port, symbol);
}
/**
 * Used on the client's main page (or within a worker) to handle requests
 * @param port
 * @param onfetch
 */
export async function handleProxiedFetchEvent(port, onfetch) {
    port.addEventListener("message", async (ev) => {
        const fetchEvent = proxiedRequestToFetchEvent(ev.data);
        fetchEvent.respondWith = async (r) => {
            sendProxiedResponse(port, ev.data.symbol, await r);
        };
        onfetch(fetchEvent);
    });
}
