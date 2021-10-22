/*!
 Stencil Node System Worker v2.4.0 | MIT Licensed | https://stenciljs.com
 */
require("../../compiler/stencil.js");

const nodeApi = require("./index.js"), coreCompiler = global.stencil, nodeSys = nodeApi.createNodeSys({
 process
}), msgHandler = coreCompiler.createWorkerMessageHandler(nodeSys);

((e, n) => {
 const s = n => {
  n && "ERR_IPC_CHANNEL_CLOSED" === n.code && e.exit(0);
 }, r = (n, r) => {
  const t = {
   stencilId: n,
   stencilRtnValue: null,
   stencilRtnError: "Error"
  };
  "string" == typeof r ? t.stencilRtnError += ": " + r : r && (r.stack ? t.stencilRtnError += ": " + r.stack : r.message && (t.stencilRtnError += ":" + r.message)), 
  e.send(t, s);
 };
 e.on("message", (async t => {
  if (t && "number" == typeof t.stencilId) try {
   const r = {
    stencilId: t.stencilId,
    stencilRtnValue: await n(t),
    stencilRtnError: null
   };
   e.send(r, s);
  } catch (e) {
   r(t.stencilId, e);
  }
 })), e.on("unhandledRejection", (e => {
  r(-1, e);
 }));
})(process, msgHandler);