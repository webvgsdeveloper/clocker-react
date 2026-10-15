import { useEffect, useState, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faTimes,
  faComments,
  faRobot,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

const TOAST_CONFIG = {
  success: {
    icon: faCheckCircle,
    textColor: "text-vgsblack",
    borderColor: "border-vgsblack",
    bgColor: "bg-vgsblack/10",
    barColor: "bg-vgsblack",
    animation: "animate-toast-in",
  },
  error: {
    icon: faExclamationCircle,
    textColor: "text-vgsred",
    borderColor: "border-vgsred",
    bgColor: "bg-vgsred/10",
    barColor: "bg-vgsred",
    animation: "animate-toast-shake",
  },
  warning: {
    icon: faExclamationTriangle,
    textColor: "text-orange-500",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-500/10",
    barColor: "bg-orange-500",
    animation: "animate-toast-in",
  },
  info: {
    icon: faInfoCircle,
    textColor: "text-vgsgray",
    borderColor: "border-vgsgray",
    bgColor: "bg-vgsgray/10",
    barColor: "bg-vgsgray",
    animation: "animate-toast-in",
  },
  chat: {
    icon: faComments,
    textColor: "text-vgsdarkblue",
    borderColor: "border-vgsdarkblue",
    bgColor: "bg-vgsdarkblue/10",
    barColor: "bg-vgsdarkblue",
    animation: "animate-toast-flip",
  },
  ai: {
    icon: faRobot,
    textColor: "text-vgspurple",
    borderColor: "border-vgspurple",
    bgColor: "bg-vgspurple/10",
    barColor: "bg-vgspurple",
    animation: "animate-toast-in",
  },
  loading: {
    icon: faSpinner,
    textColor: "text-vgsdarkblue",
    borderColor: "border-vgsdarkblue",
    bgColor: "bg-vgsdarkblue/10",
    barColor: "bg-vgsdarkblue",
    animation: "animate-toast-in",
    spin: true,
  },
};

const Toast = ({
  id,
  title,
  message,
  type = "info",
  onClose,
  streaming = false,
  isPreview = false,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [displayText, setDisplayText] = useState(streaming ? "" : message);

  const config = useMemo(() => TOAST_CONFIG[type] || TOAST_CONFIG.info, [type]);

  useEffect(() => {
    if (!isPreview && type !== "loading") {
      const audio = new Audio("sounds/noty.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }, [isPreview, type]);

  useEffect(() => {
    if (streaming && message) {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayText(message.slice(0, index));
        index++;
        if (index > message.length) clearInterval(interval);
      }, 3000 / message.length);
      return () => clearInterval(interval);
    } else {
      setDisplayText(message);
    }
  }, [streaming, message]);

  const handleClose = useCallback(() => {
    if (isPreview) return;
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  }, [isPreview, onClose, id]);

  useEffect(() => {
    if (!isPreview && type !== "loading") {
      const timer = setTimeout(() => handleClose(), 10000);
      return () => clearTimeout(timer);
    }
  }, [isPreview, type, handleClose]);

  return (
    <div
      className={`
        relative flex items-center gap-3 w-85 p-4 mb-3
        bg-white/90 backdrop-blur-md border border-gray-100
        rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        overflow-hidden group border-l-4
        ${config.borderColor} 
        ${isExiting ? "animate-toast-out" : isPreview ? "" : config.animation}
      `}
    >
      <div
        className={`
          shrink-0 w-10 h-10 flex items-center justify-center rounded-lg 
          transition-transform group-hover:scale-110
          ${config.textColor} ${config.bgColor}
        `}
      >
        <FontAwesomeIcon
          icon={config.icon}
          className="text-lg"
          spin={config.spin}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-vgsblack leading-tight">
          {title || "Notification Title"}
        </h4>
        <p className="text-[11px] text-vgsgray mt-0.5 leading-relaxed">
          {displayText || "Message content..."}
          {streaming && displayText.length < message.length && (
            <span
              className={`inline-block w-1 h-3 ml-1 animate-pulse ${config.barColor}`}
            />
          )}
        </p>
      </div>

      <button
        onClick={handleClose}
        className={`shrink-0 p-1.5 text-vgsgray hover:text-vgsred hover:bg-gray-50 rounded-md transition-all ${isPreview ? "opacity-30 cursor-default" : ""}`}
      >
        <FontAwesomeIcon icon={faTimes} size="sm" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-black/5">
        <div
          className={`h-full origin-left ${isPreview || type === "loading" ? "w-full" : "animate-progress-bar"} ${config.barColor}`}
        />
      </div>
    </div>
  );
};

export default Toast;
