import { ClonableRequest } from './fetchConversions';
import { FetchEvent } from './fetchEventPolyfill';
export type {};
export type ProxiedFetchRequest = {
    id: string | number;
    params: Omit<FetchEventInit, "request"> & {
        request: ClonableRequest;
    };
};
type SuccessfulProxiedResponse = {
    result: {
        arrBuf: ArrayBuffer;
        responseInit: ResponseInit;
    };
    id: string | number;
};
export type ProxiedResponse = SuccessfulProxiedResponse;
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
export declare function handleProxiedFetchEvent(port: MessagePort, onfetch: (event: FetchEvent) => void): Promise<void>;
