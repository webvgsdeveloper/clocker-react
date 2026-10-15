// src/components/events/meeting/MeetingParticipantsDrawer.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faXmark,
  faThumbtack,
  faMicrophone,
  faMicrophoneSlash,
  faCheck,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../common/Button";
import Image from "../../common/Image";
import api from "../../../services/api";

const MeetingParticipantsDrawer = ({
  showParticipants,
  onClose,
  totalParticipants,
  user,
  activeMeeting,
  pinnedPeerId,
  onTogglePin,
  isAudioMuted,
  peersList,
  copied,
  onCopyCode,
}) => {
  return (
    <AnimatePresence>
      {showParticipants && (
        <motion.aside
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-80 bg-gray-900 border-l border-white/10 p-5 flex flex-col z-20"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} className="text-vgsblue" />
              Participantes ({totalParticipants})
            </h3>
            <Button
              type="button"
              variant="transparent"
              icon={faXmark}
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-2.5 custom-scrollbar">
            {/* Local User */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/60 border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Image
                  src={api.getFileUrl(user?.profile_picture, user?.nombre)}
                  alt={user?.nombre}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.nombre} (Tú)
                  </p>
                  {activeMeeting?.isHost && (
                    <span className="text-[10px] text-yellow-400 font-semibold">
                      Anfitrión
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePin("local")}
                  className={`p-1 text-xs transition-colors ${
                    pinnedPeerId === "local"
                      ? "text-vgsblue font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={pinnedPeerId === "local" ? "Desfijar" : "Fijar en pantalla"}
                >
                  <FontAwesomeIcon icon={faThumbtack} />
                </button>
                <FontAwesomeIcon
                  icon={isAudioMuted ? faMicrophoneSlash : faMicrophone}
                  className={`text-xs ${
                    isAudioMuted ? "text-red-400" : "text-green-400"
                  }`}
                />
              </div>
            </div>

            {/* Remote Peers */}
            {peersList.map((peer) => (
              <div
                key={peer.socket_id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/40 border border-white/5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Image
                    src={api.getFileUrl(peer.profile_picture, peer.name)}
                    alt={peer.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">
                      {peer.name || "Participante"}
                    </p>
                    {peer.is_host && (
                      <span className="text-[10px] text-yellow-400 font-semibold">
                        Anfitrión
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTogglePin(peer.socket_id)}
                    className={`p-1 text-xs transition-colors ${
                      pinnedPeerId === peer.socket_id
                        ? "text-vgsblue font-bold"
                        : "text-gray-400 hover:text-white"
                    }`}
                    title={
                      pinnedPeerId === peer.socket_id
                        ? "Desfijar"
                        : "Fijar en pantalla"
                    }
                  >
                    <FontAwesomeIcon icon={faThumbtack} />
                  </button>
                  <FontAwesomeIcon
                    icon={peer.is_audio_muted ? faMicrophoneSlash : faMicrophone}
                    className={`text-xs ${
                      peer.is_audio_muted ? "text-red-400" : "text-green-400"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Invite Info in Sidebar */}
          {activeMeeting?.meetingCode && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-xs text-gray-400">
                Comparte este código para que otros puedan unirse:
              </p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-800 border border-white/10">
                <span className="font-mono text-sm font-bold text-vgsblue">
                  {activeMeeting.meetingCode}
                </span>
                <Button
                  type="button"
                  variant="transparent"
                  size="xs"
                  icon={copied ? faCheck : faCopy}
                  onClick={onCopyCode}
                  className="text-xs text-gray-300 hover:text-white"
                >
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default MeetingParticipantsDrawer;
