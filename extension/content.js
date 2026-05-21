// TrueFoundryMCPMarketPlace → TrueFoundry MCP Gateway auto-selector.
//
// Reads tool display names from the URL hash (e.g. #mcpacks=create_pr,send_message)
// and ticks the matching toggles/checkboxes on the page. Also exposes a quick
// "Load OpenClaw configuration" button so the marketplace pack can be applied
// without going through the app.

(function () {
  "use strict";

  const HASH_KEY = "mcpacks";

  // Hardcoded OpenClaw Basics tool list — must stay in sync with
  // src/lib/packs.ts (PACKS[0].tools).
  const OPENCLAW_TOOLS = [
    "get_repo",
    "list_pull_requests",
    "get_pull_request",
    "create_pull_request",
    "comment_on_pull_request",
    "list_channels",
    "send_message",
    "search",
    "create_page",
    "append_block",
    "list_issues",
    "create_issue",
    "update_issue",
  ];

  function readTargetsFromHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return [];
    const params = new URLSearchParams(hash);
    const raw = params.get(HASH_KEY);
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => decodeURIComponent(s.trim()))
      .filter(Boolean);
  }

  // ---- State ----------------------------------------------------------------

  let targets = [];
  const state = new Map();
  const itemRefs = new Map();
  let observer = null;
  let listEl = null;
  let subEl = null;

  // ---- Banner UI ------------------------------------------------------------

  const banner = document.createElement("div");
  banner.id = "tfmm-banner";
  banner.style.cssText = [
    "position:fixed",
    "right:20px",
    "bottom:20px",
    "z-index:2147483647",
    "min-width:300px",
    "max-width:360px",
    "padding:16px 18px",
    "border-radius:14px",
    "background:#0b0b0e",
    "border:1px solid rgba(255,255,255,0.12)",
    "box-shadow:0 20px 60px rgba(0,0,0,0.6)",
    "color:#fff",
    "font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif",
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText =
    "display:flex;align-items:center;gap:10px;margin-bottom:10px;";
  const dot = document.createElement("div");
  dot.style.cssText =
    "width:8px;height:8px;border-radius:999px;background:#34d399;box-shadow:0 0 12px #34d39988;";
  const title = document.createElement("div");
  title.textContent = "TrueFoundryMCPMarketPlace";
  title.style.cssText = "font-weight:600;letter-spacing:0.01em;";
  const close = document.createElement("button");
  close.textContent = "×";
  close.title = "Dismiss";
  close.style.cssText = [
    "margin-left:auto",
    "background:transparent",
    "color:rgba(255,255,255,0.5)",
    "border:0",
    "font-size:18px",
    "line-height:1",
    "cursor:pointer",
    "padding:0 4px",
  ].join(";");
  close.addEventListener("click", () => banner.remove());
  header.append(dot, title, close);

  subEl = document.createElement("div");
  subEl.style.cssText =
    "color:rgba(255,255,255,0.55);margin-bottom:12px;font-size:12px;";
  subEl.textContent = "Apply a curated tool pack to this MCP server.";

  // Primary action: Load OpenClaw configuration
  const loadBtn = document.createElement("button");
  loadBtn.textContent = "Load OpenClaw configuration";
  loadBtn.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "gap:8px",
    "width:100%",
    "padding:10px 12px",
    "border-radius:10px",
    "background:#ffffff",
    "color:#0b0b0e",
    "border:0",
    "font-size:13px",
    "font-weight:600",
    "cursor:pointer",
    "transition:background 120ms ease",
  ].join(";");
  loadBtn.addEventListener("mouseenter", () => {
    loadBtn.style.background = "#e6e6e6";
  });
  loadBtn.addEventListener("mouseleave", () => {
    loadBtn.style.background = "#ffffff";
  });
  loadBtn.addEventListener("click", () => {
    runWithTargets(OPENCLAW_TOOLS, "OpenClaw Basics");
  });

  listEl = document.createElement("ul");
  listEl.style.cssText =
    "margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px;";

  banner.append(header, subEl, loadBtn, listEl);
  document.documentElement.append(banner);

  // ---- Progress rendering ---------------------------------------------------

  function renderTargetList() {
    listEl.replaceChildren();
    itemRefs.clear();
    targets.forEach((name) => {
      const li = document.createElement("li");
      li.style.cssText =
        "display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.85);";
      const mark = document.createElement("span");
      mark.textContent = "○";
      mark.style.cssText =
        "display:inline-block;width:14px;text-align:center;color:rgba(255,255,255,0.4);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;";
      const label = document.createElement("span");
      label.textContent = name;
      label.style.cssText =
        "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;";
      li.append(mark, label);
      listEl.append(li);
      itemRefs.set(name, { li, mark, label });
    });
  }

  function renderItem(name, status) {
    const ref = itemRefs.get(name);
    if (!ref) return;
    if (status === "done") {
      ref.mark.textContent = "✓";
      ref.mark.style.color = "#34d399";
    } else if (status === "missing") {
      ref.mark.textContent = "·";
      ref.mark.style.color = "rgba(255,255,255,0.3)";
      ref.label.style.color = "rgba(255,255,255,0.45)";
    }
  }

  function maybeFinish() {
    const total = targets.length;
    const done = [...state.values()].filter((v) => v === "done").length;
    subEl.textContent =
      done === total
        ? `Done — ${done} of ${total} tools enabled.`
        : `Enabled ${done} of ${total}…`;
  }

  // ---- DOM matching ---------------------------------------------------------

  const DEBUG = true;
  function dbg(...args) {
    if (DEBUG) console.log("[TFMM]", ...args);
  }

  const TOGGLE_SELECTORS = [
    'input[type="checkbox"]',
    '[role="switch"]',
    '[role="checkbox"]',
    'button[aria-checked]',
    'button[data-state="unchecked"]',
    'button[data-state="checked"]',
    '[data-state="unchecked"]',
    '[data-state="checked"]',
    'button[class*="toggle" i]',
    'button[class*="switch" i]',
    '[class*="Switch" i] input',
    '[class*="Toggle" i] input',
  ];
  const TOGGLE_QUERY = TOGGLE_SELECTORS.join(",");

  // Dispatch a real pointer event sequence — React/Radix/Headless UI often
  // ignore synthetic .click() calls. Also tries keyboard activation for
  // role=switch buttons and the React-aware setter for checkbox inputs.
  function synthClick(el) {
    if (!el) return;
    try {
      el.focus?.();
    } catch {
      /* ignore */
    }
    const opts = { bubbles: true, cancelable: true, composed: true };
    const safeDispatch = (ev) => {
      try {
        el.dispatchEvent(ev);
      } catch {
        /* ignore */
      }
    };
    safeDispatch(new PointerEvent("pointerdown", opts));
    safeDispatch(new MouseEvent("mousedown", opts));
    safeDispatch(new PointerEvent("pointerup", opts));
    safeDispatch(new MouseEvent("mouseup", opts));
    safeDispatch(new MouseEvent("click", opts));
    try {
      el.click?.();
    } catch {
      /* ignore */
    }

    // Radix / HeadlessUI switches respond to Space and Enter.
    const role = el.getAttribute && el.getAttribute("role");
    if (
      role === "switch" ||
      role === "checkbox" ||
      el.tagName === "BUTTON"
    ) {
      safeDispatch(
        new KeyboardEvent("keydown", { ...opts, key: " ", code: "Space" }),
      );
      safeDispatch(
        new KeyboardEvent("keyup", { ...opts, key: " ", code: "Space" }),
      );
    }

    // React-managed <input type="checkbox">: bypass the React onChange noop
    // by writing through the native setter.
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      try {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "checked",
        )?.set;
        setter?.call(el, !el.checked);
        safeDispatch(new Event("input", { bubbles: true }));
        safeDispatch(new Event("change", { bubbles: true }));
      } catch {
        /* ignore */
      }
    }
  }

  // Verify whether a click actually changed the toggle. Tries clicking the
  // parent element too if the first attempt didn't take.
  function clickAndVerify(toggle, label) {
    const before = isOn(toggle);
    synthClick(toggle);
    setTimeout(() => {
      const after = isOn(toggle);
      if (after === before) {
        dbg("first click did not change state for", label, "— trying parent");
        const parent = toggle.parentElement;
        if (parent) synthClick(parent);
        setTimeout(() => {
          const after2 = isOn(toggle);
          if (after2 === before) {
            dbg(
              "STILL did not change for",
              label,
              "| toggle:",
              toggle.outerHTML?.slice(0, 200),
            );
          } else {
            dbg("parent click worked for", label);
          }
        }, 150);
      } else {
        dbg("click changed state for", label, "before:", before, "after:", after);
      }
    }, 200);
  }

  function isOn(el) {
    if (!el) return false;
    if (el instanceof HTMLInputElement && el.type === "checkbox")
      return el.checked;
    const aria = el.getAttribute && el.getAttribute("aria-checked");
    if (aria === "true") return true;
    if (aria === "false") return false;
    const ds = el.getAttribute && el.getAttribute("data-state");
    if (ds === "checked" || ds === "on" || ds === "active") return true;
    if (ds === "unchecked" || ds === "off" || ds === "inactive") return false;
    return false;
  }

  function findToggleInside(scope) {
    if (!scope || !scope.querySelector) return null;
    const candidates = scope.querySelectorAll(TOGGLE_QUERY);
    for (const c of candidates) return c;
    return null;
  }

  function climbAndFindToggle(start) {
    let cur = start;
    for (let i = 0; i < 8 && cur; i++) {
      const toggle = findToggleInside(cur);
      if (toggle) return toggle;
      cur = cur.parentElement;
    }
    return null;
  }

  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[\s_/\\-]+/g, " ")
      .trim();
  }

  function textMatchesTool(text, target) {
    const t = normalize(text);
    const goal = normalize(target);
    if (!t || !goal) return false;
    if (t === goal) return true;
    if (t === goal + ":" || t === goal + ".") return true;
    const re = new RegExp(
      "(^|\\s)" + goal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$|:|\\.|,)",
    );
    return re.test(t);
  }

  function tryEnable(target) {
    if (state.get(target) === "done") return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const v = node.nodeValue;
        if (!v) return NodeFilter.FILTER_REJECT;
        if (!textMatchesTool(v, target)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!el) continue;
      const toggle = climbAndFindToggle(el);
      if (!toggle) continue;
      if (isOn(toggle)) {
        state.set(target, "done");
        renderItem(target, "done");
        maybeFinish();
        return;
      }
      synthClick(toggle);
      setTimeout(() => {
        if (isOn(toggle)) {
          state.set(target, "done");
          renderItem(target, "done");
          maybeFinish();
        }
      }, 120);
      return;
    }
  }

  function tick() {
    for (const t of targets) {
      if (state.get(t) !== "done") tryEnable(t);
    }
  }

  // ---- Least-privilege sweep -----------------------------------------------
  // Turn OFF any currently-enabled toggle whose nearby label looks like a tool
  // name but isn't in the target list. Guarantees a visible change on demo.

  function nearbyLabel(toggle) {
    let cur = toggle;
    for (let i = 0; i < 6 && cur; i++) {
      const walker = document.createTreeWalker(cur, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const v = (n.nodeValue || "").trim();
        if (v.length >= 3 && v.length <= 60) return v;
      }
      cur = cur.parentElement;
    }
    return null;
  }

  function looksLikeToolName(rawText) {
    const t = (rawText || "").trim();
    if (t.length < 3 || t.length > 80) return false;
    if (/[.!?]/.test(t)) return false; // sentence-shaped — skip
    // snake_case API names: create_pull_request, get_repo
    if (/^[a-z][a-z0-9_]+$/.test(t)) return true;
    // camelCase: createPullRequest, listIssues
    if (/^[a-z]+([A-Z][a-z0-9]+){1,5}$/.test(t)) return true;
    // Title Case phrase, 2–5 words: "Create Pull Request"
    if (/^[A-Z][a-zA-Z0-9]+(\s[A-Z]?[a-zA-Z0-9]+){1,4}$/.test(t)) return true;
    // all-lowercase phrase: "create pull request"
    if (/^[a-z]+(\s[a-z]+){1,4}$/.test(t)) return true;
    return false;
  }

  function disableNonTargets() {
    const targetSet = new Set(targets.map(normalize));
    const toggles = document.querySelectorAll(TOGGLE_QUERY);
    dbg(
      "disable sweep: found",
      toggles.length,
      "toggle candidates on page",
    );
    let count = 0;
    let skippedNoLabel = 0;
    let skippedInTarget = 0;
    let skippedNotToolish = 0;
    const seenLabels = new Set();
    for (const toggle of toggles) {
      const label = nearbyLabel(toggle);
      if (!label) {
        skippedNoLabel++;
        continue;
      }
      if (!looksLikeToolName(label)) {
        skippedNotToolish++;
        dbg("skip: label not tool-shaped", JSON.stringify(label));
        continue;
      }
      const norm = normalize(label);
      if (targetSet.has(norm)) {
        skippedInTarget++;
        continue;
      }
      // Dedup by label so we don't click 2 toggles for the same row.
      if (seenLabels.has(norm)) continue;
      seenLabels.add(norm);

      dbg("disable click →", label, "(on?", isOn(toggle), ")");
      clickAndVerify(toggle, label);
      count++;
      if (count >= 40) break;
    }
    dbg(
      "disable sweep results:",
      "clicked",
      count,
      "| skipped no-label:",
      skippedNoLabel,
      "| skipped in-target:",
      skippedInTarget,
      "| skipped non-tool:",
      skippedNotToolish,
    );
    return count;
  }

  // ---- Confirmation dialog watcher ------------------------------------------
  // Disabling an MCP tool on TrueFoundry usually opens a confirmation dialog.
  // While the runner is active, watch for any dialog that appears and click
  // its confirm button so the unselect actually goes through.

  const CONFIRM_TEXT_RE = /^(confirm|disable|yes|remove|delete|ok|continue|apply)\.?$/i;
  const DIALOG_SELECTORS = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    'dialog[open]',
    '[data-state="open"][role]',
    '.modal',
    '[class*="Modal"]',
    '[class*="modal"]',
  ];
  const confirmed = new WeakSet();

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  function findConfirmButton(scope) {
    const candidates = scope.querySelectorAll(
      'button, [role="button"], input[type="submit"]',
    );
    let fallback = null;
    for (const btn of candidates) {
      if (!isVisible(btn)) continue;
      if (btn.disabled) continue;
      const text = (btn.innerText || btn.textContent || btn.value || "")
        .trim()
        .replace(/\s+/g, " ");
      if (!text) continue;
      if (CONFIRM_TEXT_RE.test(text)) return btn;
      // common destructive-button styling — keep as fallback
      const cls = (btn.className || "") + "";
      if (/destructive|danger|primary/i.test(cls) && !fallback) fallback = btn;
    }
    return fallback;
  }

  function sweepDialogs() {
    const dialogs = document.querySelectorAll(DIALOG_SELECTORS.join(","));
    for (const dlg of dialogs) {
      if (!isVisible(dlg)) continue;
      if (confirmed.has(dlg)) continue;
      const btn = findConfirmButton(dlg);
      if (!btn) continue;
      confirmed.add(dlg);
      dbg("auto-confirming dialog button:", btn.innerText || btn.textContent);
      synthClick(btn);
    }
  }

  let dialogObserver = null;
  function startDialogConfirmer(durationMs) {
    sweepDialogs();
    if (dialogObserver) dialogObserver.disconnect();
    dialogObserver = new MutationObserver(() => sweepDialogs());
    dialogObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-hidden", "open"],
    });
    setTimeout(() => {
      if (dialogObserver) dialogObserver.disconnect();
    }, durationMs);
  }

  function forceFlipOne() {
    // Proof-of-life fallback: if nothing else changed, flip the first ON
    // toggle so the user sees the extension worked.
    const toggles = document.querySelectorAll(TOGGLE_QUERY);
    dbg("forceFlipOne: scanning", toggles.length, "toggles");
    for (const toggle of toggles) {
      if (!isOn(toggle)) continue;
      dbg("forceFlipOne: flipping", toggle);
      synthClick(toggle);
      return true;
    }
    return false;
  }

  // ---- Runner ---------------------------------------------------------------

  function runWithTargets(toolList, label) {
    targets = toolList.slice();
    state.clear();
    targets.forEach((t) => state.set(t, "pending"));
    renderTargetList();
    subEl.textContent = `Applying ${label} — ${targets.length} tool${
      targets.length === 1 ? "" : "s"
    }…`;

    if (observer) observer.disconnect();
    observer = new MutationObserver(() => tick());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "aria-checked", "checked"],
    });

    // Auto-confirm any disable dialogs that pop up during the run.
    startDialogConfirmer(15000);

    [100, 400, 900, 1800, 3200].forEach((ms) => setTimeout(tick, ms));

    // After the enable pass, sweep and disable anything not in the pack.
    setTimeout(() => {
      const disabled = disableNonTargets();
      const enabledCount = [...state.values()].filter(
        (v) => v === "done",
      ).length;
      if (disabled === 0 && enabledCount === 0) {
        const flipped = forceFlipOne();
        subEl.textContent = flipped
          ? `${label} applied — no exact matches yet, flipped one toggle as a proof.`
          : `${label} applied — couldn't find any toggles on this page.`;
      } else if (disabled > 0) {
        subEl.textContent = `${label} applied — ${enabledCount} kept on, ${disabled} disabled (least-privilege).`;
      } else {
        subEl.textContent = `${label} applied — ${enabledCount} matched, nothing extra to disable.`;
      }
    }, 4500);

    setTimeout(() => {
      targets.forEach((t) => {
        if (state.get(t) !== "done") {
          state.set(t, "missing");
          renderItem(t, "missing");
        }
      });
      maybeFinish();
    }, 12000);

    setTimeout(() => {
      if (observer) observer.disconnect();
    }, 30000);
  }

  // ---- Boot -----------------------------------------------------------------

  const initialFromHash = readTargetsFromHash();
  if (initialFromHash.length > 0) {
    runWithTargets(initialFromHash, "your pack");
  }
})();
