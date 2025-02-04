import axios from "axios";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // Replace with actual endpoint
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

const generateInsights = async (analyticsData) => {
  try {
    const prompt = `
      As a business analytics expert, analyze this POS data and provide key insights:
      
      Sales Trends: ${JSON.stringify(analyticsData.salesTrends)}
      Top Products: ${JSON.stringify(analyticsData.topProducts)}
      Seasonal Trends: ${JSON.stringify(analyticsData.seasonalTrends)}
      Dashboard Stats: ${JSON.stringify(analyticsData.dashboardStats)}
      
      Please provide:
      1. Key performance insights
      2. Notable trends
      3. Actionable recommendations
      4. Areas of concern
      Keep the analysis concise and business-focused.
    `;

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating insights:", error);
    throw error;
  }
};

export default {
  generateInsights,
};
