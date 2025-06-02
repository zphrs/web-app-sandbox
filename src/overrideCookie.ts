export function overrideCookie() {
  Object.defineProperty(document, "cookie", {
    value: "",
    writable: true,
  })
  document.cookie = ""
}
