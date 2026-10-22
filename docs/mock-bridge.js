// ============================================================
// Dev mock bridge for the FSA host — shared by index.html and
// mock.html. Load it with: <script src="mock-bridge.js"></script>
// ============================================================
// The FSA app injects window.fsmHost in its WebView. Without the
// app, the bridge is not available and no command gets a response.
// With ?mock=1 in the URL, this file installs a fake window.fsmHost
// that answers each command with canned data, so the page runs in a
// plain browser. Without the flag, this file does nothing and the
// page behaves as in the real app.
//
// The file is self-contained: it has no dependency on the host page.
// It logs to the console with a [MOCK] tag and injects its own red
// "MOCK MODE" badge next to the first <h1>.
// ============================================================

(function installMockBridge() {
  "use strict";

  var on = new URLSearchParams(window.location.search).get("mock") === "1";
  if (!on) { return; }

  if (window.fsmHost && typeof window.fsmHost.postMessage === "function") {
    console.warn("[MOCK] Real fsmHost present — mock not installed");
    return;
  }

  // ---- Canned data ----
  var equipment = {
    id: "MZ-FG-C900", code: "MZ-FG-C900", name: "Gas Boiler",
    manufacturer: "MaxHeat", model: "FG-C900",
    location: "Rosenthaler Str. 30, Berlin",
    installDate: "2019-04-12", lastService: "2025-11-03",
    warrantyUntil: "2027-04-12", status: "Operational",
    serial: "SN-900-44821"
  };
  var person = {
    id: "P-1001", firstName: "Alex", lastName: "Fischer",
    email: "alex.fischer@example.com", phone: "+49 30 1234567",
    userName: "afischer"
  };
  var serviceCall = {
    id: "SC-5500", code: "SC-5500", subject: "Annual boiler service",
    priority: "MEDIUM", status: "OPEN",
    createDateTime: "2026-01-04T08:30:00Z"
  };
  var activity = {
    id: "ACT-7788", code: "ACT-7788", subject: "On-site inspection",
    status: "OPEN", object: { objectId: "SC-5500", objectType: "SERVICECALL" }
  };
  var company = { id: "C-1", name: "MaxHeat Service GmbH", currency: "EUR" };

  // ---- Response map ----
  // Each key is a command. The value is the payload the mock returns,
  // or a function that builds the payload from the request payload.
  var responses = {
    CONTEXT_REQUEST: { user: person, company: company, activity: activity },
    GET_LOGGED_IN_PERSON: person,
    COMPANY_INFO_GET: company,
    EQUIPMENT_GET: equipment,
    PERSON_GET: person,
    ACTIVITY_GET: activity,
    SERVICE_CALL_GET: serviceCall,
    SERVICE_CALL_ACTIVITIES_GET: [activity],
    TIME_EFFORT_GET: { id: "TE-1", durationInMinutes: 60 },
    TIME_EFFORT_GET_BY_OBJECT: [{ id: "TE-1", durationInMinutes: 60 }],
    UDO_VALUE_GET: { id: "UDOV-1", meta: "checklist", fields: {} },
    UDO_VALUE_QUERY: [{ id: "UDOV-1", meta: "checklist" }],
    UDO_META_GET: { id: "UDOM-1", name: "checklist", fields: [] },
    UDO_META_GET_BY_NAME: { id: "UDOM-1", name: "checklist", fields: [] },
    UDF_META_GET: { id: "UDFM-1", name: "note" },
    UDF_META_GET_BY_UDO_NAME: [{ id: "UDFM-1", name: "note" }],
    UDF_META_GET_BY_OBJECT_TYPE: [{ id: "UDFM-1", name: "note" }],
    ATTACHMENT_GET: { id: "ATT-1", fileName: "photo.jpg", mimeType: "image/jpeg" },
    ATTACHMENT_LIST: [{ id: "ATT-1", fileName: "photo.jpg" }],
    ATTACHMENT_DOWNLOAD: { id: "ATT-1", content: "", mimeType: "image/jpeg" },
    // Writes and actions return an acknowledgement with the sent id.
    ACTIVITY_SAVE: function (p) { return { id: (p && p.id) || activity.id, saved: true }; },
    EQUIPMENT_SAVE: function (p) { return { id: (p && p.id) || equipment.id, saved: true }; },
    UDO_VALUE_SAVE: function (p) { return { id: (p && p.id) || "UDOV-1", saved: true }; },
    UDO_VALUE_REMOVE: function (p) { return { id: p && p.id, removed: true }; },
    TIME_EFFORT_SAVE: function (p) { return { id: (p && p.id) || "TE-1", saved: true }; },
    ATTACHMENT_ADD: function (p) { return { id: (p && p.id) || "ATT-1", added: true }; },
    ATTACHMENT_REMOVE: function (p) { return { id: p && p.id, removed: true }; },
    TOAST_SHOW: function (p) { return { shown: true, key: p && p.key }; }
  };

  function respond(command, requestId, payload) {
    window.dispatchEvent(new CustomEvent("fsmHostResponse", {
      detail: {
        apiVersion: 1, requestId: requestId, command: command,
        success: true, payload: payload
      }
    }));
  }
  function respondError(command, requestId, code, message) {
    window.dispatchEvent(new CustomEvent("fsmHostResponse", {
      detail: {
        apiVersion: 1, requestId: requestId, command: command,
        success: false, error: { code: code, message: message }
      }
    }));
  }

  window.fsmHost = {
    postMessage: function (raw) {
      var msg;
      try { msg = JSON.parse(raw); }
      catch (e) { console.error("[MOCK] Bad envelope", raw); return; }
      console.info("[MOCK] Received " + msg.command + " (" + msg.requestId + ")", msg.payload);
      // Fake network latency so async paths behave like the real app.
      setTimeout(function () {
        var entry = responses[msg.command];
        if (entry === undefined) {
          respondError(msg.command, msg.requestId, "NOT_IMPLEMENTED",
            "mock has no canned response for " + msg.command);
          return;
        }
        var payload = (typeof entry === "function") ? entry(msg.payload) : entry;
        respond(msg.command, msg.requestId, payload);
      }, 300);
    }
  };
  console.warn("[MOCK] fsmHost installed (dev mode, ?mock=1)");

  // ---- Red MOCK MODE badge ----
  // Attach next to the first <h1>. If the page has no <h1>, show a
  // fixed badge in the top-right corner instead.
  function addBadge() {
    if (document.getElementById("mock-badge")) { return; }
    var badge = document.createElement("span");
    badge.id = "mock-badge";
    badge.textContent = "MOCK MODE";
    var h1 = document.querySelector("h1");
    if (h1) {
      badge.style.cssText =
        "background:#cf222e; color:#fff; font-size:0.8em; font-weight:700;" +
        "padding:6px 16px; border-radius:8px; vertical-align:middle;" +
        "letter-spacing:1px; margin-left:12px;";
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
