import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatCurrency } from "./formatCurrency";

const getDateRange = (range) => {
  if (typeof range === "object" && range.type === "custom") {
    return {
      startDate: new Date(range.startDate),
      endDate: new Date(range.endDate),
    };
  }

  const endDate = new Date();
  let startDate = new Date();

  switch (range) {
    case "day":
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate };
    case "week":
      startDate.setDate(endDate.getDate() - 7);
      return { startDate, endDate };
    case "month":
      startDate.setMonth(endDate.getMonth() - 1);
      return { startDate, endDate };
    case "year":
      startDate.setFullYear(endDate.getFullYear() - 1);
      return { startDate, endDate };
    default:
      return { startDate, endDate };
  }
};

const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const generateAnalyticsPDF = ({
  rangeStats,
  salesTrends,
  topProducts,
  insights,
  selectedRange,
  isCustomData,
  monthlyTrends,
}) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;

  // Title
  doc.setFontSize(20);
  doc.text(
    isCustomData ? "Custom Data Analytics Report" : "Analytics Report",
    margin,
    margin
  );

  // Date Range
  doc.setFontSize(12);
  doc.text(
    isCustomData
      ? `Generated on ${new Date().toLocaleDateString()}`
      : `Period: ${
          selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)
        }`,
    margin,
    margin + 10
  );

  // Key Statistics
  doc.setFontSize(14);
  doc.text("Key Statistics", margin, margin + 25);

  const stats = [
    [
      "Total Transactions",
      rangeStats.transactionCount?.toLocaleString() || "0",
    ],
    ["Total Revenue", formatCurrency(rangeStats.totalAmount || 0)],
    [
      "Average Transaction",
      formatCurrency(rangeStats.averageTransactionValue || 0),
    ],
  ];

  doc.autoTable({
    startY: margin + 30,
    head: [["Metric", "Value"]],
    body: stats,
    margin: { left: margin },
    theme: "grid",
  });

  // Sales Trends
  doc.setFontSize(14);
  doc.text("Sales Trends", margin, doc.autoTable.previous.finalY + 15);

  const trendsData =
    isCustomData && monthlyTrends
      ? monthlyTrends.map((trend) => [
          trend.month,
          formatCurrency(trend.amount),
        ])
      : salesTrends?.labels
      ? salesTrends.labels.map((label, index) => [
          label,
          formatCurrency(salesTrends.datasets[0].data[index]),
        ])
      : [];

  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [["Date", "Amount"]],
    body: trendsData,
    margin: { left: margin },
    theme: "grid",
  });

  // Top Products
  doc.setFontSize(14);
  doc.text("Top Products", margin, doc.autoTable.previous.finalY + 15);

  const productsData =
    isCustomData && Array.isArray(topProducts)
      ? topProducts.map((product) => [
          product.product,
          formatCurrency(product.amount),
        ])
      : topProducts?.labels
      ? topProducts.labels.map((label, index) => [
          label,
          formatCurrency(topProducts.datasets[0].data[index]),
        ])
      : [];

  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [["Product", "Revenue"]],
    body: productsData,
    margin: { left: margin },
    theme: "grid",
  });

  // AI Insights
  if (insights) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("AI-Generated Insights", margin, 20);

    const splitInsights = doc.splitTextToSize(insights, pageWidth - 2 * margin);

    doc.setFontSize(12);
    doc.text(splitInsights, margin, 35);
  }

  // Save the PDF
  const fileName = isCustomData
    ? `custom-analytics-report-${new Date().toISOString().split("T")[0]}.pdf`
    : `analytics-report-${selectedRange}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;

  doc.save(fileName);
};
