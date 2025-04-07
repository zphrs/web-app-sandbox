function overrideLocalStorage(childId: string) {
  localStorage.key
  window.addEventListener(
    "message",
    (e: MessageEvent<{ api: string; call: string }>) => {
      let { api, call } = e.data
      if (api == "localStorage" && call == "init") {
      }
    }
  )
  localStorage.window.localStorage = new Proxy(localStorage, {
    get(target, symbol) {
      if (!(symbol in target)) {
        return undefined
      }
      if (symbol.toString() == "length") {
        window.parent.postMessage(
          {
            api: "localStorage",
            call: "length",
            childId,
          },
          "*"
        )
      }
      return new Proxy(target[symbol as string], {
        apply(target, thisArg, argArray) {},
        get(target, p, receiver) {
          if (!(p in target)) return
        },
      })
    },
  })
  localStorage
}
