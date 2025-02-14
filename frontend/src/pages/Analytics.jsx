import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  BanknotesIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency } from "../utils/formatCurrency";
import MarkdownRenderer from "../components/MarkdownRenderer";
import {
  fetchRangeStats,
  fetchSalesTrends,
  fetchTopProducts,
  selectRangeStats,
  selectSalesTrends,
  selectTopProducts,
  setDateRange,
  selectSelectedRange,
} from "../store/slices/analyticsSlice";
import { generateAnalyticsPDF } from "../utils/pdfGenerator.jsx";
import FileUploadAnalyzer from "../components/FileUploadAnalyzer";
import { useChat } from "../hooks/useChat";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to convert Excel date number to readable date
const formatExcelDate = (excelDate) => {
  // Excel dates are number of days since December 30, 1899
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper function to convert Excel month number to readable month
const formatExcelMonth = (excelDate) => {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toLocaleDateString("en-NG", { month: "long" });
};

const Analytics = () => {
  const dispatch = useDispatch();
  const { sendMessage } = useChat();
  const [customAnalysis, setCustomAnalysis] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [rangeInsights, setRangeInsights] = useState(null);
  const selectedRange = useSelector(selectSelectedRange);
  const { data: rangeStats, loading: statsLoading } =
    useSelector(selectRangeStats);
  const { data: salesTrends, loading: trendsLoading } =
    useSelector(selectSalesTrends);
  const { data: topProducts, loading: productsLoading } =
    useSelector(selectTopProducts);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });
  const salesChartRef = useRef(null);
  const productsChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchRangeStats(selectedRange)).unwrap(),
          dispatch(fetchSalesTrends(selectedRange)).unwrap(),
          dispatch(fetchTopProducts(selectedRange)).unwrap(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (!customAnalysis) {
      fetchData();
    }
  }, [dispatch, selectedRange, customAnalysis]);

  // Effect to generate insights for range data
  useEffect(() => {
    const generateRangeInsights = async () => {
      if (customAnalysis) return;
      if (statsLoading || trendsLoading || productsLoading) return;
      if (!rangeStats || !salesTrends || !topProducts) return;

      setIsGeneratingInsights(true);
      try {
        const insights = await generateAIInsights(rangeStats, "range");
        setRangeInsights(insights);
      } catch (error) {
        console.error("Error generating range insights:", error);
      } finally {
        setIsGeneratingInsights(false);
      }
    };

    generateRangeInsights();
  }, [
    rangeStats,
    salesTrends,
    topProducts,
    customAnalysis,
    statsLoading,
    trendsLoading,
    productsLoading,
  ]);

  const getDateRangeLabel = (range) => {
    switch (range) {
      case "day":
        return "Today's";
      case "week":
        return "This Week's";
      case "month":
        return "This Month's";
      case "year":
        return "This Year's";
      default:
        return "Today's";
    }
  };

  const stats = [
    {
      name: `${getDateRangeLabel(selectedRange)} Transactions`,
      value: rangeStats?.transactionCount?.toLocaleString() || "0",
      icon: ShoppingCartIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: `${getDateRangeLabel(selectedRange)} Revenue`,
      value: formatCurrency(rangeStats?.totalAmount || 0),
      icon: BanknotesIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Active Users",
      value: rangeStats?.uniqueUsers?.toLocaleString() || "0",
      icon: UsersIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const handleExportPDF = () => {
    if (customAnalysis) {
      generateAnalyticsPDF({
        rangeStats: {
          transactionCount: customAnalysis.totalTransactions,
          totalAmount: customAnalysis.totalRevenue,
          averageTransactionValue: customAnalysis.averageTransactionValue,
        },
        salesTrends,
        topProducts,
        insights: customAnalysis.insights,
        selectedRange: "custom",
        isCustomData: true,
        monthlyTrends: customAnalysis.monthlyTrends,
        salesChartRef,
        productsChartRef,
        storeName: "F & M's Supermarket",
        dateRange: {
          start: new Date(customRange.startDate),
          end: new Date(customRange.endDate),
        },
        fileName: customRange.customFileName,
      });
    } else if (!statsLoading && !trendsLoading && !productsLoading) {
      // Get date range based on selected range
      let startDate, endDate;
      const now = new Date();

      switch (selectedRange) {
        case "day":
          startDate = now;
          endDate = now;
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          endDate = new Date(now.setDate(now.getDate() + 6));
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = now;
          endDate = now;
      }

      generateAnalyticsPDF({
        rangeStats,
        salesTrends,
        topProducts,
        insights: rangeInsights,
        selectedRange,
        isCustomData: false,
        salesChartRef,
        productsChartRef,
        storeName: "F & M's Supermarket",
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    }
  };

  const handleCustomRange = () => {
    if (customRange.startDate && customRange.endDate) {
      dispatch(
        setDateRange({
          type: "custom",
          startDate: customRange.startDate,
          endDate: customRange.endDate,
        })
      );
      setShowDatePicker(false);
    }
  };

  const handleRangeSelect = (range) => {
    setCustomAnalysis(null); // Clear custom analysis
    dispatch(setDateRange(range));
    setShowDatePicker(false);
  };

  const generateAIInsights = async (analysis, type = "custom") => {
    if (!analysis) return null;

    setIsGeneratingInsights(true);
    try {
      // Format date range for range data
      const dateRangeText =
        type === "range"
          ? `Analysis Period: ${getDateRangeLabel(selectedRange)}\n`
          : "Analysis Period: Custom Data\n";

      // Format sales trends with proper date formatting for custom data
      const salesTrendsFormatted =
        type === "custom" && analysis.salesTrends
          ? analysis.salesTrends.map((trend) => ({
              ...trend,
              date: formatExcelDate(parseFloat(trend.date)),
            }))
          : analysis.salesTrends;

      console.log("salesTrendsFormatted", salesTrendsFormatted);

      // Format monthly trends safely with proper date formatting
      const monthlyTrendsText =
        analysis.monthlyTrends && Array.isArray(analysis.monthlyTrends)
          ? analysis.monthlyTrends
              .map((trend) => `${trend.month}: ${formatCurrency(trend.amount)}`)
              .join("\n")
          : type === "range" && analysis.salesTrends?.labels
          ? analysis.salesTrends.labels
              .map(
                (label, index) =>
                  `${label}: ${formatCurrency(
                    analysis.salesTrends.datasets[0].data[index]
                  )}`
              )
              .join("\n")
          : analysis.salesTrends
          ? analysis.salesTrends
              .map((trend) => `${trend.date}: ${formatCurrency(trend.amount)}`)
              .join("\n")
          : "No monthly trends available";

      // Format top products safely with proper data structure check
      console.log("analysis.topProducts", analysis.topProducts);
      console.log("topProducts", topProducts);
      const topProductsText =
        analysis.topProducts && Array.isArray(analysis.topProducts)
          ? analysis.topProducts
              .slice(0, 5)
              .map(
                (product) =>
                  `${product.product}: ${formatCurrency(product.amount)}`
              )
              .join("\n")
          : type === "range" &&
            topProducts?.labels &&
            Array.isArray(topProducts.labels)
          ? topProducts.labels
              .slice(0, 5)
              .map(
                (product, index) =>
                  `${product}: ${formatCurrency(
                    topProducts.datasets[0].data[index]
                  )}`
              )
              .join("\n")
          : "No top products available";

      console.log("analysis", analysis);
      const prompt = `As a business analytics expert, please provide a comprehensive analysis of the following sales data:

      ${dateRangeText}
      
      KEY METRICS:
      - Total Revenue: ${formatCurrency(
        type === "range" ? analysis.totalAmount : analysis.totalRevenue || 0
      )}
      - Total Transactions: ${
        type === "range"
          ? analysis.transactionCount
          : analysis.totalTransactions || 0
      }
      - Average Transaction Value: ${formatCurrency(
        type === "range"
          ? analysis.totalAmount / analysis.transactionCount
          : analysis.averageTransactionValue || 0
      )}
      ${
        type === "range"
          ? `- Unique Customers: ${analysis.uniqueUsers || 0}`
          : ""
      }

      SALES TRENDS:
      ${monthlyTrendsText}

      TOP 5 PRODUCTS BY REVENUE:
      ${topProductsText}

      ${
        type === "custom" && analysis.timeAnalysis
          ? `
      TIME ANALYSIS:
      - Busiest Day: ${
        analysis.timeAnalysis.daily
          ? getDayName(
              analysis.timeAnalysis.daily.indexOf(
                Math.max(...analysis.timeAnalysis.daily)
              )
            )
          : "N/A"
      }
      - Peak Business Hours: ${
        analysis.timeAnalysis.hourly
          ? getPeakHours(analysis.timeAnalysis.hourly)
          : "N/A"
      }
      - Monthly Activity Distribution: ${
        analysis.timeAnalysis.monthly
          ? getMonthlyDistribution(analysis.timeAnalysis.monthly)
          : "N/A"
      }
      `
          : ""
      }

      Please provide a detailed analysis covering:
      1. Revenue Performance and Trends
      - Overall revenue assessment
      - Growth patterns and rate of change
      - Transaction value analysis

      2. Product Performance
      - Top performing products analysis
      - Product category insights
      - Recommendations for inventory management

      3. Customer Behavior and Patterns
      - Peak business periods
      - Customer transaction patterns
      - Seasonal variations

      4. Strategic Recommendations
      - Areas for potential growth
      - Optimization opportunities
      - Risk mitigation strategies

      Please format your response with clear headings and bullet points for readability.`;

      const aiResponse = await sendMessage(prompt);
      return aiResponse;
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return "Unable to generate AI insights at this time.";
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Helper functions for formatting
  const getDayName = (index) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[index] || "Unknown";
  };

  const getPeakHours = (hourlyData) => {
    const maxValue = Math.max(...hourlyData);
    const peakHours = hourlyData
      .map((value, index) => ({ value, index }))
      .filter((hour) => hour.value === maxValue)
      .map((hour) => `${hour.index}:00`);
    return peakHours.join(", ");
  };

  const getMonthlyDistribution = (monthlyData) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return monthlyData
      .map((value, index) => `${months[index]}: ${value}`)
      .join(", ");
  };

  const handleAnalysisComplete = async (analysisResult) => {
    try {
      // Format dates in sales trends
      const formattedAnalysis = {
        ...analysisResult,
        salesTrends: analysisResult.salesTrends.map((trend) => ({
          ...trend,
          date: formatExcelDate(parseFloat(trend.date)),
        })),
      };

      // also format monthly trends
      formattedAnalysis.monthlyTrends = formattedAnalysis.monthlyTrends.map(
        (trend) => ({
          ...trend,
          month: formatExcelMonth(parseFloat(trend.month)),
        })
      );

      console.log("formattedAnalysis", formattedAnalysis);

      const insights = await generateAIInsights(formattedAnalysis);
      setCustomAnalysis({
        ...formattedAnalysis,
        insights,
      });
    } catch (error) {
      console.error("Error in analysis completion:", error);
    }
  };

  // Chart data preparation
  const chartData = {
    labels: customAnalysis
      ? customAnalysis.salesTrends.map((trend) => trend.date)
      : salesTrends?.labels || [],
    datasets: [
      {
        label: "Sales Amount",
        data: customAnalysis
          ? customAnalysis.salesTrends.map((trend) => trend.amount)
          : salesTrends?.datasets[0].data || [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: customAnalysis
          ? "Custom Sales Trends"
          : `${getDateRangeLabel(selectedRange)} Sales Trends`,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Amount (₦)",
        },
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    tooltips: {
      callbacks: {
        label: function (context) {
          return `Amount: ${formatCurrency(context.parsed.y)}`;
        },
      },
    },
  };

  // Top products chart data
  const topProductsChartData = {
    labels: customAnalysis
      ? customAnalysis.topProducts.map((product) => product.product)
      : topProducts?.labels || [],
    datasets: [
      {
        label: "Revenue",
        data: customAnalysis
          ? customAnalysis.topProducts.map((product) => product.amount)
          : topProducts?.datasets[0].data || [],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 1,
      },
    ],
  };

  const topProductsChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Top Products by Revenue",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Revenue (₦)",
        },
        ticks: {
          callback: function (value) {
            return formatCurrency(value);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    tooltips: {
      callbacks: {
        label: function (context) {
          return `Revenue: ${formatCurrency(context.parsed.y)}`;
        },
      },
    },
  };

  if (statsLoading || trendsLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your business performance and trends
            </p>
          </div>
          <div className="flex space-x-4">
            <FileUploadAnalyzer onAnalysisComplete={handleAnalysisComplete} />
            <button
              onClick={handleExportPDF}
              disabled={
                isGeneratingInsights ||
                statsLoading ||
                trendsLoading ||
                productsLoading
              }
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${
                  isGeneratingInsights ||
                  statsLoading ||
                  trendsLoading ||
                  productsLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {isGeneratingInsights ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Report...
                </span>
              ) : (
                "Export PDF Report"
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 flex space-x-4">
          {["day", "week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => handleRangeSelect(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !customAnalysis && selectedRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedRange?.type === "custom"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Date Range Picker */}
        {showDatePicker && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex space-x-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) =>
                    setCustomRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <button
                onClick={handleCustomRange}
                disabled={!customRange.startDate || !customRange.endDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {customAnalysis ? (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Transactions
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {customAnalysis.totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                  <ShoppingCartIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatCurrency(customAnalysis.totalRevenue)}
                  </p>
                </div>
                <div className="bg-green-100 text-green-600 p-3 rounded-full">
                  <BanknotesIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average Transaction
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatCurrency(customAnalysis.averageTransactionValue)}
                  </p>
                </div>
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                  <UsersIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </>
        ) : (
          stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm p-6 transition duration-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.bgColor} ${stat.color} p-3 rounded-full`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <Line data={chartData} options={chartOptions} ref={salesChartRef} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <Bar
            data={topProductsChartData}
            options={topProductsChartOptions}
            ref={productsChartRef}
          />
        </div>
      </div>

      {/* AI Insights */}
      {(customAnalysis?.insights || rangeInsights) && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">AI-Generated Insights</h2>
            {isGeneratingInsights && (
              <div className="flex items-center text-blue-600">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating insights...
              </div>
            )}
          </div>
          <div className="prose max-w-none">
            <MarkdownRenderer
              content={customAnalysis?.insights || rangeInsights}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
