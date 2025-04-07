import { mockDate } from "./mockdate"
import { addIframeCreationListener } from "./addIframeCreationListener"

export function createDatePrototypalOverrideWorm(
  startDate = new Date()
): HTMLScriptElement {
  let coreOverride = `\
    ${mockDate.toString()};mockDate("${startDate}")
  `
  let iframeCreationScript = addIframeCreationListener.toString()
  let override = `addIframeCreationListener((iframe) => {
      let doc = document.implementation.createHTMLDocument()
      let docString = iframe.srcdoc;
      doc.documentElement.innerHTML = docString;
      const override = createDatePrototypalOverrideWorm();
      doc.head.prepend(override)
      iframe.srcdoc = doc.documentElement.outerHTML
    })`
  let scriptWithEval = `${iframeCreationScript};
  ${createDatePrototypalOverrideWorm.toString()};
  ${override};
  ${coreOverride}`
  let out = document.createElement("script")
  out.innerHTML = scriptWithEval
  return out
}
