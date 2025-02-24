import "./style.css"
import { mockDate } from "./mockdate.ts"
import { createSandbox } from "./counter.ts"

let parent = document.querySelector<HTMLDivElement>("#app")!
createSandbox(parent)
