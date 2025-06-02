import type { ClonableRequest } from "./fetchConversions"

export type ProxiedFetchRequest = {
  request: ClonableRequest
  clientId: string
  resultingClientId: string
  symbol: string
}

export type ProxiedResult = {
  arrBuf: ArrayBuffer
  responseInit: ResponseInit
  symbol: string
}
