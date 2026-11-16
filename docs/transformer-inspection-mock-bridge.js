// DEV-ONLY mock of the FSA host bridge (window.fsmHost). Never deployed.
// Installs only with ?mock=1 in the URL, so the Transformer Inspection PWA runs
// in a plain browser / on a phone over wifi without the FSA app.
//
// This mock follows the OFFICIAL SAP FSA JavaScript Bridge contract:
//   request  : fsmHost.postMessage(JSON.stringify({ apiVersion, requestId, command, payload }))
//   response : fsmHostResponse CustomEvent, detail is an OBJECT
//              { success, requestId, command, payload, error:{code,message} }
// CONTEXT_RESPONSE carries the Web Container config (cloudId = WebModule id),
// NOT the current record id. The activity id is passed on the launch URL as
// ?activityId=... , so this mock does not return it in the context.
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  if (params.get("mock") !== "1") { return; }
  if (window.fsmHost && typeof window.fsmHost.postMessage === "function") {
    console.warn("[mock fsmHost] real bridge present - mock not installed");
    return;
  }

  var log = [];
  window.__mockBridgeLog = log;

  var store = { attachments: [], toasts: [] };
  window.__mockBridgeStore = store;

  function reply(detail) {
    log.push({ dir: "out", detail: detail });
    console.log("[mock fsmHost] ->", JSON.stringify(detail));
    window.dispatchEvent(new CustomEvent("fsmHostResponse", { detail: detail }));
  }

  function handle(msg) {
    var requestId = msg.requestId;
    var command = msg.command;

    if (msg.apiVersion !== 1) {
      return reply({
        requestId: requestId, command: "ERROR", success: false,
        error: { code: "VALIDATION_ERROR", message: "Missing required field: apiVersion" }
      });
    }

    switch (command) {
      case "CONTEXT_REQUEST":
        return reply({
          requestId: requestId,
          command: "CONTEXT_RESPONSE",
          success: true,
          payload: {
            user: "Mehta Kunal",
            user_id: "USR-TECH-01",
            account: "StarkGridDemo",
            user_email: "mehta.kunal@demo.sap",
            selected_company_name: "StarkGrid Utilities",
            selected_company_id: "CMP-SG",
            cluster_url: "https://demo.coresystems.net",
            cloudId: "WEBMODULE-CFG-1",
            objectType: "WEBMODULE",
            displayLanguage: "en-US"
          }
        });

      case "ATTACHMENT_ADD": {
        var p = msg.payload || {};
        var saved = {
          id: "ATT-" + (store.attachments.length + 1),
          fileName: p.fileName,
          title: p.title,
          objectId: p.object && p.object.objectId,
          objectType: p.object && p.object.objectType,
          size: (p.fileContent || "").length
        };
        store.attachments.push(saved);
        return reply({
          requestId: requestId, command: "ATTACHMENT_ADD_RESPONSE", success: true,
          payload: { id: saved.id, isNew: true, saved: true }
        });
      }

      case "TOAST_SHOW":
        store.toasts.push((msg.payload && msg.payload.message) || "");
        return reply({ requestId: requestId, command: "TOAST_SHOW_RESPONSE", success: true, payload: {} });

      default:
        return reply({
          requestId: requestId, command: "ERROR", success: false,
          error: { code: "UNKNOWN_COMMAND", message: command }
        });
    }
  }

  window.fsmHost = {
    postMessage: function (raw) {
      var msg;
      try { msg = typeof raw === "string" ? JSON.parse(raw) : raw; }
      catch (e) { console.error("[mock fsmHost] bad message", raw); return; }
      log.push({ dir: "in", msg: msg });
      console.log("[mock fsmHost] <-", JSON.stringify(msg));
      setTimeout(function () { handle(msg); }, 40);   // simulate async host turnaround
    }
  };

  console.log("[mock fsmHost] installed (dev mode, ?mock=1)");

  // ---- Red MOCK MODE badge, next to the first <h1> (or fixed top-right) ----
  function addBadge() {
    if (document.getElementById("mock-badge")) { return; }
    var badge = document.createElement("span");
    badge.id = "mock-badge";
    badge.textContent = "MOCK MODE";
    var h1 = document.querySelector("h1, .title");
    if (h1) {
      badge.style.cssText =
        "background:#cf222e; color:#fff; font-size:0.72em; font-weight:700;" +
        "padding:4px 10px; border-radius:8px; vertical-align:middle;" +
        "letter-spacing:1px; margin-left:10px;";
      h1.appendChild(badge);
    } else {
      badge.style.cssText =
        "position:fixed; top:10px; right:10px; z-index:99999;" +
        "background:#cf222e; color:#fff; font-size:14px; font-weight:700;" +
        "padding:6px 16px; border-radius:8px; letter-spacing:1px;" +
        "box-shadow:0 2px 6px rgba(0,0,0,0.3);";
      document.body.appendChild(badge);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addBadge);
  } else {
    addBadge();
  }
})();
