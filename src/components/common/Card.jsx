// components/common/Card.jsx
import React from "react";

const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-vgswhite rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
