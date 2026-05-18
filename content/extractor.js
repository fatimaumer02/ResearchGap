chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "showSidebar") {

    createSidebar(request.data);

  }

});

function createSidebar(data) {

  const sidebar = document.createElement("div");

  sidebar.style.position = "fixed";
  sidebar.style.right = "0";
  sidebar.style.top = "0";
  sidebar.style.width = "350px";
  sidebar.style.height = "100%";
  sidebar.style.background = "white";
  sidebar.style.borderLeft = "2px solid #ccc";
  sidebar.style.zIndex = "9999";
  sidebar.style.overflowY = "auto";
  sidebar.style.padding = "10px";

  // Convert arrays to list items
  const contributions = data.key_contributions?.map(c => `<li>${c}</li>`).join("") || "Not available";
  const gaps = data.research_gaps?.map(g => `<li>${g}</li>`).join("") || "Not available";
  const limitations = data.limitations?.map(l => `<li>${l}</li>`).join("") || "Not available";

  sidebar.innerHTML = `
    <h2>Analysis Result</h2>

    <p><b>Total Score:</b> ${data.total_score}</p>
    <p><b>Confidence:</b> ${data.confidence_score}</p>

    <h3>Paper Summary</h3>
    <p>${data.paper_summary || "Summary not available"}</p>

    <h3>Key Contributions</h3>
    <ul>${contributions}</ul>

    <h3>Research Gaps</h3>
    <ul>${gaps}</ul>

    <h3>Limitations</h3>
    <ul>${limitations}</ul>

    <h3>Peer Review</h3>
    <p><b>Method:</b> ${data.method_strength}</p>
    <p><b>Reliability:</b> ${data.reliability}</p>
    <p><b>Literature:</b> ${data.literature_integration}</p>
    <p><b>Recommendation:</b> ${data.recommendation}</p>
  `;

  document.body.appendChild(sidebar);
}