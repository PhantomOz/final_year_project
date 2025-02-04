import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDashboardStats,
  fetchLowStockItems,
  selectDashboardStats,
  selectLowStockItems,
} from "../store/slices/dashboardSlice";
import { formatCurrency } from "../utils/formatCurrency";
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { data: stats, loading: statsLoading } =
    useSelector(selectDashboardStats);
  const { data: lowStockItems, loading: itemsLoading } =
    useSelector(selectLowStockItems);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLowStockItems());
  }, [dispatch]);

  const statsCards = [
    {
      title: "Total Sales",
      value: stats?.totalSales?.toLocaleString() || "0",
      icon: ShoppingCartIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts?.toLocaleString() || "0",
      icon: ShoppingBagIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount?.toLocaleString() || "0",
      icon: ExclamationCircleIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  if (statsLoading || itemsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your business metrics and inventory alerts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow-sm p-6 transition duration-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`${card.bgColor} ${card.color} p-3 rounded-full`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Items Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Low Stock Alerts
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Items that need to be restocked soon
              </p>
            </div>
            {lowStockItems?.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {lowStockItems.length} items need attention
              </span>
            )}
          </div>

          {lowStockItems?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
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
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.stock_quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.stock_quantity <= 5
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.stock_quantity <= 5 ? "Critical" : "Low Stock"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No Low Stock Items
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                All products are well stocked.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
