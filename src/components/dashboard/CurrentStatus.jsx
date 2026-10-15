// src/components/dashboard/CurrentStatus.jsx
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { STATUS_CONFIG } from "../layout/statusConfig";

const CurrentStatus = ({ status, lastUpdate }) => {
  // Configuración de los badges
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.default;
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    if (!lastUpdate) return;

    const calculateElapsed = () => {
      const startTime = new Date(lastUpdate).getTime();
      const now = new Date().getTime();
      const difference = now - startTime;
      if (difference < 0) {
        setElapsedTime("00:00:00");
        return;
      }
      const totalSeconds = Math.floor(difference / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const formatted = [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
      ].join(":");
      setElapsedTime(formatted);
    };
    calculateElapsed();
    const timer = setInterval(calculateElapsed, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  return (
    <div className="text-center py-4">
      <div
        className={`mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full border-4 ${config.classes}`}
      >
        <FontAwesomeIcon icon={config.icon} className="text-4xl" />
      </div>

      <h3 className="text-sm font-bold text-vgsblack uppercase tracking-widest mb-2">
        Current Status
      </h3>

      <div
        className={`inline-block px-6 py-2 rounded-full text-xl font-black border shadow-sm ${config.classes} uppercase tracking-wider`}
      >
        {config.label}
      </div>

      <p className="mt-4 text-vgsblack font-medium italic">
        "{config.description}"
      </p>

      {lastUpdate && (
        <div className="flex flex-col gap-y-3 mt-8 pt-4 border-t border-vgsgray text-vgsgray">
          <div className="flex justify-center items-center gap-x-2">
            <p className="text-xs font-bold uppercase tracking-widest">
              Current Time
            </p>
            <p className="text-lg font-black text-vgsblack">{elapsedTime}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Last status change
            </p>
            <p className="text-xs font-mono">
              {new Date(lastUpdate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentStatus;
