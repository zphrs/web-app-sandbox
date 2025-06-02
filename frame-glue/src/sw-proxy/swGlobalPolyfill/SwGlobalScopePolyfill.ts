/// <reference lib="webworker" />

type UniqueToServiceWorker = {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/clients) */
  readonly clients: Clients
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/activate_event) */
  onactivate:
    | ((this: ServiceWorkerGlobalScope, ev: ExtendableEvent) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/fetch_event) */
  onfetch: ((this: ServiceWorkerGlobalScope, ev: FetchEvent) => any) | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/install_event) */
  oninstall:
    | ((this: ServiceWorkerGlobalScope, ev: ExtendableEvent) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/message_event) */
  onmessage:
    | ((this: ServiceWorkerGlobalScope, ev: ExtendableMessageEvent) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/messageerror_event) */
  onmessageerror:
    | ((this: ServiceWorkerGlobalScope, ev: MessageEvent) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event) */
  onnotificationclick:
    | ((this: ServiceWorkerGlobalScope, ev: NotificationEvent) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/notificationclose_event) */
  onnotificationclose:
    | ((this: ServiceWorkerGlobalScope, ev: NotificationEvent) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/push_event) */
  onpush: ((this: ServiceWorkerGlobalScope, ev: PushEvent) => any) | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event) */
  onpushsubscriptionchange:
    | ((this: ServiceWorkerGlobalScope, ev: Event) => any)
    | null
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/registration) */
  readonly registration: ServiceWorkerRegistration
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting) */
  skipWaiting(): Promise<void>
  addEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
    type: K,
    listener: (
      this: ServiceWorkerGlobalScope,
      ev: ServiceWorkerGlobalScopeEventMap[K]
    ) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof ServiceWorkerGlobalScopeEventMap>(
    type: K,
    listener: (
      this: ServiceWorkerGlobalScope,
      ev: ServiceWorkerGlobalScopeEventMap[K]
    ) => any,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void
}
const originalThis = globalThis

interface EventMapUniqueToServiceWorker {
  activate: ExtendableEvent
  fetch: FetchEvent
  install: ExtendableEvent
  message: ExtendableMessageEvent
  messageerror: MessageEvent
  notificationclick: NotificationEvent
  notificationclose: NotificationEvent
  push: PushEvent
  pushsubscriptionchange: Event
}
type EventsUniqueToServiceWorker = keyof EventMapUniqueToServiceWorker

const eventsUniqueToServiceWorker: Array<EventsUniqueToServiceWorker> = [
  "activate",
  "fetch",
  "install",
  "message",
  "messageerror",
  "notificationclick",
  "notificationclose",
  "push",
  "pushsubscriptionchange",
]
const listeners: {
  [K in EventsUniqueToServiceWorker]: Set<
    (
      this: ServiceWorkerGlobalScope,
      ev: EventMapUniqueToServiceWorker[EventsUniqueToServiceWorker]
    ) => any
  >
} = eventsUniqueToServiceWorker.reduce(
  (prev, curr) => {
    prev[curr] = new Set()
    return prev
  },
  {} as typeof listeners
)
type SwEventListeners = `on${EventsUniqueToServiceWorker}`
export const polyfill: UniqueToServiceWorker = {
  ...{
    addEventListener: function <
      K extends keyof ServiceWorkerGlobalScopeEventMap,
    >(
      type: K,
      listener: (
        this: ServiceWorkerGlobalScope,
        ev: ServiceWorkerGlobalScopeEventMap[K]
      ) => any,
      options?: boolean | AddEventListenerOptions
    ): void {
      if (type in listeners) {
        const t = type as EventsUniqueToServiceWorker
        const l = listener as unknown as EventMapUniqueToServiceWorker[typeof t]
        listeners[t].add(
          l as unknown as (this: ServiceWorkerGlobalScope, ev: Event) => any
        )
      } else {
        originalThis.addEventListener(
          type,
          listener as (
            this: WorkerGlobalScope,
            evt: WorkerGlobalScopeEventMap[keyof WorkerGlobalScopeEventMap]
          ) => any,
          options
        )
      }
    },
    clients: new Clients(),
  },
  ...eventsUniqueToServiceWorker.reduce(
    (prev, k) => {
      prev[`on${k}`] = () => {}
      return prev
    },
    {} as { [K in SwEventListeners]: UniqueToServiceWorker[K] }
  ),
  registration: new Proxy(new ServiceWorkerRegistration(), {
    get(_target, _p, _receiver) {
      throw new Error("Registration polyfill not supported.")
    },
    set() {
      throw new Error("Registration polyfill not supported.")
    },
  }),
  skipWaiting: async () => {
    console.warn("No-op")
  },
  removeEventListener: function <
    K extends keyof ServiceWorkerGlobalScopeEventMap,
  >(
    type: K,
    listener: (
      this: ServiceWorkerGlobalScope,
      ev: ServiceWorkerGlobalScopeEventMap[K]
    ) => any
  ) {
    if (type in listeners) {
      const t = type as EventsUniqueToServiceWorker
      const l = listener as unknown as EventMapUniqueToServiceWorker[typeof t]
      listeners[t].add(
        l as unknown as (this: ServiceWorkerGlobalScope, ev: Event) => any
      )
    } else {
      originalThis.removeEventListener(
        type,
        listener as (
          this: WorkerGlobalScope,
          evt: WorkerGlobalScopeEventMap[keyof WorkerGlobalScopeEventMap]
        ) => any
      )
    }
  },
}
