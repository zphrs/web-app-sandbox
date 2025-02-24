import { mockDate } from "./mockdate"
function createCspMeta(): HTMLMetaElement {
  let metaTag = document.createElement("meta")
  metaTag.httpEquiv = "Content-Security-Policy"
  // likely should use hashes at some point for script restrictions
  // that way scripts can be versioned
  metaTag.content =
    "default-src 'unsafe-inline'; script-src 'unsafe-inline' 'self' zph.rs; frame-src 'none';"
  return metaTag
}

function createPrototypalOverrideVirus(
  startDate = new Date()
): HTMLScriptElement {
  let coreOverride = `\
    ${mockDate.toString()};mockDate("${startDate}")
  `
  let iframeCreationScript = addIframeCreationListener.toString()
  let override = `addIframeCreationListener((iframe) => {
    iframe.remove()
    })`
  let scriptWithEval = `${iframeCreationScript};
  ${override};
  ${coreOverride}`
  let out = document.createElement("script")
  out.innerHTML = scriptWithEval
  return out
}
function addIframeCreationListener(fn: (elem: HTMLIFrameElement) => void) {
  const mutation_config = { childList: true, subtree: true }
  let mo = new MutationObserver(mutations => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.nodeName == "IFRAME") {
          console.log(node)
          fn(node as HTMLIFrameElement)
        }
      }
    }
  })
  mo.observe(document.documentElement, mutation_config)
}

function composeDocument(html: string): Document {
  let doc = document.implementation.createHTMLDocument()
  doc.documentElement.innerHTML = html
  doc.head.prepend(createPrototypalOverrideVirus(new Date("Jan 1, 2000")))
  doc.head.prepend(createCspMeta())
  return doc
}

export function createSandbox(parent: HTMLElement) {
  let iframe = document.createElement("iframe")
  let html = `
  <div>
  <base href="https://zph.rs"</base>
  <script src="/test.js" type="module"/>
  <script src="/cse130-notes/_astro/hoisted.Ta9NCA9F.js" type="module" />
  <script>
  document.body.innerText = Date.now(); 
  console.log("Hello, World")
  </script>
  <script>
  window.addEventListener('message', function(event) {
    document.documentElement.append(event.data)
    console.log("Message received from the child: " + event.data); // Message received from child
  });
  </script>
  <iframe srcdoc="
  <script>
  window.parent.postMessage(Date.now(), '*')
  </script>"></iframe>
  </div>`
  let doc = composeDocument(html)
  // iframe.srcdoc = doc.documentElement.outerHTML
  iframe.src = `data:text/html;base64,${btoa(doc.documentElement.outerHTML)}`
  iframe.sandbox.add("allow-scripts")
  parent.appendChild(iframe)
}
