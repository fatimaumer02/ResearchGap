importScripts("groqClient.js", "scorer.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type === "ANALYZE_TEXT") {

    (async () => {
      try {

        const aiRaw = await callGroqAPI(request.payload);

        // Safe JSON parsing
        let aiResult;
        try {
          aiResult = JSON.parse(aiRaw);
        } catch (err) {
          throw new Error("AI returned invalid JSON.");
        }

        // ✅ Normalize fields (VERY IMPORTANT)
        const paper_summary =
          aiResult.paper_summary ||
          aiResult.summary ||
          "Summary not available.";

        const key_contributions =
          aiResult.key_contributions ||
          aiResult.contributions ||
          [];

        const limitations =
          aiResult.limitations || [];

        const research_gaps =
          aiResult.research_gaps || [];

        // Basic scoring
        const score = calculateScore({
          paper_summary,
          key_contributions,
          limitations,
          research_gaps
        });

        // Confidence score (0–100)
        const confidence_score = Math.min(
          100,
          (research_gaps.length * 20) +
          (limitations.length * 15)
        );

        // Peer Review Object
        const peer_review = {

          methodology_strength_score:
            aiResult.methodology_strength_score || 0,

          methodology_weakness:
            aiResult.methodology_weakness || "Not specified",

          reliability_level:
            aiResult.reliability_level || "Unknown",

          reliability_reason:
            aiResult.reliability_reason || "Not specified",

          literature_integration:
            aiResult.literature_integration || "Unknown",

          recommendation:
            aiResult.recommendation || "Undetermined",

          recommendation_reason:
            aiResult.recommendation_reason || "Not specified"
        };

        const result = {

          success: true,

          score,
          confidence_score,

          // ✅ main insights
          paper_summary,
          key_contributions,
          limitations,
          research_gaps,

          aiResult,
          peer_review
        };

        // Save to storage
        await chrome.storage.local.set({ analysisResult: result });

        sendResponse(result);

      } catch (error) {

        console.error("AI Error:", error);

        sendResponse({
          success: false,
          error: error.message
        });
      }

    })();

    return true;
  }
});