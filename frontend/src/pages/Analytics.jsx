import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAnalyticsLoading,
  selectAnalyticsError,
  setDateRange,
  fetchSalesTrends,
  fetchTopProducts,
  fetchSeasonalTrends,
  fetchLowStockAlerts,
  fetchDashboardStats,
  selectDateRange,
  selectSalesTrends,
  selectTopProducts,
  selectSeasonalTrends,
  selectLowStockProducts,
  selectDashboardStats,
  selectInsights,
  generateAIInsights,
} from "../store/slices/analyticsSlice";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  CashIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UserGroupIcon,
} from "@heroicons/react/outline";
import { formatCurrency } from "../utils/formatCurrency.js";
import MarkdownRenderer from "../components/MarkdownRenderer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const dispatch = useDispatch();
  const dateRange = useSelector(selectDateRange);
  const salesTrends = useSelector(selectSalesTrends);
  const topProducts = useSelector(selectTopProducts);
  const seasonalTrends = useSelector(selectSeasonalTrends);
  const lowStockProducts = useSelector(selectLowStockProducts);
  const dashboardStats = useSelector(selectDashboardStats);
  const loading = useSelector(selectAnalyticsLoading);
  const error = useSelector(selectAnalyticsError);
  const insights = useSelector(selectInsights);
  const [selectedRange, setSelectedRange] = useState("week");

  useEffect(
    () => {
      dispatch(fetchSalesTrends(dateRange));
      dispatch(fetchTopProducts());
      dispatch(fetchSeasonalTrends());
      dispatch(fetchLowStockAlerts());
      dispatch(fetchDashboardStats());
      if (salesTrends && topProducts && seasonalTrends && dashboardStats) {
        // dispatch(generateAIInsights());
      }
    },
    [
      // dispatch,
      // dateRange,
      // salesTrends,
      // topProducts,
      // seasonalTrends,
      // dashboardStats,
    ]
  );

  const handleRangeChange = (range) => {
    setSelectedRange(range);
    dispatch(setDateRange(range));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading analytics: {error}
      </div>
    );
  }

  const stats = [
    {
      name: "Today's Transactions",
      value: dashboardStats.todayTransactions || 0,
      icon: ShoppingCartIcon,
    },
    {
      name: "Today's Revenue",
      value: formatCurrency(dashboardStats.todayRevenue || 0),
      icon: CashIcon,
    },
    {
      name: "Active Users",
      value: dashboardStats.activeUsers || 0,
      icon: UserGroupIcon,
    },
    {
      name: "Low Stock Items",
      value: dashboardStats.lowStockItems || 0,
      icon: TrendingUpIcon,
    },
  ];

  // Add default chart data structures
  const defaultChartData = {
    labels: [],
    datasets: [
      {
        label: "No Data",
        data: [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const renderInsights = () => (
    <div className="col-span-2 bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">AI-Generated Insights</h2>
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
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <div className="mt-4 flex space-x-4">
          {["day", "week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => handleRangeChange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className="h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <div className="h-80">
            <Line
              data={salesTrends || defaultChartData}
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
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          <div className="h-80">
            <Bar
              data={topProducts || defaultChartData}
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

        {/* Payment Methods Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Payment Methods</h2>
          <div className="h-80">
            <Doughnut
              data={
                seasonalTrends || {
                  labels: ["No Data"],
                  datasets: [
                    {
                      data: [1],
                      backgroundColor: ["#e5e7eb"],
                    },
                  ],
                }
              }
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

        {/* Low Stock Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Low Stock Alert</h2>
          <div className="overflow-y-auto max-h-80">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lowStockProducts?.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.stock_quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.stock_quantity <= 5
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {product.stock_quantity <= 5 ? "Critical" : "Low Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add insights section */}
      <div className="mt-6">{renderInsights()}</div>
    </div>
  );
};

export default Analytics;
