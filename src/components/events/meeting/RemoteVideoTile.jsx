// src/components/events/meeting/RemoteVideoTile.jsx
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

const RemoteVideoTile = memo(
  ({ peer, isPinned, onTogglePin, isMainStage = false }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      if (videoRef.current && peer.stream) {
        if (videoRef.current.srcObject !== peer.stream) {
          videoRef.current.srcObject = peer.stream;
        }
        videoRef.current.play().catch(() => {});
      }
    }, [peer.stream, peer.is_video_off]);

    const hasVideoTrack =
      !peer.is_video_off &&
      peer.stream &&
      peer.stream.getVideoTracks().length > 0 &&
      peer.stream.getVideoTracks().some((t) => t.enabled);

    return (
      <motion.div
        layout
        layoutId={`tile-${peer.socket_id}`}
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
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
          onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
          className={`w-full h-full ${
            peer.is_sharing ? "object-contain bg-black" : "object-cover"
          } ${hasVideoTrack ? "block" : "hidden"}`}
        />

        {!hasVideoTrack && (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="relative">
              <Image
                src={api.getFileUrl(peer.profile_picture, peer.name)}
                alt={peer.name}
                className={`${
                  isMainStage
                    ? "w-24 h-24 sm:w-32 sm:h-32"
                    : "w-14 h-14 sm:w-18 sm:h-18"
                } rounded-full object-cover border-2 border-vgsdarkblue shadow-md`}
              />
              {peer.is_audio_muted && (
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
              {peer.name || "Participante"}
            </span>
          </div>
        )}

        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(peer.socket_id);
            }}
            className={`absolute top-2.5 left-2.5 p-1.5 sm:p-2 rounded-xl text-xs transition-all duration-200 z-10 ${
              isPinned
                ? "bg-vgsblue text-white shadow-md opacity-100 ring-2 ring-white/20"
                : "bg-black/60 text-white/80 hover:text-white hover:bg-black/90 opacity-0 group-hover:opacity-100"
            }`}
            title={
              isPinned
                ? "Desfijar de la pantalla principal"
                : "Fijar en pantalla principal"
            }
          >
            <FontAwesomeIcon
              icon={faThumbtack}
              className={isPinned ? "rotate-45 text-white" : ""}
            />
          </button>
        )}

        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs text-white max-w-[85%]">
          <span className="font-medium truncate">
            {peer.name || "Participante"}
          </span>
          {peer.is_host && (
            <span className="bg-vgsred text-vgswhite font-bold text-[9px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
              <FontAwesomeIcon icon={faCrown} /> Host
            </span>
          )}
          {peer.is_audio_muted && (
            <FontAwesomeIcon
              icon={faMicrophoneSlash}
              className="text-vgsred text-xs shrink-0"
              title="Mic muted"
            />
          )}
        </div>

        {peer.is_sharing && (
          <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-md z-10">
            <FontAwesomeIcon icon={faDisplay} /> Pantalla
          </div>
        )}
      </motion.div>
    );
  }
);

RemoteVideoTile.displayName = "RemoteVideoTile";

export default RemoteVideoTile;
