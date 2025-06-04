import { ClonableRequest } from "./fetchConversions";
export type ProxiedFetchRequest = {
    request: ClonableRequest;
    clientId: string;
    resultingClientId: string;
    symbol: string;
};
export type ProxiedResponse = {
    arrBuf: ArrayBuffer;
    responseInit: ResponseInit;
    symbol: string;
};
/**
 * Used in an onfetch event in the iframe's swervice worker
 * @param port
 * @param symbol
 * @param request
 * @param clientId
 * @param resultingClientId
 * @returns
 */
export declare function proxyFetchEvent(port: MessagePort, event: FetchEvent): Promise<Response>;
/**
 * Used on the client's main page (or within a worker) to handle requests
 * @param port
 * @param onfetch
 */
export declare function handleProxiedFetchEvent(port: MessagePort, onfetch: (event: FetchEvent) => any): Promise<void>;
