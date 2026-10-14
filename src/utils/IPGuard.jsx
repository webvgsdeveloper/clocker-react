// src/components/IPGuard.jsx
import { useState, useEffect } from "react";

const rawAllowedIps = import.meta.env.VITE_ALLOWED_IPS || "";
const ALLOWED_IPS = rawAllowedIps
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const ALLOW_ALL = ALLOWED_IPS.includes("*") || ALLOWED_IPS.length === 0;
const IS_DEV = import.meta.env.DEV || window.location.hostname === "localhost";

const IPGuard = ({ children }) => {
  const [status, setStatus] = useState(IS_DEV || ALLOW_ALL ? "granted" : "loading");

  useEffect(() => {
    if (status === "granted") return;

    const checkIP = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        if (ALLOWED_IPS.includes(data.ip)) {
          setStatus("granted");
        } else {
          console.error("Access denied for IP:", data.ip);
          setStatus("denied");
        }
      } catch (error) {
        console.error("Validation error:", error);
        setStatus("denied");
      }
    };

    checkIP();
  }, [status]);

  if (status === "granted") return children;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-vgsblack px-4 text-vgswhite">
      <div className="text-center">
        {status === "loading" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-vgsgray border-t-vgsred"></div>
            <p className="text-lg font-medium tracking-wide animate-pulse">
              Verifying access...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-vgsred md:text-6xl">
              403
            </h1>
            <h2 className="text-xl font-bold tracking-none md:text-2xl">
              Restricted Access
            </h2>
            <p className="text-sm text-vgsgray">
              You are not authorized to access this application. Please contact the administrator if you believe this is an error.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPGuard;