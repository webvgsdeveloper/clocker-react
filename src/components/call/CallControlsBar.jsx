// src/components/call/CallControlsBar.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhoneSlash,
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faDisplay,
} from "@fortawesome/free-solid-svg-icons";

const CallControlsBar = ({
  isMinimized,
  toggleMute,
  isMuted,
  callType,
  toggleVideo,
  isCamOff,
  callStatus,
  handleToggleScreenShare,
  isScreenSharing,
  endCall,
}) => {
  return (
    <footer
      className={`${
        isMinimized
          ? "p-2 bg-gray-900/95 border-t border-white/10"
          : "p-4 sm:p-6"
      } flex justify-center items-center shrink-0 z-20`}
    >
      <div
        className={`${
          isMinimized
            ? "flex items-center gap-3"
            : "bg-gray-900/95 backdrop-blur-xl border border-white/15 px-6 sm:px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 sm:gap-5"
        }`}
      >
        {/* Microphone Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className={`${
            isMinimized
              ? "w-9 h-9 text-xs"
              : "w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg"
          } rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isMuted
              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
          title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          <FontAwesomeIcon icon={isMuted ? faMicrophoneSlash : faMicrophone} />
        </button>

        {/* Camera Toggle (Video Calls only) */}
        {callType === "video" && (
          <button
            type="button"
            onClick={toggleVideo}
            className={`${
              isMinimized
                ? "w-9 h-9 text-xs"
                : "w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg"
            } rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isCamOff
                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={isCamOff ? "Activar cámara" : "Apagar cámara"}
          >
            <FontAwesomeIcon icon={isCamOff ? faVideoSlash : faVideo} />
          </button>
        )}

        {/* Screen Sharing Toggle (Active Video Calls only, hidden when minimized) */}
        {callType === "video" && callStatus === "active" && !isMinimized && (
          <button
            type="button"
            onClick={handleToggleScreenShare}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg transition-all active:scale-95 bg-white/10 hover:bg-white/20 text-white"
            title={
              isScreenSharing
                ? "Detener compartir pantalla"
                : "Compartir tu pantalla"
            }
          >
            <FontAwesomeIcon
              icon={faDisplay}
              className={isScreenSharing ? "text-blue-400" : "text-white"}
            />
          </button>
        )}

        {/* Hang Up Button (Colgar) */}
        <button
          type="button"
          onClick={endCall}
          className={`${
            isMinimized
              ? "w-9 h-9 rounded-full text-xs"
              : "h-12 sm:h-14 px-6 sm:px-8 rounded-full text-sm sm:text-base gap-2.5"
          } bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center shadow-xl shadow-red-600/40 active:scale-95 transition-all`}
          title="Finalizar la llamada"
        >
          <FontAwesomeIcon icon={faPhoneSlash} />
          {!isMinimized && <span className="hidden sm:inline">Colgar</span>}
        </button>
      </div>
    </footer>
  );
};

export default CallControlsBar;
