// Build docs/tstFormCombined.html: a single-file router that embeds the two
// full forms in <iframe srcdoc> so each keeps its own IDs, globals, and init
// code with no rewrites. The landing view shows/hides the frames.
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const v2  = fs.readFileSync(path.join(dir, "tstFormV2.html"), "utf8");
const old = fs.readFileSync(path.join(dir, "tstFormOld.html"), "utf8");

// srcdoc holds a full HTML document as one attribute value. Only the quote
// used to wrap the attribute must be escaped inside it; we wrap in double
// quotes, so escape double quotes. Ampersands are escaped first so we do not
// double-escape the entities we introduce.
function forSrcdoc(html) {
  return html.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const out = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Test Report — TR 3004</title>
  <style>
    :root {
      --bar: #2e4a6b;
      --accent: #2e6fb5;
      --bg: #eef1f5;
      --card: #ffffff;
      --label: #5a6472;
      --divider: #e2e6ec;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      background: var(--bg);
      color: #1a1f27;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
    }
    .top-bar {
      position: sticky; top: 0; z-index: 10;
      background: var(--bar); color: #fff;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      padding-top: calc(12px + env(safe-area-inset-top));
    }
    .top-bar .title { font-size: 16px; font-weight: 700; letter-spacing: .3px; }
    .top-bar .ref { font-size: 11px; opacity: .8; text-align: right; line-height: 1.4; }
    .top-bar .back {
      font-size: 14px; font-weight: 600; color: #fff; background: none;
      border: none; cursor: pointer; padding: 4px 8px; display: none;
    }
    body.in-form .top-bar .back { display: inline-block; }

    .page { max-width: 780px; margin: 0 auto; padding: 0 0 40px; }
    .report-head { background: var(--card); padding: 16px; border-bottom: 1px solid var(--divider); }
    .report-head .rule { height: 2px; background: var(--bar); border-radius: 2px; margin-bottom: 10px; }
    .report-head .t { font-size: 16px; font-weight: 700; color: #1a1f27; }
    .report-head .sub { font-size: 12px; color: var(--label); margin-top: 2px; }
    .intro { padding: 16px 16px 4px; font-size: 13px; color: var(--label); line-height: 1.5; }

    .choice-list { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px; }
    .choice-card {
      display: block; background: var(--card); border: 1px solid var(--divider);
      border-radius: 12px; padding: 16px; color: inherit; cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: border-color .15s, box-shadow .15s;
    }
    .choice-card:active { border-color: var(--accent); box-shadow: 0 2px 8px rgba(46,111,181,0.18); }
    .choice-card .cc-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .choice-card .cc-title { font-size: 16px; font-weight: 700; color: #1a1f27; }
    .choice-card .cc-arrow { font-size: 20px; color: var(--accent); }
    .choice-card .cc-desc { font-size: 12px; color: var(--label); margin-top: 6px; line-height: 1.5; }
    .badge {
      display: inline-block; font-size: 10px; font-weight: 700; border-radius: 10px;
      padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;
    }
    .badge.new { background: var(--accent); color: #fff; }
    .badge.old { background: #e6ebf2; color: var(--label); }

    /* Form frames fill the viewport under the top bar */
    .form-frame {
      display: none; width: 100%; border: 0;
      height: calc(100vh - 49px);
    }
    body.in-form .landing { display: none; }
    body.in-form .form-frame.active { display: block; }
  </style>
</head>
<body>

  <div class="top-bar">
    <button class="back" id="backBtn" type="button">&larr; Back</button>
    <span class="title">Test Report</span>
    <span class="ref">TR 3004<br>SE GT PRM PLM 01/2024</span>
  </div>

  <div class="landing">
    <div class="page">
      <div class="report-head">
        <div class="rule"></div>
        <div class="t">Select a form</div>
        <div class="sub">TR 3004 &middot; Gas monitoring function test</div>
      </div>

      <div class="intro">Choose which version of the test report form to open.</div>

      <div class="choice-list">
        <div class="choice-card" role="button" tabindex="0" data-form="v2">
          <div class="cc-head">
            <span class="cc-title">New design <span class="badge new">V2</span></span>
            <span class="cc-arrow">&rarr;</span>
          </div>
          <div class="cc-desc">Card-based layout with unified fields, marked read-only equipment data, and a Hide Serial Number toggle.</div>
        </div>

        <div class="choice-card" role="button" tabindex="0" data-form="old">
          <div class="cc-head">
            <span class="cc-title">Previous design <span class="badge old">Old</span></span>
            <span class="cc-arrow">&rarr;</span>
          </div>
          <div class="cc-desc">The original test report form.</div>
        </div>
      </div>
    </div>
  </div>

  <iframe class="form-frame" id="frame-v2" title="New design form" srcdoc="${forSrcdoc(v2)}"></iframe>
  <iframe class="form-frame" id="frame-old" title="Previous design form" srcdoc="${forSrcdoc(old)}"></iframe>

  <script>
    // Router: show the chosen form frame, hide the landing view. Each form runs
    // in its own iframe document, so their IDs and globals never collide.
    var body = document.body;
    function openForm(which) {
      document.querySelectorAll(".form-frame").forEach(function (f) { f.classList.remove("active"); });
      var frame = document.getElementById("frame-" + which);
      if (!frame) return;
      frame.classList.add("active");
      body.classList.add("in-form");
      history.pushState({ form: which }, "");
    }
    function showLanding() {
      body.classList.remove("in-form");
      document.querySelectorAll(".form-frame").forEach(function (f) { f.classList.remove("active"); });
    }
    document.querySelectorAll(".choice-card").forEach(function (card) {
      function go() { openForm(card.getAttribute("data-form")); }
      card.addEventListener("click", go);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });
    document.getElementById("backBtn").addEventListener("click", function () {
      history.back();
    });
    // Keep the device/host back action inside this page while a form is open.
    window.addEventListener("popstate", function () {
      if (body.classList.contains("in-form")) showLanding();
    });
  </script>

</body>
</html>
`;

fs.writeFileSync(path.join(dir, "tstFormCombined.html"), out, "utf8");
console.log("Wrote tstFormCombined.html", out.length, "bytes");
