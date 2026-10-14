// components/common/Button.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

const Button = ({
  children,
  onClick,
  variant = "blue",
  disabled,
  className = "",
  tittle = "",
  type = "button",
  icon = null,
  iconPosition = "left",
  iconClassName = "",
  animation = null,
  entranceAnimation = null,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center cursor-pointer px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none gap-2";

  const variants = {
    blue: "bg-vgsdarkblue text-vgswhite focus:ring-vgsdarkblue disabled:bg-vgsdarkblue focus:ring-2 focus:ring-offset-2",
    green: "bg-green-500 text-vgswhite hover:bg-green-600 focus:ring-green-600 disabled:bg-green-100 focus:ring-2 focus:ring-offset-2",
    yellow: "bg-yellow-500 text-vgswhite hover:bg-yellow-600 focus:ring-yellow-600 disabled:bg-yellow-100 focus:ring-2 focus:ring-offset-2",
    orange: "bg-orange-500 text-vgswhite hover:bg-orange-600 focus:ring-orange-600 disabled:bg-orange-100 focus:ring-2 focus:ring-offset-2",
    purple: "bg-purple-500 text-vgswhite hover:bg-purple-600 focus:ring-purple-600 disabled:bg-purple-100 focus:ring-2 focus:ring-offset-2",
    pink: "bg-pink-500 text-vgswhite hover:bg-pink-600 focus:ring-pink-600 disabled:bg-pink-100 focus:ring-2 focus:ring-offset-2",
    cyan: "bg-cyan-600 text-vgswhite hover:bg-cyan-700 focus:ring-cyan-600 disabled:bg-cyan-100 focus:ring-2 focus:ring-offset-2",
    gray: "bg-vgsgray/20 text-vgsblack hover:bg-vgsgray/40 focus:ring-vgsgray disabled:bg-vgsgray/50 focus:ring-2 focus:ring-offset-2",
    black: "bg-vgsblack text-vgswhite hover:bg-vgsblack/70 focus:ring-vgsblack disabled:bg-vgsblack/50 focus:ring-2 focus:ring-offset-2",
    white: "bg-vgswhite text-vgsdarkblue hover:bg-vgsgray/20 focus:ring-vgsgray/99 disabled:bg-vgsgray/99 focus:ring-2 focus:ring-offset-2",
    red: "bg-vgsred text-vgswhite hover:bg-vgsred/70 focus:ring-vgsred disabled:bg-vgsred/60 focus:ring-2 focus:ring-offset-2",
    transparent: "bg-transparent text-vgsblack hover:bg-vgsgray/20 disabled:bg-transparent text-sm",
    active: "bg-vgsdarkblue text-vgswhite text-sm focus:ring-vgsdarkblue focus:ring-2 focus:ring-offset-2",
  };

  const animations = {
    grow: "hover:scale-105",
    shrink: "hover:scale-95",
    pulse: "hover:animate-btn-pulse",
    pop: "hover:animate-btn-pop",
    translate: "hover:-translate-y-1",
    gradient: "hover-gradient",
  };

  const getSelectedAnimations = () => {
    if (!animation) return "";
    const animArray = Array.isArray(animation) ? animation : animation.split(" ");
    return animArray.map(anim => animations[anim.trim()] || "").join(" ");
  };

  const selectedAnimations = getSelectedAnimations();

  const motionProps = entranceAnimation ? {
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    variants: entranceAnimation
  } : {};

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${selectedAnimations} ${className}`}
      title={tittle}
      {...motionProps}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <FontAwesomeIcon icon={icon} className={iconClassName} />
      )}

      {children}

      {icon && iconPosition === "right" && (
        <FontAwesomeIcon icon={icon} className={iconClassName} />
      )}
    </motion.button>
  );
};

export default Button;