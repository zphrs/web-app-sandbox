// credit for proxy idea: https://github.com/capaj/proxy-date

export function mockDate(d: string | number | Date) {
  let unmocked = globalThis.Date
  let date: Date = new unmocked(d)
  let startOfMock = unmocked.now()
  globalThis.Date = new Proxy(unmocked, {
    apply: function (Target, thisArg, args) {
      return new Target(
        date.getTime() + (unmocked.now() - startOfMock)
      ).toString()
    },
    construct: function (Target, args) {
      // props to https://stackoverflow.com/a/43160428/671457
      if (args.length === 0) {
        return new Target(date.getTime() + (unmocked.now() - startOfMock))
      }
      // @ts-expect-error
      return new Target(...args)
    },
    get: function (Target, prop, receiver) {
      if (prop === "now") {
        return () => date.getTime() * 1 + (unmocked.now() - startOfMock)
      }
      // @ts-expect-error
      return Reflect.get(...arguments)
    },
  })
}
