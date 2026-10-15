// src/components/reports/EmptyChartState.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@fortawesome/free-solid-svg-icons";

const EmptyChartState = ({ message = "No data available for this period" }) => (
  <div className="h-80 flex flex-col items-center justify-center text-vgsgray/50 gap-3 border-2 border-dashed border-vgsgray/10 rounded-xl mt-6">
    <FontAwesomeIcon icon={faInbox} size="2xl" />
    <p className="text-sm font-medium uppercase tracking-wider">{message}</p>
  </div>
);

export default EmptyChartState;
