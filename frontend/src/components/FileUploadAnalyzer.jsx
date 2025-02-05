import { useState } from "react";
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { useDispatch } from "react-redux";
import { analyzeUploadedData } from "../store/slices/analyticsSlice";

const FileUploadAnalyzer = ({ onAnalysisComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  const processFile = async (file) => {
    try {
      setIsUploading(true);
      setError("");

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate the data structure
          if (!validateTransactionData(jsonData)) {
            setError(
              "Invalid file format. Please ensure your file contains the required columns."
            );
            return;
          }

          // Dispatch the data for analysis
          const result = await dispatch(analyzeUploadedData(jsonData)).unwrap();
          onAnalysisComplete(result);
          setError("");
        } catch (error) {
          setError(
            "Error processing file. Please ensure it's a valid Excel or CSV file."
          );
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setError("Error reading file.");
    } finally {
      setIsUploading(false);
    }
  };

  const validateTransactionData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;

    // Define required columns
    const requiredColumns = [
      "transaction_date",
      "amount",
      "product_name",
      // Add other required columns based on your needs
    ];

    // Check if first row contains all required columns
    const firstRow = data[0];
    return requiredColumns.every((column) =>
      Object.keys(firstRow).some((key) =>
        key.toLowerCase().includes(column.toLowerCase())
      )
    );
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (isValidFileType(selectedFile)) {
        await processFile(selectedFile);
      } else {
        setError("Please upload an Excel (.xlsx, .xls) or CSV file.");
      }
    }
  };

  const isValidFileType = (file) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "text/csv", // csv
    ];
    return validTypes.includes(file.type);
  };

  return (
    <>
      <label htmlFor="file-upload" className="relative">
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          onClick={(e) => (e.target.value = null)}
        />
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading}
          onClick={() => document.getElementById("file-upload").click()}
        >
          {isUploading ? (
            <>
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
              Processing...
            </>
          ) : (
            <>
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Custom Data
            </>
          )}
        </button>
      </label>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </>
  );
};

export default FileUploadAnalyzer;
