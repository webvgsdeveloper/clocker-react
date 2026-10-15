// src/components/common/StatusBadge.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { STATUS_CONFIG } from "../layout/statusConfig";

const StatusBadge = ({ status, className = "" }) => {
  let normalizedStatus = status ? status.trim().toLowerCase() : "offline";
  if (normalizedStatus === "meeting" || normalizedStatus === "team") {
    normalizedStatus = "team_meeting";
  }
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.default;
  return (
    <div
      className={`px-3 py-1 rounded-full text-[10px] font-bold border ${config.classes} tracking-wider flex items-center gap-2 w-fit shadow-sm uppercase ${className}`}
    >
      <FontAwesomeIcon icon={config.icon} />
      <span>{config.label}</span>
    </div>
  );
};

export default StatusBadge;
