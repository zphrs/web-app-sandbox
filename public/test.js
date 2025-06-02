console.log("Hello from static test script!")
// localStorage.setItem("Apple", "LOL")
console.log(localStorage.getItem("Apple"))
console.log("HERE", window.localStorage)

window.onstorage = event => {
  console.log(event)
}
