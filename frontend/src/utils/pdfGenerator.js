import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatCurrency } from "./formatCurrency";

const getDateRange = (range) => {
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

export const generateAnalyticsPDF = async (data) => {
  const { rangeStats, salesTrends, topProducts, insights, selectedRange } =
    data;
  const doc = new jsPDF();
  const { startDate, endDate } = getDateRange(selectedRange);

  // Set page margins
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(20);
  doc.text("Analytics Report", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text(
    `Period: ${selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)}`,
    105,
    25,
    { align: "center" }
  );
  doc.setFontSize(10);
  doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, 105, 35, {
    align: "center",
  });

  // Stats Summary
  doc.setFontSize(14);
  doc.text("Summary Statistics", margin, 45);
  doc.setFontSize(10);
  const stats = [
    ["Transactions", rangeStats?.transactionCount?.toLocaleString() || "0"],
    ["Revenue", formatCurrency(rangeStats?.totalAmount || 0)],
    ["Active Users", rangeStats?.uniqueUsers?.toLocaleString() || "0"],
  ];
  doc.autoTable({
    startY: 50,
    head: [["Metric", "Value"]],
    body: stats,
    theme: "grid",
  });

  // Sales Trends Chart
  if (salesTrends?.labels?.length) {
    doc.setFontSize(14);
    doc.text("Sales Trends", margin, doc.lastAutoTable.finalY + 15);

    // Get the canvas element and convert to image
    const salesCanvas = document.querySelector("#salesTrendsChart canvas");
    if (salesCanvas) {
      const salesChartImage = salesCanvas.toDataURL("image/png");
      doc.addImage(
        salesChartImage,
        "PNG",
        margin - 4,
        doc.lastAutoTable.finalY + 20,
        190,
        80
      );
    }
  }

  // Top Products Chart and Table
  if (topProducts?.labels?.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Top Products", margin, 20);

    // Add Top Products Chart
    const productsCanvas = document.querySelector("#topProductsChart canvas");
    if (productsCanvas) {
      const productsChartImage = productsCanvas.toDataURL("image/png");
      doc.addImage(productsChartImage, "PNG", margin - 4, 30, 190, 80);
    }

    // Add Top Products Table
    doc.setFontSize(10);
    const productsData = topProducts.labels.map((label, index) => [
      label,
      formatCurrency(topProducts.datasets[0].data[index]),
    ]);
    doc.autoTable({
      startY: 120,
      head: [["Product", "Revenue"]],
      body: productsData,
      theme: "grid",
      margin: { left: margin, right: margin },
    });
  }

  // AI Insights
  if (insights) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("AI-Generated Insights", margin, 20);
    doc.setFontSize(10);

    // Process insights text
    // const insightsText = String(insights).replace(/\n/g, " \n"); // Add extra spacing between paragraphs and ensure string
    const contentWidthSafe = contentWidth - 40; // Even more conservative margin
    const splitInsights = doc.splitTextToSize(insights, contentWidthSafe); // More conservative width

    // Calculate lines per page and handle pagination
    const lineHeight = 5;
    const startY = 30;
    const maxY = doc.internal.pageSize.height - margin;
    const linesPerPage = Math.floor((maxY - startY) / lineHeight);

    // Calculate total pages needed
    const totalPages = Math.ceil(splitInsights.length / linesPerPage);

    // Add text page by page
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        doc.addPage();
      }

      const startIndex = pageNum * linesPerPage;
      const endIndex = Math.min(
        (pageNum + 1) * linesPerPage,
        splitInsights.length
      );
      const pageLines = splitInsights.slice(startIndex, endIndex);

      // Add each line with proper spacing
      pageLines.forEach((line, idx) => {
        const yPos = startY + idx * lineHeight;
        if (yPos < maxY) {
          // Only add text if it fits on the page
          // Ensure the line is properly wrapped
          const wrappedLine = doc.splitTextToSize(
            String(line),
            contentWidthSafe
          );
          doc.text(wrappedLine, margin, yPos);
        }
      });
    }
  }

  // Save the PDF
  doc.save(
    `analytics-report-${selectedRange}-${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
};
