// src/components/common/Input.jsx
import React, { forwardRef, useId, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

const Input = forwardRef(
  (
    {
      label,
      icon,
      iconPosition = "left",
      onIconClick,
      error,
      variant = "default",
      className = "",
      containerClassName = "",
      fullWidth = true,
      type = "text",
      options = [],
      children,
      id,
      animate = false,
      isFocused: externalIsFocused,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(
      !!(props.value || props.defaultValue),
    );
    useEffect(() => {
      setHasValue(!!(props.value || props.defaultValue));
    }, [props.value, props.defaultValue]);

    const baseInputStyles =
      "block w-full transition-all duration-200 outline-none focus:ring-2 appearance-none";

    const variants = {
      default:
        "border border-vgsgray/50 bg-vgswhite focus:border-vgsgray focus:ring-vgsgray/20 rounded-lg",
      filled:
        "border-transparent bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-200 rounded-lg",
      outline:
        "border-2 border-blue-500 bg-transparent focus:ring-blue-100 rounded-lg",
      underlined:
        "border-b-2 border-gray-300 bg-transparent focus:border-blue-500 rounded-none px-0",
    };

    const errorStyles = error
      ? "border-red-500 focus:border-red-500 focus:ring-red-100"
      : "";

    const getHorizontalPadding = () => {
      if (icon && iconPosition === "left") return "pl-10";
      return "pl-3";
    };

    const sharedClasses = `
      ${baseInputStyles}
      ${variants[variant]}
      ${errorStyles}
      ${getHorizontalPadding()}
      ${icon && iconPosition === "right" ? "pr-10" : "pr-3"}
      ${animate ? "pt-6 pb-2" : "py-2"} 
      text-vgsblack placeholder-vgsgray
      ${className}
    `;

    const handleFocus = (e) => {
      setIsFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      const val = e?.target?.value;
      if (val !== undefined) setHasValue(!!val);
      if (props.onBlur) props.onBlur(e);
    };
    const handleChange = (e) => {
      const val = e?.target ? e.target.value : e;
      setHasValue(!!val);
      if (props.onChange) props.onChange(e);
    };

    const isFloating = isFocused || hasValue || type === "select";
    const labelLeftPos = icon && iconPosition === "left" ? "2.5rem" : "0.75rem";

    const effectiveIsFocused = externalIsFocused !== undefined ? externalIsFocused : isFocused;

    return (
      <div
        className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName} relative`}
      >
        {label && !animate && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-medium text-vgsblack cursor-pointer"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {label && animate && (
            <motion.label
              htmlFor={inputId}
              initial={false}
              animate={{
                y: isFloating ? -14 : 0,
                scale: isFloating ? 0.85 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`absolute pointer-events-none z-20 origin-top-left transition-colors duration-300 ${
                effectiveIsFocused ? "text-vgsdarkblue font-bold" : "text-vgsgray"
              }`}
              style={{ left: labelLeftPos }}
            >
              {label}
            </motion.label>
          )}

          {icon && (
            <div
              onClick={onIconClick}
              className={`absolute ${iconPosition === "left" ? "left-3" : "right-3"} text-vgsgray cursor-pointer z-10`}
            >
              <FontAwesomeIcon icon={icon} />
            </div>
          )}

          {type === "select" ? (
            <select
              id={inputId}
              ref={ref}
              className={sharedClasses}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              {...props}
            >
              {children
                ? children
                : options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
            </select>
          ) : children ? (
            <div className="w-full" id={inputId}>
              {React.cloneElement(children, {
                onFocus: (e) => {
                  handleFocus(e);
                  if (children.props.onFocus) children.props.onFocus(e);
                },
                onBlur: (e) => {
                  handleBlur(e);
                  if (children.props.onBlur) children.props.onBlur(e);
                },
                onChange: (e) => {
                  handleChange(e);
                  if (children.props.onChange) children.props.onChange(e);
                },
              })}
            </div>
          ) : (
            <input
              id={inputId}
              ref={ref}
              type={type}
              className={sharedClasses}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleChange}
              {...props}
              placeholder={animate && !isFloating ? "" : props.placeholder}
            />
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
