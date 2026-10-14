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
