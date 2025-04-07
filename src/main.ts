import "./style.css"
import { createSandbox } from "./sandbox.ts"

let parent = document.querySelector<HTMLDivElement>("#app")!
let doc = await (await fetch("/excalidraw/index.html")).text()
createSandbox(
  parent
  // doc
)
