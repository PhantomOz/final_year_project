import { usePWA } from "../hooks/usePWA";

export const PWAInstallButton = () => {
  const { isInstallable, installPWA } = usePWA();

  if (!isInstallable) return null;

  return (
    <button
      onClick={installPWA}
      className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
    >
      Install App
    </button>
  );
};
