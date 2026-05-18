// ===============================
// STATUS HELPERS
// ===============================

function setStatus(msg, state = "loading") {
  const box = document.getElementById("statusBox");
  const spinner = document.getElementById("spinner");
  const icon = document.getElementById("statusIcon");
  const text = document.getElementById("statusText");

  box.style.display = "block";

  if (state === "loading") {
    spinner.style.display = "block";
    icon.style.display = "none";
    text.style.color = "#4a5060";
  } else if (state === "done") {
    spinner.style.display = "none";
    icon.style.display = "inline";
    icon.innerText = "✅";
    text.style.color = "#16a34a";
  } else if (state === "error") {
    spinner.style.display = "none";
    icon.style.display = "inline";
    icon.innerText = "❌";
    text.style.color = "#dc2626";
  }

  text.innerText = msg;
}


// ===============================
// MAIN BUTTON CLICK
// ===============================

document.getElementById("analyzeBtn").addEventListener("click", async () => {

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  btn.innerText = "Analyzing...";

  setStatus("Opening side panel...", "loading");

  // STEP 1: Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // STEP 2: Open side panel FIRST so user sees it immediately
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (e) {
    setStatus("Could not open side panel: " + e.message, "error");
    btn.disabled = false;
    btn.innerText = "🔍 Analyze Paper";
    return;
  }

  setStatus("Extracting paper content...", "loading");

  // STEP 3: Extract paper data via scripting
  let abstract = "";
  let conclusion = "";

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPaperData
    });

    if (results && results[0] && results[0].result) {
      abstract = results[0].result.abstract || "";
      conclusion = results[0].result.conclusion || "";
    }
  } catch (e) {
    setStatus("Script injection failed: " + e.message, "error");
    btn.disabled = false;
    btn.innerText = "🔍 Analyze Paper";
    return;
  }

  // STEP 4: Fallback for bioRxiv / medRxiv / SSRN
  if (!abstract) {
    try {
      const extra = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractFromOtherSites
      });

      if (extra && extra[0] && extra[0].result) {
        abstract = extra[0].result.abstract || abstract;
        conclusion = extra[0].result.conclusion || conclusion;
      }
    } catch (_) {}
  }

  if (!abstract && !conclusion) {
    setStatus("Could not find abstract or conclusion on this page.", "error");
    btn.disabled = false;
    btn.innerText = "🔍 Analyze Paper";
    return;
  }

  setStatus("Sending to AI for analysis...", "loading");

  // STEP 5: Send to Service Worker for AI analysis
  chrome.runtime.sendMessage(
    {
      type: "ANALYZE_TEXT",
      payload: abstract + "\n\n" + conclusion
    },
    (aiResponse) => {

      if (chrome.runtime.lastError) {
        setStatus("Service Worker error: " + chrome.runtime.lastError.message, "error");
        btn.disabled = false;
        btn.innerText = "🔍 Analyze Paper";
        return;
      }

      if (!aiResponse || !aiResponse.success) {
        setStatus("AI analysis failed: " + (aiResponse?.error || "Unknown error"), "error");
        btn.disabled = false;
        btn.innerText = "🔍 Analyze Paper";
        return;
      }

      // STEP 6: Save result to storage — sidebar.js listens via storage.onChanged
      chrome.storage.local.set({ analysisResult: aiResponse }, () => {
        setStatus("Done! Check the side panel →", "done");

        // Re-enable button after a moment
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = "🔍 Analyze Paper";
        }, 2500);
      });
    }
  );
});


// ===============================
// ORIGINAL EXTRACTOR (arxiv / ar5iv)
// ===============================

function extractPaperData() {

  function cleanText(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  let abstract = "";

  let el =
    document.querySelector("blockquote.abstract") ||
    document.querySelector("span.abstract-full") ||
    document.querySelector("div.ltx_abstract");

  if (el) {
    const heading = el.querySelector("h6, .ltx_title_abstract");
    if (heading) heading.remove();
    abstract = cleanText(el.innerText.replace("Abstract:", ""));
  }

  let conclusion = "";

  const headings = document.querySelectorAll("h1, h2, h3");

  for (let heading of headings) {
    const text = heading.innerText.toLowerCase();

    if (
      text.includes("conclusion") ||
      text.includes("discussion") ||
      text.includes("future work")
    ) {
      let content = "";
      let next = heading.nextElementSibling;

      while (next && !["H1", "H2", "H3"].includes(next.tagName)) {
        content += next.innerText + " ";
        next = next.nextElementSibling;
      }

      conclusion = cleanText(content);
      break;
    }
  }

  return { abstract, conclusion };
}


// ===============================
// EXTRACTOR FOR OTHER SITES
// ===============================

async function extractFromOtherSites() {

  function cleanText(text) {
    return text ? text.replace(/\s+/g, " ").trim() : "";
  }

  const hostname = window.location.hostname;
  let abstract = "";
  let conclusion = "";

  if (hostname.includes("biorxiv.org") || hostname.includes("medrxiv.org")) {

    await new Promise(resolve => setTimeout(resolve, 2000));

    let el =
      document.querySelector("div.section.abstract") ||
      document.querySelector("div.abstract") ||
      document.querySelector('[class*="abstract"]');

    if (el) abstract = cleanText(el.innerText);

  } else if (hostname.includes("ssrn.com")) {

    let el =
      document.querySelector("#abstract-text") ||
      document.querySelector(".abstract-text") ||
      document.querySelector('[itemprop="description"]');

    if (el) {
      abstract = cleanText(el.innerText);
    }

    if (!abstract) {
      const text = document.body.innerText;
      const match = text.match(/Abstract([\s\S]{200,1500})/i);
      if (match) abstract = cleanText(match[1].split("Keywords")[0]);
    }
  }

  return { abstract, conclusion };
}