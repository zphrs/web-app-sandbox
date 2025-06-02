import { domReplacementParentSetup, sleep } from "frame-glue"
import { SUBDOMAIN_WILDCARD_URL } from "./envs"
import { getInitialIframeScript } from "./initialIframe"
import { localStorageParentSetup } from "./overrideLocalStorage"

function createCspMeta(): HTMLMetaElement {
  let metaTag = document.createElement("meta")
  metaTag.httpEquiv = "Content-Security-Policy"
  // likely should use hashes at some point for script restrictions
  // that way scripts can be versioned
  metaTag.content =
    "default-src 'unsafe-inline' 'self'; script-src 'unsafe-inline' 'self'; style-src 'unsafe-inline' 'self'; frame-src 'none'; img-src 'self' data:;"
  return metaTag
}

function createBase(basePath: string): HTMLBaseElement {
  let base = document.createElement("base")
  base.href = window.origin + "/" + basePath
  console.log("Base", base.href)
  return base
}

function composeDocument(html: string, appId: string): Document {
  let doc = document.implementation.createHTMLDocument()
  doc.documentElement.innerHTML = html
  // doc.head.prepend(createBase(appId))
  doc.head.prepend(createCspMeta())
  return doc
}

export async function createSandbox(
  parent: HTMLElement,
  index?: string,
  docId = "test",
  appId = ""
) {
  let iframe = document.createElement("iframe")
  let iframeScript = getInitialIframeScript(docId)
  let initialDoc = composeDocument(iframeScript.outerHTML, appId)

  iframe.src = SUBDOMAIN_WILDCARD_URL.replace("*", crypto.randomUUID())
  // iframe.srcdoc = initialDoc.documentElement.outerHTML
  iframe.sandbox.add("allow-scripts")
  iframe.sandbox.add("allow-same-origin")
  iframe.allow = "clipboard-write"
  parent.appendChild(iframe)
  const replaceDom = await domReplacementParentSetup(iframe)
  replaceDom(initialDoc.documentElement.outerHTML)
  await localStorageParentSetup(docId, iframe)
  let html =
    index ??
    `
    <script>
    console.log("Successfully ran script")
    </script>
    <script src="test.js"></script>

    Hello world!
    `
  let doc = composeDocument(html, appId)
  replaceDom(doc.documentElement.outerHTML)
  // iframe.src = `data:text/html;base64,${btoa(doc.documentElement.outerHTML)}`
}
