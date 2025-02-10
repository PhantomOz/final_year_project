import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setScanning } from "../store/slices/scannerSlice";

const useScanner = () => {
  const [hasScanner, setHasScanner] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [buffer, setBuffer] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    let inputBuffer = "";
    let lastInputTime = Date.now();
    let scanTimer = null;

    const handleKeyPress = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastInputTime;

      // Most barcode scanners complete their input within 100ms
      if (timeDiff < 100) {
        // This is likely from a scanner due to the rapid input
        setHasScanner(true);
        inputBuffer += e.key;
        dispatch(setScanning(true));
      } else {
        // Reset buffer for new potential scan
        inputBuffer = e.key;
      }

      lastInputTime = currentTime;

      // Clear any existing timer
      if (scanTimer) {
        clearTimeout(scanTimer);
      }

      // Set a timer to process the buffer
      scanTimer = setTimeout(() => {
        if (inputBuffer.length > 5) {
          // Most barcodes are longer than 5 characters
          setBarcode(inputBuffer);
          dispatch(setScanning(false));
        }
        inputBuffer = "";
      }, 100); // Wait for 100ms after last input
    };

    const handleKeyDown = (e) => {
      // Prevent Enter key from submitting forms
      if (e.key === "Enter" && buffer.length > 0) {
        e.preventDefault();
        setBarcode(buffer);
        setBuffer("");
        dispatch(setScanning(false));
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      window.removeEventListener("keydown", handleKeyDown);
      if (scanTimer) {
        clearTimeout(scanTimer);
      }
    };
  }, [buffer, dispatch]);

  return { hasScanner, barcode, setBarcode };
};

export default useScanner;
