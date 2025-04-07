import { createDatePrototypalOverrideWorm } from "./createPrototypalOverrideWorm"
function createCspMeta(): HTMLMetaElement {
  let metaTag = document.createElement("meta")
  metaTag.httpEquiv = "Content-Security-Policy"
  // likely should use hashes at some point for script restrictions
  // that way scripts can be versioned
  metaTag.content =
    "default-src 'unsafe-inline'; script-src 'unsafe-inline' 'self'; frame-src 'none';"
  return metaTag
}

function composeDocument(html: string): Document {
  let doc = document.implementation.createHTMLDocument()
  doc.documentElement.innerHTML = html
  doc.head.prepend(createDatePrototypalOverrideWorm(new Date("Jan 1, 2000")))
  doc.head.prepend(createCspMeta())
  return doc
}

export function createSandbox(parent: HTMLElement, index?: string) {
  let iframe = document.createElement("iframe")
  let html =
    index ??
    `
  <div>
  <base href="${window.origin}"</base>
  <script src="test.js"></script>
  <script>
  console.log(Date.now()); 
  </script>
  <script>
  window.addEventListener('message', function(event) {
    document.documentElement.append(event.data)
    console.log("Message received from the child: " + event.data); // Message received from child
  });
  </script>
  <iframe srcdoc="
  <body>
  <script>
  console.log('HERE', Date.now())
  // window.parent.postMessage(Date.now(), '*')
  </script>
  <iframe srcdoc='<script>console.log(Date.now())</script>' />
  </body>

  "></iframe>
  </div>
  `
  let doc = composeDocument(html)
  iframe.srcdoc = doc.documentElement.outerHTML
  // iframe.src = `data:text/html;base64,${btoa(doc.documentElement.outerHTML)}`
  iframe.sandbox.add("allow-scripts")
  parent.appendChild(iframe)
}
