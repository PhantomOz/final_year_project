import OpenAI from "openai";

console.log(import.meta.env.VITE_OPENAI_API_KEY);
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

const generateInsights = async (analyticsData) => {
  try {
    const prompt = `
      As a business analytics expert for a Nigerian retail business, analyze this POS data and provide key insights.
      All monetary values are in Nigerian Naira (NGN/₦).
      
      Sales Trends: ${JSON.stringify(analyticsData.salesTrends)}
      Top Products: ${JSON.stringify(analyticsData.topProducts)}
      Seasonal Trends: ${JSON.stringify(analyticsData.seasonalTrends)}
      Dashboard Stats: ${JSON.stringify(analyticsData.dashboardStats)}
      
      Please provide:
      1. Key performance insights (using Naira/₦ for all monetary values)
      2. Notable trends
      3. Actionable recommendations for the Nigerian market
      4. Areas of concern
      
      Keep the analysis concise, business-focused, and relevant to the Nigerian retail context.
      Always use ₦ or Naira when referring to monetary values.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
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
