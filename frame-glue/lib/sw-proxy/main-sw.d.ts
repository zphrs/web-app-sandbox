export declare function handleIframeProxiedRequests(port: MessagePort): void;
export declare function handleProxiedFetchEvent(this: ServiceWorkerGlobalScope, event: FetchEvent): Promise<Response>;
export declare function handleFetch(event: FetchEvent): Promise<Response>;
