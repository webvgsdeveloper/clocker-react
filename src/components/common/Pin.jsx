// src/components/common/Pin.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Pin = ({
  color = "red",
  size = "md",
  position = "top-right",
  ping = true,
  icon = null,
  className = "",
  children,
}) => {
  const sizeMap = {
    xs: "h-2 w-2",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const positionMap = {
    "top-right": "top-0 right-0 -mr-1 -mt-1",
    "top-left": "top-0 left-0 -ml-1 -mt-1",
    "bottom-right": "bottom-0 right-0 -mr-1 -mb-1",
    "bottom-left": "bottom-0 left-0 -ml-1 -mb-1",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  const colorMap = {
    red: { main: "bg-vgsred/50", ping: "bg-vgsred" },
  };

  const selectedSize = sizeMap[size] || sizeMap.md;
  const selectedPosition = positionMap[position] || positionMap["top-right"];
  const selectedColor = colorMap[color] || colorMap.sky;

  return (
    <span
      className={`absolute flex ${selectedPosition} ${selectedSize} ${className}`}
    >
      {ping && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${selectedColor.ping} opacity-75`}
        ></span>
      )}
      <span
        className={`relative inline-flex items-center justify-center rounded-full h-full w-full ${selectedColor.main} text-white font-bold leading-none`}
      >
        {children ? (
          <span
            className={
              size === "xs" || size === "sm" ? "text-[8px]" : "text-[10px]"
            }
          >
            {children}
          </span>
        ) : (
          icon && (
            <FontAwesomeIcon
              icon={icon}
              className={
                size === "xs" || size === "sm" ? "text-[8px]" : "text-[10px]"
              }
            />
          )
        )}
      </span>
    </span>
  );
};

export default Pin;
