export class FetchEvent extends Event {
  clientId: string | undefined
  replacesClientId: string | undefined
  resultingClientId: string | undefined
  request: Request
  handled: Promise<void>
  // @ts-expect-error ts(2564)
  #res: () => void
  #customRespondWith: ((res: Promise<Response>) => void) | undefined

  set respondWith(rw: (resp: Promise<Response>) => void) {
    this.#customRespondWith = rw
  }

  get respondWith() {
    // need to alias this to allow for user to bind a different this to the return
    // type without breaking functionality
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const t = this
    return function (resp: Promise<Response>) {
      // @ts-expect-error ts(2683)
      if (t.#customRespondWith) t.#customRespondWith.bind(this, resp)()
      // @ts-expect-error ts(2683)
      t.#respondWith.bind(this, resp)()
    }
  }

  constructor(
    _type: string,
    {
      request,
      clientId,
      replacesClientId,
      resultingClientId,
      handled,
    }: FetchEventInit
  ) {
    super("fetch" /* maybe should replace with type? */)
    this.request = request
    this.clientId = clientId ?? globalThis.crypto.randomUUID()
    this.replacesClientId = replacesClientId
    this.resultingClientId = resultingClientId
    this.handled =
      handled ??
      new Promise(res => {
        this.#res = res
      })
  }

  #respondWith(p: Promise<Response>) {
    p.then(() => {
      this.#res()
    })
  }

  [Symbol.toStringTag]() {
    return "FetchEvent"
  }
}
