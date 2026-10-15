// src/components/call/IncomingCallModal.jsx
import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faPhoneSlash, faVideo } from "@fortawesome/free-solid-svg-icons";
import Button from "../common/Button";
import Image from "../common/Image";
import api from "../../services/api";

const IncomingCallModal = ({
  callerInfo,
  callType,
  acceptCall,
  rejectCall,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-6 right-6 z-10005 pointer-events-auto"
    >
      <div className="bg-gray-900/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-5 w-84 text-white flex flex-col items-center">
        <div className="relative mb-3">
          <Image
            src={api.getFileUrl(callerInfo?.avatar, callerInfo?.name)}
            alt={callerInfo?.name || "Usuario"}
            className="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg"
          />
          <span className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-md flex items-center justify-center animate-bounce">
            <FontAwesomeIcon
              icon={callType === "video" ? faVideo : faPhone}
              className="text-xs"
            />
          </span>
        </div>

        <h4 className="text-base font-bold truncate max-w-full text-center">
          {callerInfo?.name || "Usuario"}
        </h4>
        <p className="text-xs text-white/60 mb-4 text-center">
          {callType === "video"
            ? "Videollamada entrante..."
            : "Llamada de voz entrante..."}
        </p>

        <div className="flex gap-3 w-full">
          <Button
            variant="none"
            icon={faPhone}
            onClick={acceptCall}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Aceptar
          </Button>
          <Button
            variant="none"
            icon={faPhoneSlash}
            onClick={rejectCall}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Rechazar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default IncomingCallModal;
