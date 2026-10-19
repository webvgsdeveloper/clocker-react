// src/components/events/meeting/LocalVideoTile.jsx
import { useRef, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophoneSlash,
  faDisplay,
  faCrown,
  faThumbtack,
} from "@fortawesome/free-solid-svg-icons";
import Image from "../../common/Image";
import api from "../../../services/api";

const LocalVideoTile = memo(
  ({
    localStream,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    user,
    isHost,
    isPinned,
    onTogglePin,
    isMainStage = false,
  }) => {
    const localVideoRef = useRef(null);

    useEffect(() => {
      if (localVideoRef.current && localStream) {
        if (localVideoRef.current.srcObject !== localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }
    }, [localStream]);

    const hasActiveVideo = !isVideoOff && localStream;

    return (
      <motion.div
        layout
        layoutId="tile-local"
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 26,
          mass: 0.8,
        }}
        className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center border group transition-colors duration-200 ${
          isPinned ? "border-vgsblue ring-2 ring-vgsblue/50" : "border-white/10"
        } ${isMainStage ? "w-full h-full min-h-70" : "w-full h-full min-h-35"}`}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${
            isScreenSharing
              ? "object-contain bg-black"
              : "object-cover transform -scale-x-100"
          } ${hasActiveVideo ? "block" : "hidden"}`}
        />

        {!hasActiveVideo && (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative">
              <Image
                src={api.getFileUrl(user?.profile_picture, user?.nombre)}
                alt={user?.nombre}
                className={`${
                  isMainStage
                    ? "w-24 h-24 sm:w-32 sm:h-32"
                    : "w-14 h-14 sm:w-18 sm:h-18"
                } rounded-full object-cover border-2 border-vgsred shadow-md`}
              />
              {isAudioMuted && (
                <span className="absolute bottom-0 right-0 bg-red-500 text-white rounded-full p-1.5 shadow-md flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faMicrophoneSlash}
                    className="text-[10px]"
                  />
                </span>
              )}
            </div>
            <span
              className={`mt-2.5 font-semibold text-white/90 text-center truncate max-w-45 ${
                isMainStage ? "text-sm sm:text-base" : "text-xs"
              }`}
            >
              {user?.nombre} (Tú)
            </span>
          </div>
        )}

        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin("local");
            }}
            className={`absolute top-2.5 left-2.5 p-1.5 sm:p-2 rounded-xl text-xs transition-all duration-200 z-10 ${
              isPinned
                ? "bg-vgsblue text-vgswhite opacity-100 ring-2 ring-white/20"
                : "bg-vgsblack/60 text-vgswhite hover:text-vgswhite hover:bg-vgsblack opacity-0 group-hover:opacity-100"
            }`}
            title={
              isPinned
                ? "Unpin from the home screen"
                : "Pin to home screen"
            }
          >
            <FontAwesomeIcon
              icon={faThumbtack}
              className={isPinned ? "rotate-45 text-vgswhite" : ""}
            />
          </button>
        )}

        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs text-white max-w-[85%]">
          <span className="font-semibold text-vgswhite">You</span>
          {isHost && (
            <span className="bg-vgsred text-vgswhite font-bold text-[9px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
              <FontAwesomeIcon icon={faCrown} /> Host
            </span>
          )}
          {isAudioMuted && (
            <FontAwesomeIcon
              icon={faMicrophoneSlash}
              className="text-vgsred text-xs shrink-0"
              title="Mic muted"
            />
          )}
        </div>

        {isScreenSharing && (
          <div className="absolute top-2.5 right-2.5 bg-vgsdarkblue text-vgswhite text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5 font-bold z-10">
            <FontAwesomeIcon icon={faDisplay} /> Your Screen
          </div>
        )}
      </motion.div>
    );
  }
);

LocalVideoTile.displayName = "LocalVideoTile";

export default LocalVideoTile;
