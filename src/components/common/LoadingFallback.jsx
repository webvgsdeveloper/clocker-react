// src/components/common/LoadingFallback.jsx
import { useEffect, useId } from "react";
import { useNotification } from "../../contexts/NotificationContext";

const LoadingFallback = ({ 
  title = "Loading", 
  message = "Please wait...", 
  _type = "loading",
  height = "350px",
  showNotification = true 
}) => {
  const { showLoading, hideLoading } = useNotification();
  
  // Generamos un ID único y estable para esta instancia de carga
  const loaderId = useId();

  useEffect(() => {
    if (showNotification) {
      showLoading(loaderId, title, message);
    }
    return () => {
      if (showNotification) {
        hideLoading(loaderId);
      }
    };
  }, [loaderId, showLoading, hideLoading, showNotification, title, message]);

  return (
    <div 
      className="flex flex-col items-center justify-center bg-white p-6 rounded-xl border border-vgsgray/10 w-full shadow-sm"
      style={{ height: height }}
    >
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-vgsdarkblue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-vgsdarkblue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-vgsdarkblue rounded-full animate-bounce"></div>
      </div>
      <p className="mt-4 text-[10px] font-bold text-vgsgray tracking-widest uppercase opacity-60">
        {message}
      </p>
    </div>
  );
};

export default LoadingFallback;