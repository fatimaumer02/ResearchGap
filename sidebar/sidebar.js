document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.analysisResult) {
            renderAnalysis(changes.analysisResult.newValue);
        }
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "SHOW_ANALYSIS") {
            renderAnalysis(msg.data);
        }
    });
});

function loadFromStorage() {
    chrome.storage.local.get("analysisResult", (result) => {
        if (result.analysisResult) {
            renderAnalysis(result.analysisResult);
        }
    });
}

function renderAnalysis(data) {
    if (!data || !data.aiResult) return;

    const { score, confidence_score, aiResult, peer_review } = data;

    // Hide placeholder, show results
    document.getElementById("placeholder").style.display = "none";
    document.getElementById("result").style.display = "block";

    // Scores
    document.getElementById("totalScore").innerText = score?.totalScore ?? "—";
    document.getElementById("confidenceLevel").innerText = score?.confidence ?? "—";
    document.getElementById("confidenceScore").innerText =
        confidence_score != null ? confidence_score + "/100" : "—";

    // Methodology
    const ms = peer_review?.methodology_strength_score ?? 0;
    document.getElementById("methodScore").innerText = ms + "/100";
    document.getElementById("methodBar").style.width = ms + "%";
    document.getElementById("methodWeakness").innerText =
        peer_review?.methodology_weakness || "";

    // Reliability
    document.getElementById("relBadge").innerText =
        peer_review?.reliability_level || "—";
    document.getElementById("relReason").innerText =
        peer_review?.reliability_reason || "";

    // Literature
    document.getElementById("litVal").innerText =
        peer_review?.literature_integration || "—";

    // Recommendation
    const rec = peer_review?.recommendation || "";
    const recCard = document.getElementById("recCard");

    recCard.className = "card";

    if (rec.toLowerCase().includes("accept"))
        recCard.classList.add("rec-accept");
    else if (rec.toLowerCase().includes("reject"))
        recCard.classList.add("rec-reject");
    else
        recCard.classList.add("rec-revise");

    document.getElementById("recLabel").innerText = rec;
    document.getElementById("recReason").innerText =
        peer_review?.recommendation_reason || "";

    // ===============================
    // 📄 Paper Summary (NEW)
    // ===============================
    const summary = aiResult?.paper_summary || "No summary generated.";
    document.getElementById("paperSummary").innerText = summary;

    // ===============================
    // ⭐ Key Contributions (NEW)
    // ===============================
    const contrib = aiResult?.key_contributions || [];

    document.getElementById("contribBadge").innerText =
        contrib.length + " found";

    const contribList = document.getElementById("contribList");
    contribList.innerHTML = "";

    contrib.forEach((c, i) => {
        const item = document.createElement("div");
        item.className = "contrib-item";
        item.innerHTML =
            `<div class="contrib-num-pill">${i + 1}</div><div class="contrib-text">${c}</div>`;
        contribList.appendChild(item);
    });

    // ===============================
    // 🔍 Research Gaps
    // ===============================
    const gaps = aiResult?.research_gaps || [];

    document.getElementById("gapsBadge").innerText =
        gaps.length + " found";

    const gapsList = document.getElementById("gapsList");
    gapsList.innerHTML = "";

    gaps.forEach((g, i) => {
        const li = document.createElement("li");
        li.innerHTML =
            `<span class="item-num">${i + 1}.</span><span>${g}</span>`;
        gapsList.appendChild(li);
    });

    // ===============================
    // ⚡ Limitations
    // ===============================
    const lims = aiResult?.limitations || [];

    document.getElementById("limBadge").innerText =
        lims.length + " found";

    const limList = document.getElementById("limList");
    limList.innerHTML = "";

    lims.forEach((l, i) => {
        const li = document.createElement("li");
        li.innerHTML =
            `<span class="item-num">${i + 1}.</span><span>${l}</span>`;
        limList.appendChild(li);
    });
}