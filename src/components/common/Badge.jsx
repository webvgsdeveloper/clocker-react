// components/common/Badge.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Badge = ({
  children,
  variant = "blue",
  size = "md",
  rounded = "full",
  outline = false,
  icon = null,
  iconPosition = "left",
  iconSize = null,
  href = null,
  onClick,
  className = "",
  title = "",
  ...props
}) => {

  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all capitalize";

  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px] gap-1",
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-sm gap-1.5",
    lg: "px-3 py-1.5 text-base gap-1.5",
    xl: "px-4 py-2 text-lg gap-2",
    "2xl": "px-5 py-2.5 text-xl gap-2.5",
    "3xl": "px-6 py-3 text-2xl gap-3",
    "4xl": "px-8 py-4 text-4xl gap-4",
  };

  const iconSizesMap = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl",
    "3xl": "text-2xl",
    "4xl": "text-4xl",
  };

  const finalIconSize = iconSize || iconSizesMap[size] || "text-current";

  const rounding = {
    full: "rounded-full",
    md: "rounded-md",
    none: "rounded-none",
  };

  const variants = {
    green: outline
      ? "border border-green-600 text-green-500"
      : "bg-green-500 text-vgswhite",
    gray: outline
      ? "border border-vgsgray/20 text-vgsblack"
      : "bg-vgsgray/20 text-vgsblack",
    red: outline
      ? "border border-vgsred text-vgsred"
      : "bg-vgsred/90 text-vgswhite",
    blue: outline
      ? "border border-vgsdarkblue text-vgsdarkblue"
      : "bg-vgsdarkblue/20 text-vgsdarkblue",
    purple: outline
      ? "border border-purple-600 text-purple-600"
      : "bg-purple-100 text-purple-800",
    teal: outline ? "border border-teal-600 text-teal-600": "bg-teal-600 text-vgswhite",
    none: outline
      ? "text-vgsgray border border-vgsgray/30" : "text-vgsgray",
  };

  const interactionStyles =
    href || onClick
      ? "cursor-pointer hover:opacity-80 active:scale-95"
      : "cursor-default";

  const combinedClasses = `
    ${baseStyles} 
    ${sizes[size]} 
    ${rounding[rounded]} 
    ${variants[variant] || variants.blue} 
    ${interactionStyles} 
    ${className}
  `.trim();

  const Component = href ? "a" : "span";

  const renderIcon = () => (
    <FontAwesomeIcon 
      icon={icon} 
      className={finalIconSize} 
    />
  );

  return (
    <Component
      href={href}
      onClick={onClick}
      className={combinedClasses}
      title={title}
      {...props}
    >
      {icon && iconPosition === "left" && renderIcon()}
      
      {children}

      {icon && iconPosition === "right" && renderIcon()}
    </Component>
  );
};

export default Badge;
