import { sleep } from "frame-glue"
import { SUBDOMAIN_WILDCARD_URL } from "./envs"

export async function overrideLocalStorage(docId: string) {
  const {
    port,
    initialStore,
  }: { port: MessagePort; initialStore: { [key: string]: string } } =
    await new Promise(res => {
      window.addEventListener("message", ev => {
        if (ev.data != "iframeInit") return
        console.log("HERE1")
        const port = ev.ports[0]
        port.onmessage = event => {
          const msgData = event.data
          switch (msgData.call) {
            case "storageEvent":
              initialStore[msgData.key] = msgData.newValue
              window.dispatchEvent(
                new StorageEvent("storage", {
                  ...msgData,
                  url: `${SUBDOMAIN_WILDCARD_URL.origin}/${docId}`,
                  storageArea: window.localStorage,
                })
              )
              break
            case "init":
              res({ port, initialStore: msgData.initialStore })
          }
        }
      })
    })
  const localStorage = new Proxy(initialStore as Storage, {
    get(target, symbol) {
      if (symbol in target) {
        return target[symbol.toString()]
      }
      switch (symbol.toString()) {
        case "setItem":
          return (key: string, value: string) => {
            target[key] = value
            port.postMessage({
              call: "setItem",
              key,
              value,
            })
          }
        case "getItem":
          return (key: string) => {
            console.log(target, key)
            return target[key]
          }
        case "removeItem":
          return (key: string) => {
            delete target[key]
            port.postMessage({
              call: "removeItem",
              key,
            })
          }
        case "key":
          return (n: number) => {
            const keys = Object.keys(target)
            if (n >= keys.length) {
              return null
            }
            return keys[n]
          }
        case "length":
          return Object.keys(target).length
      }
    },
    set(target, symbol, newValue) {
      target[symbol.toString()] = newValue
      if (
        !["setItem", "getItem", "removeItem", "key", "length"].includes(
          symbol.toString()
        )
      ) {
        port.postMessage({
          call: "setItem",
          key: symbol.toString(),
          value: newValue,
        })
      }
      return true
    },
    deleteProperty(target, key) {
      const out = Reflect.deleteProperty(target, key)
      window.parent.postMessage({
        call: "removeItem",
        key,
      })
      return out
    },
  })
  Object.defineProperty(window, "localStorage", {
    value: localStorage,
    writable: true,
  })
  console.log("overrode localStorage", window.localStorage)
  port.postMessage({
    call: "initialized",
  })
}

export async function localStorageParentSetup(
  docId: string,
  iframe: HTMLIFrameElement
) {
  const { port1: port, port2: childPort } = new MessageChannel()
  if (iframe.contentWindow) {
    console.log("SENT LS Port")
    iframe.contentWindow.postMessage("iframeInit", "*", [childPort])
  } else {
    iframe.addEventListener("load", () => {
      console.log("SENT LS Port")
      iframe.contentWindow?.postMessage("iframeInit", "*", [childPort])
    })
  }
  const [initialStore, db] = await new Promise<
    [
      {
        [key: string]: string
      },
      db: IDBDatabase,
    ]
  >((res, rej) => {
    let initialLocalStorage: { [key: string]: string } = {}
    const DBOpenRequest = window.indexedDB.open(docId)
    DBOpenRequest.addEventListener("success", _ => {
      const db = DBOpenRequest.result
      const objStore = db.transaction(docId).objectStore(docId)
      objStore.openCursor().onsuccess = function () {
        const cursor = this.result
        if (!cursor) {
          res([initialLocalStorage, db])
          return
        }

        initialLocalStorage[cursor.key.toString()] = cursor.value
        cursor.continue()
      }
    })
    DBOpenRequest.addEventListener("upgradeneeded", () => {
      const db = DBOpenRequest.result
      db.createObjectStore(docId)
    })
    DBOpenRequest.addEventListener("blocked", () => {
      rej("Open request was blocked")
    })
    DBOpenRequest.addEventListener("error", _ => {
      rej(DBOpenRequest.error)
    })
  })
  iframe.addEventListener("load", () => {
    console.log("HERE")
  })
  let res: () => void
  const childInitialized = new Promise<void>(r => {
    res = r
  })
  port.onmessage = event => {
    const objStore = db.transaction(docId, "readwrite").objectStore(docId)
    console.log("HERE", event.data.call)
    switch (event.data.call) {
      case "setItem":
        localStorage.setItem(
          `localStorage:${docId}:${encodeURIComponent(event.data.key)}`,
          event.data.value
        )
        objStore.put(event.data.value, event.data.key)
        break
      case "removeItem":
        // uri encode key so that we can safely use ":" as a deliminator
        localStorage.removeItem(
          `localStorage:${docId}:${encodeURIComponent(event.data.key)}`
        )
        objStore.delete(event.data.key)
        break
      case "initialized":
        console.log("HERsdfasdfE")
        res()
    }
  }
  console.log("Initial store:", initialStore)
  port.postMessage({ call: "init", initialStore })
  window.addEventListener("storage", event => {
    if (event.key == null) {
      // clear event
      port.postMessage({
        key: null,
        oldValue: event.oldValue,
        newValue: event.newValue,
      })
      return
    }
    const [ls, dId, encodedKey] = event.key.split(":")
    if (ls != "localStorage") return
    if (dId != docId) return
    const key = decodeURIComponent(encodedKey)
    port.postMessage({
      call: "storageEvent",
      key,
      oldValue: event.oldValue,
      newValue: event.newValue,
    })
  })
  await childInitialized
}
