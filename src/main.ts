import "./style.css"
import { mockDate } from "./mockdate.ts"
import { createSandbox } from "./sandbox.ts"

let parent = document.querySelector<HTMLDivElement>("#app")!
createSandbox(parent)
