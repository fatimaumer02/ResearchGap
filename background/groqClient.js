

const GROQ_API_KEY = "YOUR_GROQ_API_KEY";

async function callGroqAPI(text) {

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are an academic peer-review assistant.

Analyze the research paper text and return ONLY a raw JSON object with the following structure:

paper_summary: string

key_contributions: array of strings

limitations: array of strings

research_gaps: array of strings

methodology_strength_score: number (0-100)

methodology_weakness: string

reliability_level: "Low" | "Medium" | "High"

reliability_reason: string

literature_integration: "Weak" | "Moderate" | "Strong"

recommendation: "Reject" | "Weak Reject" | "Weak Accept" | "Accept"

recommendation_reason: string


Rules:
- Base judgments only on the given text.
- If information is missing, clearly state that.
- key_contributions should contain 3–5 bullet points.
- paper_summary should be 3–4 sentences.
- No markdown.
- No explanation.
- Return JSON only.
`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.2
    })
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error("Groq API error: " + JSON.stringify(data));
  }

  return data.choices[0].message.content;
  const result = data.choices[0].message.content;

}