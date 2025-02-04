import OpenAI from "openai";

console.log(import.meta.env.VITE_OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

const generateInsights = async (analyticsData) => {
  try {
    const prompt = `
      As a business analytics expert, analyze this POS data for the ${
        analyticsData.selectedRange
      } period and provide key insights:
      
      Sales Trends: ${JSON.stringify(analyticsData.salesTrends)}
      Top Products: ${JSON.stringify(analyticsData.topProducts)}
      Seasonal Trends: ${JSON.stringify(analyticsData.seasonalTrends)}
      Dashboard Stats: ${JSON.stringify(analyticsData.dashboardStats)}
      
      Please provide:
      1. Key performance insights for this ${analyticsData.selectedRange}
      2. Notable trends compared to previous periods
      3. Actionable recommendations based on this timeframe
      4. Areas of concern
      Keep the analysis concise, business-focused, and relevant to the ${
        analyticsData.selectedRange
      } period.
      All monetary values are in Nigerian Naira (₦).
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error generating insights:", error);
    throw error;
  }
};

export default {
  generateInsights,
};
