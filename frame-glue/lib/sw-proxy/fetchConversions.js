export function stringifiableRequestInit(obj) {
    const filtered = {};
    for (const k in obj) {
        const key = k;
        if (["boolean", "number", "string"].includes(typeof obj[key]) ||
            obj[key] === null)
            filtered[key] = obj[key];
    }
    return filtered;
}
export function responseToResponseInit(res) {
    return {
        headers: Object.fromEntries(res.headers),
        status: res.status,
        statusText: res.statusText,
    };
}
export function proxiedRequestToFetchEvent(data) {
    const request = requestFromObject(data.request);
    return new FetchEvent("fetch", {
        request,
        clientId: data.clientId,
        resultingClientId: data.resultingClientId,
    });
}
export async function requestAsObject(request) {
    const arrayBuffer = await request.arrayBuffer();
    const { url, ...rest } = stringifiableRequestInit(request);
    const requestInit = {
        ...rest,
        headers: Object.fromEntries(request.headers),
        body: arrayBuffer,
    };
    // signal can be omitted because abortSignals aren't functional in service
    // workers anyway
    //
    // see /references.md#1-abortsignal-in-service-worker-nonfunctional
    return [url, requestInit];
}
export function requestFromObject(request) {
    return new Request(...request);
}
