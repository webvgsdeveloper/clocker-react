// src/components/reports/AnalyticsTooltip.jsx
import React from "react";
import { motion } from "framer-motion";
import { tooltipVariants } from "../common/animations";
import StatusBadge from "../common/StatusBadge";
import { formatDuration } from "../../utils/formatters.js";

const AnalyticsTooltip = ({ payload, active, label, isPayroll = false }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <motion.div
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-y-1 min-w-50 w-52 p-3 rounded-md border border-vgsgray border-dashed bg-vgswhite shadow-lg z-50"
    >
      <div className="border-b border-vgsgray/20 pb-1 mb-1">
        <p className="text-[10px] font-bold text-vgsblack uppercase tracking-tight">
          {data.fullName || label}
        </p>
        {data.dateLabel && (
          <p className="text-[9px] text-vgsgray">{data.dateLabel}</p>
        )}
      </div>
      {payload.map((category, idx) => {
        if (category.value <= 0) return null;

        const cleanStatus = isPayroll
          ? "online"
          : category.dataKey.replace("_usage", "").replace("_overrate", "");

        const count = data[`${cleanStatus}_count`] || 0;

        return (
          <div
            key={idx}
            className="w-full flex gap-x-2 text-xs font-bold items-center"
          >
            <span className="text-vgsgray font-mono min-w-3.75">{count}</span>
            <StatusBadge status={cleanStatus} />
            <p className="ml-auto text-vgsgray font-mono">
              {formatDuration(isPayroll ? category.value * 60 : category.value)}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
};

export default AnalyticsTooltip;
