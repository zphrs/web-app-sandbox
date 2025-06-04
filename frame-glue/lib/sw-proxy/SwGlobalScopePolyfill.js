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
            switch (type) {
                case "activate":
                    break;
                case "fetch":
                    break;
                case "install":
                    break;
                case "message":
                    break;
                case "messageerror":
                    break;
                case "notificationclick":
                    break;
                case "notificationclose":
                    break;
                case "push":
                    break;
                case "pushsubscriptionchange":
                    break;
                default:
            }
        },
        clients: new Clients(),
    },
    ...eventsUniqueToServiceWorker.reduce((prev, k) => {
        prev[`on${k}`] = () => { };
        return prev;
    }, {}),
};
