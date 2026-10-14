import React from "react";

const Image = ({
  src,
  alt = "Image",
  title,
  className = "",
  onClick,
  fallback = "images/no-profile-photo.webp",
}) => {
  const API_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3000";

  const getImageUrl = () => {
    if (!src) return fallback;

    if (src.startsWith("http") || src.startsWith("blob:")) {
      return src;
    }

    if (src.startsWith("/uploads")) {
      return `${API_URL}${src}`;
    }

    return src;
  };

  return (
    <img
      src={getImageUrl()}
      alt={alt}
      title={title || alt}
      className={`object-cover ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      onError={(e) => {
        if (e.target.src !== window.location.origin + fallback) {
          e.target.src = fallback;
        }
      }}
    />
  );
};

export default Image;
