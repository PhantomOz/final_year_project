import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSalesTrends,
  fetchTopProducts,
  fetchDashboardStats,
} from "../store/slices/analyticsSlice";
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
  selectSalesTrends,
  selectTopProducts,
  selectDashboardStats,
  selectAnalyticsLoading,
  selectAnalyticsError,
} from "../store/slices/analyticsSlice";
import { formatCurrency } from "../utils/formatCurrency.js";

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

const Dashboard = () => {
  const dispatch = useDispatch();
  const salesTrends = useSelector(selectSalesTrends);
  const topProducts = useSelector(selectTopProducts);
  const dashboardStats = useSelector(selectDashboardStats);
  const loading = useSelector(selectAnalyticsLoading);
  const error = useSelector(selectAnalyticsError);

  useEffect(() => {
    dispatch(fetchSalesTrends("daily"));
    dispatch(fetchTopProducts());
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  console.log(dashboardStats);

  // Ensure data exists before rendering charts
  const canRenderCharts =
    salesTrends?.labels?.length > 0 && topProducts?.labels?.length > 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Sales</h3>
          <p className="text-2xl font-bold">
            {formatCurrency(dashboardStats?.totalSales || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Products</h3>
          <p className="text-2xl font-bold">
            {(dashboardStats?.totalProducts || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Low Stock Items</h3>
          <p className="text-2xl font-bold">
            {(dashboardStats?.lowStockItems || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {canRenderCharts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
            <Line
              data={salesTrends}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Sales Trend",
                  },
                },
              }}
            />
          </div>

          {/* Top Products Chart */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Top Products</h2>
            <Bar
              data={topProducts}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Best Selling Products",
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">No data available</div>
      )}
    </div>
  );
};

export default Dashboard;
