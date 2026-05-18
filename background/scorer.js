function calculateScore(aiResult) {
  let score = 0;

  // Paper summary
  if (aiResult.paper_summary || aiResult.summary) {
    score += 20;
  }

  // Key contributions
  if (aiResult.key_contributions && aiResult.key_contributions.length > 0) {
    score += aiResult.key_contributions.length * 10;
  }

  // Limitations
  if (aiResult.limitations && aiResult.limitations.length > 0) {
    score += aiResult.limitations.length * 10;
  }

  // Research gaps
  if (aiResult.research_gaps && aiResult.research_gaps.length > 0) {
    score += aiResult.research_gaps.length * 15;
  }

  return {
    totalScore: score,
    confidence: score > 60 ? "High" : score > 30 ? "Medium" : "Low"
  };
}