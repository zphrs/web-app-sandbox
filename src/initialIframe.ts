// override date
import { domReplacement } from "frame-glue"
import { overrideCookie } from "./overrideCookie"
import { overrideLocalStorage } from "./overrideLocalStorage"
export function getInitialIframeScript(docId: string): HTMLScriptElement {
  const out = document.createElement("script")
  out.innerHTML = `
    ${overrideLocalStorage.toString()};
    overrideLocalStorage("${docId}");
    ${overrideCookie};
    overrideCookie()
  `
  return out
}
