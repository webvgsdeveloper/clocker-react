// src/components/common/ConfirmationBox.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ConfirmationBox = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description,
  icon = null,
  confirmIcon = null,
  confirmIconClassName = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = null,
  className = null,
  loading = false,
}) => {
  const variants = {
    online: {
      iconBg: "bg-green-500",
      iconColor: "text-vgswhite",
      btnVariant: "green",
      border: "border-green-500",
    },
    break: {
      iconBg: "bg-yellow-500",
      iconColor: "text-vgswhite",
      btnVariant: "yellow",
      border: "border-yellow-500",
    },
    lunch: {
      iconBg: "bg-orange-500",
      iconColor: "text-vgswhite",
      btnVariant: "orange",
      border: "border-orange-500",
    },
    brb: {
      iconBg: "bg-purple-500",
      iconColor: "text-vgswhite",
      btnVariant: "purple",
      border: "border-purple-500",
    },
    rec: {
      iconBg: "bg-vgsred",
      iconColor: "text-vgswhite",
      btnVariant: "red",
      border: "border-vgsred",
    },
    coaching: {
      iconBg: "bg-pink-500",
      iconColor: "text-vgswhite",
      btnVariant: "pink",
      border: "border-pink-500",
    },
    team_meeting: {
      iconBg: "bg-cyan-600",
      iconColor: "text-vgswhite",
      btnVariant: "cyan",
      border: "border-cyan-600",
    },
    away: {
      iconBg: "bg-vgsblack",
      iconColor: "text-vgswhite",
      btnVariant: "black",
      border: "border-vgsblack",
    },
    blue: {
      iconBg: "bg-blue-100",
      iconColor: "text-vgsdarkblue",
      btnVariant: "blue",
      border: "border-vgsdarkblue",
    },
    white: {
      iconBg: "bg-gray-100",
      iconColor: "text-vgsblack",
      btnVariant: "gray",
      border: "border-gray-300",
    },
  };

  const config = className || variants[variant] || variants.blue;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-vgsblack/60 backdrop-blur-sm pointer-events-auto"
            onClick={loading ? null : onClose}
          />
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`
              relative bg-vgswhite rounded-xl shadow-2xl w-full max-w-md overflow-hidden 
              pointer-events-auto border-t-4 ${config.border}
              select-none cursor-default
            `}
          >
            <div className="p-6 cursor-grab active:cursor-grabbing">
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg}`}
                >
                  <FontAwesomeIcon
                    icon={icon || config.icon}
                    className={`text-xl ${config.iconColor}`}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-vgsblack leading-none">
                    {title}
                  </h3>
                  {description && (
                    <p className="mt-2 text-sm text-gray-500">{description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className=" border-t border-dotted border-vgsgray px-6 py-4 flex flex-row-reverse gap-3">
              <Button
                onClick={onConfirm}
                variant={config.btnVariant}
                icon={confirmIcon}
                iconClassName={confirmIconClassName}
                disabled={loading}
                className="px-6"
                animation="translate gradient"
              >
                {loading ? "Processing..." : confirmText}
              </Button>
              <Button
                onClick={onClose}
                variant="gray"
                disabled={loading}
                className="px-6"
                animation="translate"
              >
                {cancelText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationBox;
