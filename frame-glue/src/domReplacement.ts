export function domReplacement() {
  window.addEventListener("message", ev => {
    console.log(ev)
    if (ev.data != "domReplacementInit") return
    const port = ev.ports[0]
    console.log("domReplacementInit")
    port.onmessage = ev => {
      console.log("overriding", ev.data)
      console.log(ev)

      window.document.documentElement.innerHTML = ev.data
      const scripts = document.querySelectorAll("script")
      for (const node of scripts) {
        const script = document.createElement("script")
        //copy over the attributes
        for (const attribute of node.attributes) {
          script.setAttribute(attribute.nodeName, attribute.nodeValue!)
        }
        script.innerHTML = node.innerHTML
        node.replaceWith(script)
      }
    }
    port.postMessage("inited")
  })
}

export async function sleep(s: number): Promise<void> {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, s * 1000)
  })
}

export async function domReplacementParentSetup(
  iframe: HTMLIFrameElement
): Promise<(newDom: string) => void> {
  const { port1: port, port2: childPort } = new MessageChannel()
  const waitTillInited = new Promise<void>(res => {
    port.onmessage = ev => {
      console.log("Dom replacement initialized", ev)
      res()
    }
  })
  await sleep(0.5)
  if (iframe.contentWindow) {
    console.log(iframe.contentDocument?.readyState)
    iframe.contentWindow.postMessage("domReplacementInit", "*", [childPort])
  } else {
    iframe.addEventListener("load", () => {
      console.log("Iframe loaded")
      iframe.contentWindow!.postMessage("domReplacementInit", "*", [childPort])
    })
  }
  console.log("AWAITING INIT")
  await waitTillInited
  console.log("FINISHED AWAITING INIT")

  return (newDom: string) => {
    console.log("Posting", newDom)
    port.postMessage(newDom)
  }
}
