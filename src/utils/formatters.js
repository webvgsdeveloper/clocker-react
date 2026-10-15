// utils/formatters.js

export const formatDuration = (minutes) => {
  if (minutes === null || minutes === 0) return "0 min";
  if (minutes < 60) {
    const roundedMin = Number(parseFloat(minutes).toFixed(2));
    return `${roundedMin} min`;
  }
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = Number((minutes % 60).toFixed(2));

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
};

// Formatear fecha
export const formatDateTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatSecondsToTime = (totalSeconds, forceHours = false) => {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0 || forceHours) {
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const toInputDateTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export const toIsoDateTime = (localString) => {
  if (!localString) return null;
  const date = new Date(localString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

