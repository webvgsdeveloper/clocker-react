// src/components/reports/analyticsConfig.js

export const RELEVANT_STATUSES = [
  "break",
  "lunch",
  "brb",
  "rec",
  "coaching",
  "team_meeting",
];

export const STATUS_TO_TREMOR_COLOR = {
  break: "yellow",
  lunch: "orange",
  brb: "purple",
  rec: "red",
  coaching: "indigo",
  team_meeting: "cyan",
  online: "green",
};

export const formatAxisValue = (value, isPayroll = false) => {
  if (!value || value === 0) return "";
  if (isPayroll) return `${Math.round(value)}h`;
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(value)}m`;
};

export const getFirstName = (name) => (name ? name.trim().split(" ")[0] : "User");

export const KPI_COLOR_MAP = {
  green: {
    border: "border-t-green-500",
    text: "text-green-600",
  },
  red: {
    border: "border-t-red-500",
    text: "text-red-600",
  },
  blue: {
    border: "border-t-blue-500",
    text: "text-blue-600",
  },
  teal: {
    border: "border-t-teal-500",
    text: "text-teal-600",
  },
};
