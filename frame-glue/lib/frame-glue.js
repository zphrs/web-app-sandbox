var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _res, _customRespondWith, _FetchEvent_instances, respondWith_fn;
function domReplacement() {
  window.addEventListener("message", (ev) => {
    console.log(ev);
    if (ev.data != "domReplacementInit") return;
    const port = ev.ports[0];
    console.log("domReplacementInit");
    port.onmessage = (ev2) => {
      console.log("overriding", ev2.data);
      console.log(ev2);
      window.document.documentElement.innerHTML = ev2.data;
      const scripts = document.querySelectorAll("script");
      for (const node of scripts) {
        const script = document.createElement("script");
        for (const attribute of node.attributes) {
          script.setAttribute(attribute.nodeName, attribute.nodeValue);
        }
        script.innerHTML = node.innerHTML;
        node.replaceWith(script);
      }
    };
    port.postMessage("inited");
  });
}
async function sleep(s) {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, s * 1e3);
  });
}
async function domReplacementParentSetup(iframe) {
  var _a;
  const { port1: port, port2: childPort } = new MessageChannel();
  const waitTillInited = new Promise((res) => {
    port.onmessage = (ev) => {
      console.log("Dom replacement initialized", ev);
      res();
    };
  });
  await sleep(0.5);
  if (iframe.contentWindow) {
    console.log((_a = iframe.contentDocument) == null ? void 0 : _a.readyState);
    iframe.contentWindow.postMessage("domReplacementInit", "*", [childPort]);
  } else {
    iframe.addEventListener("load", () => {
      console.log("Iframe loaded");
      iframe.contentWindow.postMessage("domReplacementInit", "*", [childPort]);
    });
  }
  console.log("AWAITING INIT");
  await waitTillInited;
  console.log("FINISHED AWAITING INIT");
  return (newDom) => {
    console.log("Posting", newDom);
    port.postMessage(newDom);
  };
}
class FetchEvent extends Event {
  constructor(_type, {
    request,
    clientId,
    replacesClientId,
    resultingClientId,
    handled
  }) {
    super(
      "fetch"
      /* maybe should replace with type? */
    );
    __privateAdd(this, _FetchEvent_instances);
    __publicField(this, "clientId");
    __publicField(this, "replacesClientId");
    __publicField(this, "resultingClientId");
    __publicField(this, "request");
    __publicField(this, "handled");
    // @ts-expect-error ts(2564)
    __privateAdd(this, _res);
    __privateAdd(this, _customRespondWith);
    this.request = request;
    this.clientId = clientId ?? globalThis.crypto.randomUUID();
    this.replacesClientId = replacesClientId;
    this.resultingClientId = resultingClientId;
    this.handled = handled ?? new Promise((res) => {
      __privateSet(this, _res, res);
    });
  }
  set respondWith(rw) {
    __privateSet(this, _customRespondWith, rw);
  }
  get respondWith() {
    const t = this;
    return function(resp) {
      if (__privateGet(t, _customRespondWith)) __privateGet(t, _customRespondWith).bind(this, resp)();
      __privateMethod(t, _FetchEvent_instances, respondWith_fn).bind(this, resp)();
    };
  }
  [Symbol.toStringTag]() {
    return "FetchEvent";
  }
}
_res = new WeakMap();
_customRespondWith = new WeakMap();
_FetchEvent_instances = new WeakSet();
respondWith_fn = function(p) {
  p.then(() => {
    __privateGet(this, _res).call(this);
  });
};
function stringifiableRequestInit(obj) {
  const filtered = {};
  for (const k in obj) {
    const key = k;
    if (["boolean", "number", "string"].includes(typeof obj[key]) || obj[key] === null)
      filtered[key] = obj[key];
  }
  return filtered;
}
function responseToResponseInit(res) {
  return {
    headers: Object.fromEntries(res.headers),
    status: res.status,
    statusText: res.statusText
  };
}
function proxiedRequestToFetchEvent(data) {
  const request = requestFromObject(data.params.request);
  return new FetchEvent("fetch", {
    request,
    clientId: data.params.clientId,
    replacesClientId: data.params.replacesClientId,
    resultingClientId: data.params.resultingClientId
  });
}
async function requestAsObject(request) {
  const arrayBuffer = await request.arrayBuffer();
  const { url, ...rest } = stringifiableRequestInit(request);
  const requestInit = {
    ...rest,
    headers: Object.fromEntries(request.headers),
    body: arrayBuffer
  };
  return [url, requestInit];
}
function requestFromObject(request) {
  const [url, requestInit] = request;
  return new Request(new URL(url), requestInit);
}
async function sendProxiedResponse(port, id, res) {
  port.postMessage({
    result: {
      arrBuf: await res.arrayBuffer(),
      responseInit: responseToResponseInit(res)
    },
    id
  });
}
async function receiveProxiedResponse(port, id) {
  const controller = new AbortController();
  return new Promise((res) => {
    port.addEventListener(
      "message",
      (msgEvent) => {
        const { id: resId } = msgEvent.data;
        if (resId != id) return;
        controller.abort();
        const out = new Response(
          msgEvent.data.result.arrBuf,
          msgEvent.data.result.responseInit
        );
        res(out);
      },
      { signal: controller.signal }
    );
  });
}
async function proxyFetchEvent(port, event) {
  const id = globalThis.crypto.randomUUID();
  port.postMessage({
    params: {
      request: await requestAsObject(event.request),
      clientId: event.clientId,
      resultingClientId: event.resultingClientId
    },
    id
  });
  return receiveProxiedResponse(port, id);
}
async function handleProxiedFetchEvent(port, onfetch) {
  port.addEventListener(
    "message",
    async (ev) => {
      const fetchEvent = proxiedRequestToFetchEvent(ev.data);
      fetchEvent.respondWith = async (r) => {
        sendProxiedResponse(port, ev.data.id, await r);
      };
      onfetch(fetchEvent);
    }
  );
}
export {
  domReplacement,
  domReplacementParentSetup,
  handleProxiedFetchEvent,
  proxyFetchEvent,
  sleep
};
