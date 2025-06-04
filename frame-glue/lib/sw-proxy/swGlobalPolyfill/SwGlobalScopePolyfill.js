/// <reference lib="webworker" />
const originalThis = globalThis;
const eventsUniqueToServiceWorker = [
    "activate",
    "fetch",
    "install",
    "message",
    "messageerror",
    "notificationclick",
    "notificationclose",
    "push",
    "pushsubscriptionchange",
];
const listeners = eventsUniqueToServiceWorker.reduce((prev, curr) => {
    prev[curr] = new Set();
    return prev;
}, {});
export const polyfill = {
    ...{
        addEventListener: function (type, listener, options) {
            if (type in listeners) {
                const t = type;
                const l = listener;
                listeners[t].add(l);
            }
            else {
                originalThis.addEventListener(type, listener, options);
            }
        },
        clients: new Clients(),
    },
    ...eventsUniqueToServiceWorker.reduce((prev, k) => {
        prev[`on${k}`] = () => { };
        return prev;
    }, {}),
    registration: new Proxy(new ServiceWorkerRegistration(), {
        get(_target, _p, _receiver) {
            throw new Error("Registration polyfill not supported.");
        },
        set() {
            throw new Error("Registration polyfill not supported.");
        },
    }),
    skipWaiting: async () => {
        console.warn("No-op");
    },
    removeEventListener: function (type, listener) {
        if (type in listeners) {
            const t = type;
            const l = listener;
            listeners[t].add(l);
        }
        else {
            originalThis.removeEventListener(type, listener);
        }
    },
};
