// override date
import { createDatePrototypalOverrideWorm } from "./createPrototypalOverrideWorm"
function getInitialIframeScript(date: Date): HTMLScriptElement {
  let overrideVirus = createDatePrototypalOverrideWorm(date)
  let dateScript = overrideVirus.innerText
}
