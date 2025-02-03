import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { handleScanProduct } from "../store/slices/scannerSlice";

const useScanner = () => {
  const dispatch = useDispatch();
  const [barcode, setBarcode] = useState("");
  const [lastScanned, setLastScanned] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Scanner settings
  const SCANNER_TIMEOUT = 100; // Time between keystrokes (ms)
  const MIN_BARCODE_LENGTH = 5; // Minimum barcode length

  const handleScan = useCallback(async () => {
    if (barcode.length >= MIN_BARCODE_LENGTH) {
      console.log("barcode", barcode);
      try {
        await dispatch(handleScanProduct(barcode)).unwrap();
        // Play success sound
        const audio = new Audio("/scanner-beep.mp3");
        audio.play();
      } catch (error) {
        console.error("Scan failed:", error);
        // Play error sound
        const errorAudio = new Audio("/error-beep.mp3");
        errorAudio.play();
      }
    }
    setBarcode("");
    setIsTyping(false);
  }, [barcode, dispatch]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignore if the target is an input element
      if (event.target.tagName === "INPUT") {
        return;
      }

      const currentTime = new Date().getTime();

      // If it's a number key or Enter
      if (/^\d$/.test(event.key) || event.key === "Enter") {
        event.preventDefault();

        // If it's been too long since the last keystroke, start a new barcode
        if (!lastScanned || currentTime - lastScanned > 500) {
          setBarcode(event.key === "Enter" ? "" : event.key);
          setIsTyping(true);
        }
        // If we're in the middle of scanning
        else if (currentTime - lastScanned < SCANNER_TIMEOUT || isTyping) {
          if (event.key === "Enter") {
            handleScan();
          } else {
            setBarcode((prev) => prev + event.key);
          }
        }

        setLastScanned(currentTime);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lastScanned, handleScan, isTyping]);

  // Reset typing state if no keystrokes for a while
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setBarcode("");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isTyping, barcode]);

  return {
    barcode,
    setBarcode,
    handleScan,
    isTyping,
  };
};

export default useScanner;
