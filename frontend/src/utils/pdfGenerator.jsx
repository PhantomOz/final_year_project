import PropTypes from "prop-types";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
// import { formatCurrency } from "./formatCurrency";
// import ReactMarkdown from "react-markdown";

// Helper function to format currency specifically for PDF
// const formatPDFCurrency = (amount) => {
//   return `NGN ${amount?.toLocaleString("en-NG", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;
// };

// Helper function to convert markdown to plain text and fix currency symbols
// const convertMarkdownToPlainText = (markdown) => {
//   if (!markdown) return "";

//   // Convert Naira symbol to NGN
//   let text = markdown.replace(/₦/g, "NGN ");
//   text = text.replace(/NGN\s+(\d+([,.]\d+)?)/g, (match, number) => {
//     const numericValue = parseFloat(number.replace(/,/g, ""));
//     return `NGN ${numericValue.toLocaleString("en-NG", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;
//   });

//   // Remove headers
//   text = text.replace(/#{1,6}\s?/g, "");

//   // Convert bullet points
//   text = text.replace(/[-*+]\s/g, "• ");

//   // Convert numbered lists
//   text = text.replace(/\d+\.\s/g, "• ");

//   // Convert bold/italic
//   text = text.replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, "$1");

//   // Convert links
//   text = text.replace(/\[(.*?)\]\(.*?\)/g, "$1");

//   // Convert line breaks
//   text = text.replace(/\n\n/g, "\n");

//   return text;
// };

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#1a365d",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: "#2d3748",
    marginTop: 10,
  },
  dateRange: {
    fontSize: 12,
    marginBottom: 20,
    color: "#4a5568",
  },
  section: {
    marginBottom: 20,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 25,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f7fafc",
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
  },
  insights: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#2d3748",
    marginTop: 10,
    fontFamily: "Helvetica",
  },
  bullet: {
    width: 10,
    marginRight: 5,
  },
  insightParagraph: {
    marginBottom: 8,
    fontSize: 10,
  },
  insightSection: {
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 1.5,
    color: "#2d3748",
  },
  heading1: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 15,
    color: "#1a365d",
  },
  heading2: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
    color: "#2d3748",
  },
  heading3: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 10,
    color: "#4a5568",
  },
  bulletPoint: {
    marginLeft: 10,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#2d3748",
  },
  bulletContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  numberList: {
    marginLeft: 10,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#2d3748",
  },
  numberContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  number: {
    width: 20,
    fontSize: 11,
  },
  softBold: {
    fontWeight: "bold",
    fontSize: 10,
    color: "#2d3748",
  },
  chart: {
    width: "100%",
    height: 200,
    marginVertical: 10,
  },
});

// Helper function to format currency for PDF
const formatPDFCurrency = (amount) => {
  return `NGN ${amount?.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Helper function to convert currency in text
const convertCurrencyInText = (text) => {
  if (!text) return "";

  // Convert Naira symbol to NGN
  let converted = text.replace(/₦/g, "NGN ");
  return converted.replace(/NGN\s+(\d+([,.]\d+)?)/g, (match, number) => {
    const numericValue = parseFloat(number.replace(/,/g, ""));
    return `NGN ${numericValue.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  });
};

// Component to render markdown content
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];

  let listCounter = 0;

  lines.forEach((line, index) => {
    // Convert currency in the line
    line = convertCurrencyInText(line);

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <Text key={index} style={styles.heading1}>
          {line.replace("# ", "")}
        </Text>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <Text key={index} style={styles.heading2}>
          {line.replace("## ", "")}
        </Text>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <Text key={index} style={styles.heading3}>
          {line.replace("### ", "")}
        </Text>
      );
    }
    // Bullet points
    else if (line.match(/^[-*+]\s/)) {
      elements.push(
        <View key={index} style={styles.bulletContainer}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletPoint}>{line.replace(/^[-*+]\s/, "")}</Text>
        </View>
      );
    }
    // Numbered lists
    else if (line.match(/^\d+\.\s/)) {
      listCounter++;
      elements.push(
        <View key={index} style={styles.numberContainer}>
          <Text style={styles.number}>{listCounter}.</Text>
          <Text style={styles.numberList}>{line.replace(/^\d+\.\s/, "")}</Text>
        </View>
      );
    }
    // Bold
    else if (line.match(/^[*_]{1,2}(.*?)[*_]{1,2}/)) {
      elements.push(
        <Text key={index} style={styles.softBold}>
          {line.replace(/[*_]{1,2}/g, "")}
        </Text>
      );
    }
    // Regular paragraphs
    else if (line.trim()) {
      elements.push(
        <Text key={index} style={styles.paragraph}>
          {line}
        </Text>
      );
    }
    // what if the line is something like - **trust:** hdhdjd
  });

  return elements;
};

MarkdownRenderer.propTypes = {
  content: PropTypes.string,
};

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

// Add chart rendering function
const renderChart = async (chartRef) => {
  if (!chartRef.current) return null;

  // Convert chart to base64 image
  const base64Image = chartRef.current.toBase64Image();
  return base64Image;
};

// Create Document Component
export const AnalyticsReport = ({
  rangeStats,
  salesTrends,
  topProducts,
  insights,
  selectedRange,
  isCustomData,
  monthlyTrends,
  salesChartRef,
  productsChartRef,
  storeName,
  dateRange,
  fileName,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Title */}
      <Text style={styles.title}>
        {isCustomData
          ? `${fileName || "Custom"} Analytics Report`
          : `${storeName || "Store"} Analytics Report`}
      </Text>

      {/* Date Range */}
      <Text style={styles.dateRange}>
        {isCustomData
          ? `Generated on ${new Date().toLocaleDateString()}`
          : dateRange
          ? `Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
          : selectedRange === "today"
          ? `Date: ${new Date().toLocaleDateString()}`
          : `Period: ${
              selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1)
            }`}
      </Text>

      {/* Key Statistics */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Key Statistics</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Metric</Text>
            <Text style={styles.tableCell}>Value</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Total Transactions</Text>
            <Text style={styles.tableCell}>
              {rangeStats.transactionCount?.toLocaleString() || "0"}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Total Revenue</Text>
            <Text style={styles.tableCell}>
              {formatPDFCurrency(rangeStats.totalAmount || 0)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Average Transaction</Text>
            <Text style={styles.tableCell}>
              {formatPDFCurrency(
                rangeStats.totalAmount / rangeStats.transactionCount || 0
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Sales Trends */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Sales Trends</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Amount</Text>
          </View>
          {(isCustomData && monthlyTrends
            ? monthlyTrends
            : isCustomData && salesTrends
            ? salesTrends.map((trend) => ({
                date: formatExcelDate(parseFloat(trend.date)),
                amount: trend.amount,
              }))
            : salesTrends?.labels?.map((label, index) => ({
                date: label,
                amount: salesTrends.datasets[0].data[index],
              })) || []
          ).map((trend, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCell}>{trend.date}</Text>
              <Text style={styles.tableCell}>
                {formatPDFCurrency(trend.amount)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top Products */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Top Products</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Product</Text>
            <Text style={styles.tableCell}>Revenue</Text>
          </View>
          {(isCustomData && Array.isArray(topProducts)
            ? topProducts
            : topProducts?.labels?.map((label, index) => ({
                product: label,
                amount: topProducts.datasets[0].data[index],
              })) || []
          ).map((product, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCell}>
                {isCustomData ? product.product : product.product}
              </Text>
              <Text style={styles.tableCell}>
                {formatPDFCurrency(product.amount)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI Insights */}
      {insights && (
        <View style={styles.section} break>
          <Text style={styles.subtitle}>Generated Insights</Text>
          <MarkdownRenderer content={insights} />
        </View>
      )}

      {/* Sales Chart */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Sales Trends Chart</Text>
        <Image
          style={styles.chart}
          src={salesChartRef?.current?.toBase64Image()}
        />
      </View>

      {/* Products Chart */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Top Products Chart</Text>
        <Image
          style={styles.chart}
          src={productsChartRef?.current?.toBase64Image()}
        />
      </View>
    </Page>
  </Document>
);

AnalyticsReport.propTypes = {
  rangeStats: PropTypes.shape({
    transactionCount: PropTypes.number,
    totalAmount: PropTypes.number,
    averageTransactionValue: PropTypes.number,
  }).isRequired,
  salesTrends: PropTypes.object,
  topProducts: PropTypes.object,
  insights: PropTypes.string,
  selectedRange: PropTypes.string.isRequired,
  isCustomData: PropTypes.bool,
  monthlyTrends: PropTypes.array,
  salesChartRef: PropTypes.object,
  productsChartRef: PropTypes.object,
  storeName: PropTypes.string,
  dateRange: PropTypes.shape({
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
  }),
  fileName: PropTypes.string,
};

export const generateAnalyticsPDF = async (data) => {
  const blob = await pdf(<AnalyticsReport {...data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = data.isCustomData
    ? `custom-analytics-report-${new Date().toISOString().split("T")[0]}.pdf`
    : `analytics-report-${data.selectedRange}-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
