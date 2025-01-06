import { useEffect, useState } from "react";
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
  ArcElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { fetchAnalyticsData } from "../store/slices/analyticsSlice";
import { useNotification } from "../context/NotificationContext";

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
  const { showNotification } = useNotification();
  const [dateRange, setDateRange] = useState("week");
  const { loading, error, data } = useSelector((state) => state.analytics);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchAnalyticsData(dateRange)).unwrap();
      } catch (err) {
        showNotification("error", "Failed to load analytics data");
      }
    };
    fetchData();
  }, [dispatch, dateRange, showNotification]);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  const salesTrendOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Sales Trend" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const topProductsOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Top Products" },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const paymentMethodOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Payment Methods" },
    },
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Overview Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold">
                ${data?.totalSales?.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold">{data?.totalOrders}</p>
            </div>
            <div>
              <p className="text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold">
                ${data?.averageOrderValue?.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Products Sold</p>
              <p className="text-2xl font-bold">{data?.totalProductsSold}</p>
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Line data={data?.salesTrend} options={salesTrendOptions} />
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Bar data={data?.topProducts} options={topProductsOptions} />
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Pie data={data?.paymentMethods} options={paymentMethodOptions} />
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
          <h2 className="text-lg font-semibold mb-4">Low Stock Alert</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Minimum Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.lowStockProducts?.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.currentStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.minRequired}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
