import { useEffect } from "react";
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
  generateAIInsights,
  selectRangeStats,
  selectSalesTrends,
  selectTopProducts,
  selectInsights,
  setDateRange,
  selectSelectedRange,
} from "../store/slices/analyticsSlice";

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

const Analytics = () => {
  const dispatch = useDispatch();
  const selectedRange = useSelector(selectSelectedRange);
  const { data: rangeStats, loading: statsLoading } =
    useSelector(selectRangeStats);
  const { data: salesTrends, loading: trendsLoading } =
    useSelector(selectSalesTrends);
  const { data: topProducts, loading: productsLoading } =
    useSelector(selectTopProducts);
  const insights = useSelector(selectInsights);

  useEffect(() => {
    dispatch(fetchRangeStats(selectedRange));
    dispatch(fetchSalesTrends(selectedRange));
    dispatch(fetchTopProducts(selectedRange));
  }, [dispatch, selectedRange]);

  useEffect(() => {
    if (rangeStats && salesTrends && topProducts) {
      dispatch(
        generateAIInsights({
          rangeStats,
          salesTrends,
          topProducts,
          selectedRange,
        })
      );
    }
  }, [dispatch, rangeStats, salesTrends, topProducts, selectedRange]);

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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your business performance and trends
        </p>
        <div className="mt-4 flex space-x-4">
          {["day", "week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => dispatch(setDateRange(range))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm p-6 transition duration-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-full`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <div className="h-80">
            <Line
              data={salesTrends || { labels: [], datasets: [] }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          <div className="h-80">
            <Bar
              data={topProducts || { labels: [], datasets: [] }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">AI-Generated Insights</h2>
            <p className="text-sm text-gray-500">
              Smart analysis of your business data
            </p>
          </div>
          <button
            onClick={() => dispatch(generateAIInsights())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={insights.loading}
          >
            {insights.loading ? (
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
                Generating...
              </span>
            ) : (
              "Refresh Insights"
            )}
          </button>
        </div>

        {insights.error ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md">
            Error generating insights: {insights.error}
          </div>
        ) : insights.data ? (
          <div className="prose max-w-none">
            <MarkdownRenderer content={insights.data} />
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Click &quot;Refresh Insights&quot; to generate AI analysis
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
