export declare class FetchEvent extends Event {
    #private;
    clientId: string | undefined;
    replacesClientId: string | undefined;
    resultingClientId: string | undefined;
    request: Request;
    handled: Promise<void>;
    set respondWith(rw: (resp: Promise<Response>) => void);
    get respondWith(): (resp: Promise<Response>) => void;
    constructor(_type: string, { request, clientId, replacesClientId, resultingClientId, handled, }: FetchEventInit);
    [Symbol.toStringTag](): string;
}
