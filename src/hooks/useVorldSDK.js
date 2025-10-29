// ✅ src/hooks/useVorldSDK.js
import { useEffect, useState } from "react";

export default function useVorldSDK(appId) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Vorld is already fully loaded and ready
    const checkVorldReady = () => {
      return window.Vorld && window.Vorld.auth && window.Vorld.auth.connect;
    };

    // If already ready
    if (checkVorldReady()) {
      console.log("✅ Vorld SDK already loaded and ready");
      setIsLoaded(true);
      setIsReady(true);
      return;
    }

    const initializeSDK = async () => {
      try {
        // If SDK script is loaded but auth might not be ready yet
        if (window.Vorld && !checkVorldReady()) {
          console.log("🔄 Waiting for Vorld auth to be ready...");
          // Wait a bit more for auth to initialize
          const maxWaitTime = 5000; // 5 seconds max
          const startTime = Date.now();
          
          const waitForAuth = () => {
            return new Promise((resolve, reject) => {
              const check = () => {
                if (checkVorldReady()) {
                  resolve(true);
                } else if (Date.now() - startTime > maxWaitTime) {
                  reject(new Error("Vorld auth initialization timeout"));
                } else {
                  setTimeout(check, 100);
                }
              };
              check();
            });
          };
          
          await waitForAuth();
          setIsReady(true);
          setIsLoaded(true);
          return;
        }

        // Create script tag dynamically if not present
        if (!document.querySelector('script[src*="vorld.min.js"]')) {
          const script = document.createElement("script");
          script.src = "https://cdn.thevorld.com/sdk/v1/vorld.min.js";
          script.async = true;

          script.onload = () => {
            console.log("✅ Vorld SDK script loaded successfully");
            
            // Wait for Vorld.auth to be available
            const waitForAuth = () => {
              const maxWaitTime = 5000;
              const startTime = Date.now();
              
              const check = () => {
                if (checkVorldReady()) {
                  console.log("✅ Vorld auth is ready!");
                  setIsReady(true);
                  setIsLoaded(true);
                } else if (Date.now() - startTime > maxWaitTime) {
                  console.error("❌ Vorld auth initialization timeout");
                  setError("Vorld auth failed to initialize");
                } else {
                  setTimeout(check, 100);
                }
              };
              check();
            };
            
            waitForAuth();
          };

          script.onerror = () => {
            console.error("❌ Failed to load Vorld SDK script");
            setError("Failed to load Vorld SDK");
          };

          document.body.appendChild(script);
        }
      } catch (err) {
        console.error("❌ Vorld SDK initialization error:", err);
        setError(err.message);
      }
    };

    initializeSDK();
  }, [appId]);

  return { isLoaded: isReady, error };
}