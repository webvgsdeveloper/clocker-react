// src/components/events/MeetingRoom.jsx
import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useMeeting } from "../../contexts/MeetingContext";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Image from "../common/Image";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faDisplay,
  faPhoneSlash,
  faUsers,
  faCopy,
  faCheck,
  faExpand,
  faCompress,
  faCrown,
  faXmark,
  faHeadset,
  faThumbtack,
  faTableCellsLarge,
  faTableColumns,
  faWindowMaximize,
} from "@fortawesome/free-solid-svg-icons";

// Sub-component: Persistent Remote Audio Stream
// Always remains mounted in DOM so audio is never cut off when switching layouts or minimizing
const RemoteAudioStream = memo(({ stream, isAudioMuted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      muted={Boolean(isAudioMuted)}
      className="hidden"
    />
  );
});

RemoteAudioStream.displayName = "RemoteAudioStream";

// Sub-component: Individual Remote Video Tile
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
    }, [peer.stream]);

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
        } ${isMainStage ? "w-full h-full min-h-[280px]" : "w-full h-full min-h-[140px]"}`}
      >
        {/* Video Element (Muted because persistent audio stream plays remote sound) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={true}
          className={`w-full h-full ${
            peer.is_sharing ? "object-contain bg-black" : "object-cover"
          } ${hasVideoTrack ? "block" : "hidden"}`}
        />

        {/* Avatar Fallback if camera is off */}
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
              className={`mt-2.5 font-semibold text-white/90 text-center truncate max-w-[180px] ${
                isMainStage ? "text-sm sm:text-base" : "text-xs"
              }`}
            >
              {peer.name || "Participante"}
            </span>
          </div>
        )}

        {/* Pin / Unpin Button on Hover */}
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

        {/* Peer Info Overlay */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs text-white max-w-[85%]">
          <span className="font-medium truncate">
            {peer.name || "Participante"}
          </span>
          {peer.is_host && (
            <span className="bg-yellow-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
              <FontAwesomeIcon icon={faCrown} /> Host
            </span>
          )}
          {peer.is_audio_muted && (
            <FontAwesomeIcon
              icon={faMicrophoneSlash}
              className="text-red-400 text-xs shrink-0"
              title="Micrófono silenciado"
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

// Sub-component: Local Video Tile
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
        localVideoRef.current.muted = true; // Always mute own video to prevent feedback
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
        } ${isMainStage ? "w-full h-full min-h-[280px]" : "w-full h-full min-h-[140px]"}`}
      >
        {/* Local Video Stream */}
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

        {/* Local Avatar Fallback */}
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
              className={`mt-2.5 font-semibold text-white/90 text-center truncate max-w-[180px] ${
                isMainStage ? "text-sm sm:text-base" : "text-xs"
              }`}
            >
              {user?.nombre} (Tú)
            </span>
          </div>
        )}

        {/* Pin / Unpin Button on Hover */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin("local");
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

        {/* Local User Badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs text-white max-w-[85%]">
          <span className="font-semibold text-vgswhite">Tú</span>
          {isHost && (
            <span className="bg-yellow-500 text-black font-bold text-[9px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
              <FontAwesomeIcon icon={faCrown} /> Host
            </span>
          )}
          {isAudioMuted && (
            <FontAwesomeIcon
              icon={faMicrophoneSlash}
              className="text-red-400 text-xs shrink-0"
              title="Tu micrófono está silenciado"
            />
          )}
        </div>

        {isScreenSharing && (
          <div className="absolute top-2.5 right-2.5 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-md z-10">
            <FontAwesomeIcon icon={faDisplay} /> Tu Pantalla
          </div>
        )}
      </motion.div>
    );
  }
);

LocalVideoTile.displayName = "LocalVideoTile";

// Main Meeting Room Component
const MeetingRoom = () => {
  const { user } = useAuth();
  const {
    activeMeeting,
    isJoined,
    isJoining,
    isMinimized,
    localStream,
    remotePeers,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    leaveMeeting,
    endMeetingForAll,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    setIsMinimized,
  } = useMeeting();

  const [copied, setCopied] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Layout mode: 'grid' | 'sidebar' | 'spotlight'
  const [layoutMode, setLayoutMode] = useState("grid");
  // pinnedPeerId: null | 'local' | socket_id
  const [pinnedPeerId, setPinnedPeerId] = useState(null);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);

  // Call timer counter
  useEffect(() => {
    if (!isJoined) {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((sec) => sec + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isJoined]);

  const peersList = useMemo(() => Object.values(remotePeers), [remotePeers]);
  const totalParticipants = peersList.length + 1;

  // Auto-focus on peer who is sharing screen (unless user manually pinned someone else)
  useEffect(() => {
    const sharingPeer = peersList.find((p) => p.is_sharing);
    if (sharingPeer) {
      if (!pinnedPeerId) {
        setPinnedPeerId(sharingPeer.socket_id);
        setLayoutMode((prev) => (prev === "grid" ? "sidebar" : prev));
      }
    }
  }, [peersList, pinnedPeerId]);

  // Determine active focus target
  const activeFocusPeerId = useMemo(() => {
    if (pinnedPeerId) return pinnedPeerId;
    const sharingPeer = peersList.find((p) => p.is_sharing);
    if (sharingPeer) return sharingPeer.socket_id;
    if (peersList.length > 0) return peersList[0].socket_id;
    return "local";
  }, [pinnedPeerId, peersList]);

  const focusedPeer = useMemo(() => {
    if (activeFocusPeerId === "local") return null;
    return (
      remotePeers[activeFocusPeerId] ||
      peersList.find((p) => p.socket_id === activeFocusPeerId) ||
      peersList[0] ||
      null
    );
  }, [activeFocusPeerId, remotePeers, peersList]);

  const isLocalFocused =
    activeFocusPeerId === "local" || (!focusedPeer && peersList.length === 0);

  const handleTogglePin = (targetId) => {
    if (pinnedPeerId === targetId) {
      setPinnedPeerId(null);
    } else {
      setPinnedPeerId(targetId);
      if (layoutMode === "grid") {
        setLayoutMode("sidebar");
      }
    }
  };

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    if (!activeMeeting?.meetingCode) return;
    navigator.clipboard.writeText(activeMeeting.meetingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeMeeting || (!isJoined && !isJoining)) {
    return null;
  }

  // Connecting screen
  if (isJoining && !isJoined) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
        <div className="w-14 h-14 rounded-full border-4 border-vgsdarkblue border-t-transparent animate-spin mb-4" />
        <h3 className="text-base font-bold text-white">
          Conectando a la reunión...
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Accediendo a cámara y micrófono
        </p>
      </div>
    );
  }

  // Determine grid template classes based on participant count
  const getGridCols = () => {
    if (totalParticipants === 1) return "grid-cols-1 max-w-2xl";
    if (totalParticipants === 2) return "grid-cols-1 sm:grid-cols-2 max-w-4xl";
    if (totalParticipants <= 4) return "grid-cols-1 sm:grid-cols-2 max-w-5xl";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl";
  };

  const allowScreenShare =
    activeMeeting.settings?.allow_screen_share !== false;

  return (
    <>
      {/* Persistent Remote Audio Streams - ALWAYS mounted in DOM to prevent audio drops on layout change or minimize */}
      <div className="hidden" aria-hidden="true">
        {peersList.map((peer) => (
          <RemoteAudioStream
            key={peer.socket_id}
            stream={peer.stream}
            isAudioMuted={peer.is_audio_muted}
          />
        ))}
      </div>

      {/* Minimized Picture-in-Picture Floating View */}
      {isMinimized ? (
        <motion.div
          drag
          dragMomentum={false}
          className="fixed bottom-6 right-6 z-[10000] w-84 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none"
        >
          {/* Minimized Header */}
          <header className="p-3 bg-gray-800/80 flex items-center justify-between border-b border-white/10 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-white truncate max-w-[140px]">
                {focusedPeer?.is_sharing
                  ? `[Pantalla] ${focusedPeer.name}`
                  : focusedPeer
                  ? focusedPeer.name
                  : activeMeeting.event?.title || "Reunión Clocker"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="transparent"
                size="xs"
                icon={faExpand}
                onClick={() => setIsMinimized(false)}
                className="text-white/80 hover:text-white p-1 text-xs"
                title="Maximizar"
              />
              <Button
                type="button"
                variant="transparent"
                size="xs"
                icon={faPhoneSlash}
                onClick={leaveMeeting}
                className="text-red-400 hover:text-red-300 p-1 text-xs"
                title="Salir"
              />
            </div>
          </header>

          {/* Minimized Video / Tile (Displays focused or pinned peer) */}
          <div className="h-48 relative bg-black flex items-center justify-center overflow-hidden">
            {!isLocalFocused && focusedPeer ? (
              <RemoteVideoTile
                peer={focusedPeer}
                isPinned={pinnedPeerId === focusedPeer.socket_id}
                onTogglePin={handleTogglePin}
              />
            ) : (
              <LocalVideoTile
                localStream={localStream}
                isAudioMuted={isAudioMuted}
                isVideoOff={isVideoOff}
                isScreenSharing={isScreenSharing}
                user={user}
                isHost={activeMeeting.isHost}
                isPinned={pinnedPeerId === "local"}
                onTogglePin={handleTogglePin}
              />
            )}
          </div>

          {/* Minimized Quick Controls */}
          <footer className="p-2.5 bg-gray-950 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant={isAudioMuted ? "red" : "gray"}
              size="xs"
              animation="shrink"
              icon={isAudioMuted ? faMicrophoneSlash : faMicrophone}
              onClick={toggleAudio}
              className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
            />
            <Button
              type="button"
              variant={isVideoOff ? "red" : "gray"}
              size="xs"
              animation="shrink"
              icon={isVideoOff ? faVideoSlash : faVideo}
              onClick={toggleVideo}
              className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
            />
            <Button
              type="button"
              variant="blue"
              size="xs"
              animation="shrink"
              icon={faExpand}
              onClick={() => setIsMinimized(false)}
              className="px-2.5 py-1 text-[11px] font-bold"
            >
              Abrir Sala ({totalParticipants})
            </Button>
          </footer>
        </motion.div>
      ) : (
        /* Full Screen / Expanded Interactive Meeting Room */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-vgsgray text-white flex flex-col overflow-hidden font-sans"
          >
            {/* Top Meeting Header - Stacked with z-50 so dropdown menus are ALWAYS above video tiles */}
            <header className="h-16 px-4 sm:px-6 bg-vgsred backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 relative z-50">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-vgswhite animate-pulse shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-md">
                    {activeMeeting.event?.title || "Reunión Grupal"}
                  </h2>
                </div>

                <Badge
                  variant="red"
                  size="xs"
                  icon={
                    activeMeeting.meetingType === "video" ? faVideo : faHeadset
                  }
                  className="hidden md:inline-flex uppercase font-bold"
                >
                  {activeMeeting.meetingType === "video"
                    ? "Videollamada"
                    : "Sala de Audio"}
                </Badge>

                <span className="text-xs text-vgswhite px-2.5 py-1 rounded-lg">
                  {formatTimer(callDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Meeting Code Badge & Copy */}
                <button
                  onClick={handleCopyCode}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-vgsred hover:bg-black/70 transition-colors border border-vgswhite rounded-xl text-xs"
                  title="Copiar código de reunión"
                >
                  <span>{activeMeeting.meetingCode}</span>
                  <FontAwesomeIcon
                    icon={copied ? faCheck : faCopy}
                    className={copied ? "text-green-400" : "text-vgsgray"}
                  />
                </button>

                {/* Layout Selector Dropdown */}
                <div className="relative">
                  <Button
                    type="button"
                    variant="white"
                    size="sm"
                    icon={
                      layoutMode === "grid"
                        ? faTableCellsLarge
                        : layoutMode === "sidebar"
                        ? faTableColumns
                        : faWindowMaximize
                    }
                    onClick={() => setIsLayoutMenuOpen((prev) => !prev)}
                    className="px-2.5 py-1.5 text-xs"
                    title="Cambiar diseño"
                  >
                    <span className="hidden lg:inline">
                      {layoutMode === "grid"
                        ? "Cuadrícula"
                        : layoutMode === "sidebar"
                        ? "Barra lateral"
                        : "Foco"}
                    </span>
                  </Button>

                  <AnimatePresence>
                    {isLayoutMenuOpen && (
                      <>
                        {/* Backdrop to close menu */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsLayoutMenuOpen(false)}
                        />
                        {/* Menu Pop-in Spring animation */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                          }}
                          className="absolute right-0 mt-2 w-48 bg-vgsblack backdrop-blur-xl border border-vgswhite/20 rounded-2xl shadow-2xl p-2 z-50 space-y-1 ring-1 ring-black/50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setLayoutMode("grid");
                              setIsLayoutMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              layoutMode === "grid"
                                ? "bg-vgsdarkblue text-white shadow-sm"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faTableCellsLarge}
                              className="w-4"
                            />
                            <span>Cuadrícula</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLayoutMode("sidebar");
                              setIsLayoutMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              layoutMode === "sidebar"
                                ? "bg-vgsblue text-white shadow-sm"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faTableColumns}
                              className="w-4"
                            />
                            <span>Barra lateral</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLayoutMode("spotlight");
                              setIsLayoutMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              layoutMode === "spotlight"
                                ? "bg-vgsblue text-white shadow-sm"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faWindowMaximize}
                              className="w-4"
                            />
                            <span>Foco principal</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Minimize button */}
                <Button
                  type="button"
                  variant="white"
                  size="sm"
                  icon={faCompress}
                  onClick={() => setIsMinimized(true)}
                  className="p-2 text-sm"
                  title="Minimizar (Modo Flotante)"
                />

                {/* Participants list toggle */}
                <Button
                  type="button"
                  variant={showParticipants ? "blue" : "white"}
                  size="sm"
                  icon={faUsers}
                  onClick={() => setShowParticipants((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold gap-1.5"
                >
                  <span>{totalParticipants}</span>
                </Button>
              </div>
            </header>

            {/* Main Content Area: Smooth Animated Layouts with LayoutGroup */}
            <main className="flex-1 flex overflow-hidden relative">
              <LayoutGroup id="meeting-room-layout">
                {/* 1. GRID LAYOUT */}
                {layoutMode === "grid" && (
                  <motion.div
                    key="grid-layout-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 p-4 sm:p-6 overflow-y-auto flex items-center justify-center custom-scrollbar"
                  >
                    <motion.div
                      layout
                      className={`grid gap-4 w-full h-full max-h-[82vh] ${getGridCols()}`}
                    >
                      <LocalVideoTile
                        localStream={localStream}
                        isAudioMuted={isAudioMuted}
                        isVideoOff={isVideoOff}
                        isScreenSharing={isScreenSharing}
                        user={user}
                        isHost={activeMeeting.isHost}
                        isPinned={pinnedPeerId === "local"}
                        onTogglePin={handleTogglePin}
                      />

                      {peersList.map((peer) => (
                        <RemoteVideoTile
                          key={peer.socket_id}
                          peer={peer}
                          isPinned={pinnedPeerId === peer.socket_id}
                          onTogglePin={handleTogglePin}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {/* 2. SIDEBAR / FILMSTRIP LAYOUT */}
                {layoutMode === "sidebar" && (
                  <motion.div
                    key="sidebar-layout-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 sm:p-4 gap-3"
                  >
                    {/* Main Stage: Fluidly scaled from the pinned tile */}
                    <div className="flex-1 h-full min-h-[50vh] flex items-center justify-center overflow-hidden">
                      {isLocalFocused ? (
                        <LocalVideoTile
                          localStream={localStream}
                          isAudioMuted={isAudioMuted}
                          isVideoOff={isVideoOff}
                          isScreenSharing={isScreenSharing}
                          user={user}
                          isHost={activeMeeting.isHost}
                          isPinned={pinnedPeerId === "local"}
                          onTogglePin={handleTogglePin}
                          isMainStage={true}
                        />
                      ) : focusedPeer ? (
                        <RemoteVideoTile
                          peer={focusedPeer}
                          isPinned={pinnedPeerId === focusedPeer.socket_id}
                          onTogglePin={handleTogglePin}
                          isMainStage={true}
                        />
                      ) : null}
                    </div>

                    {/* Filmstrip Rail: Fluid thumbnails */}
                    <div className="w-full md:w-64 xl:w-72 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto p-1 custom-scrollbar shrink-0 max-h-44 md:max-h-full">
                      {!isLocalFocused && (
                        <div className="w-48 md:w-full h-32 md:h-40 shrink-0">
                          <LocalVideoTile
                            localStream={localStream}
                            isAudioMuted={isAudioMuted}
                            isVideoOff={isVideoOff}
                            isScreenSharing={isScreenSharing}
                            user={user}
                            isHost={activeMeeting.isHost}
                            isPinned={pinnedPeerId === "local"}
                            onTogglePin={handleTogglePin}
                          />
                        </div>
                      )}

                      {peersList
                        .filter(
                          (p) =>
                            isLocalFocused ||
                            p.socket_id !== focusedPeer?.socket_id
                        )
                        .map((peer) => (
                          <div
                            key={peer.socket_id}
                            className="w-48 md:w-full h-32 md:h-40 shrink-0"
                          >
                            <RemoteVideoTile
                              peer={peer}
                              isPinned={pinnedPeerId === peer.socket_id}
                              onTogglePin={handleTogglePin}
                            />
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. SPOTLIGHT LAYOUT */}
                {layoutMode === "spotlight" && (
                  <motion.div
                    key="spotlight-layout-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-1 relative p-3 sm:p-4 flex items-center justify-center overflow-hidden"
                  >
                    {/* Main Spotlight Stage */}
                    <div className="w-full h-full flex items-center justify-center">
                      {isLocalFocused ? (
                        <LocalVideoTile
                          localStream={localStream}
                          isAudioMuted={isAudioMuted}
                          isVideoOff={isVideoOff}
                          isScreenSharing={isScreenSharing}
                          user={user}
                          isHost={activeMeeting.isHost}
                          isPinned={pinnedPeerId === "local"}
                          onTogglePin={handleTogglePin}
                          isMainStage={true}
                        />
                      ) : focusedPeer ? (
                        <RemoteVideoTile
                          peer={focusedPeer}
                          isPinned={pinnedPeerId === focusedPeer.socket_id}
                          onTogglePin={handleTogglePin}
                          isMainStage={true}
                        />
                      ) : null}
                    </div>

                    {/* Corner Picture-in-Picture for self/secondary view */}
                    {!isLocalFocused && (
                      <div className="absolute bottom-6 right-6 w-44 sm:w-56 h-28 sm:h-36 shadow-2xl rounded-2xl overflow-hidden border-2 border-white/20 z-10">
                        <LocalVideoTile
                          localStream={localStream}
                          isAudioMuted={isAudioMuted}
                          isVideoOff={isVideoOff}
                          isScreenSharing={isScreenSharing}
                          user={user}
                          isHost={activeMeeting.isHost}
                          isPinned={pinnedPeerId === "local"}
                          onTogglePin={handleTogglePin}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </LayoutGroup>

              {/* Participants Sidebar Drawer */}
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
                        <FontAwesomeIcon
                          icon={faUsers}
                          className="text-vgsblue"
                        />
                        Participantes ({totalParticipants})
                      </h3>
                      <Button
                        type="button"
                        variant="transparent"
                        icon={faXmark}
                        onClick={() => setShowParticipants(false)}
                        className="text-gray-400 hover:text-white p-1 text-sm"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto py-4 space-y-2.5 custom-scrollbar">
                      {/* Local User */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-800/60 border border-white/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Image
                            src={api.getFileUrl(
                              user?.profile_picture,
                              user?.nombre
                            )}
                            alt={user?.nombre}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {user?.nombre} (Tú)
                            </p>
                            {activeMeeting.isHost && (
                              <span className="text-[10px] text-yellow-400 font-semibold">
                                Anfitrión
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePin("local")}
                            className={`p-1 text-xs transition-colors ${
                              pinnedPeerId === "local"
                                ? "text-vgsblue font-bold"
                                : "text-gray-400 hover:text-white"
                            }`}
                            title={
                              pinnedPeerId === "local"
                                ? "Desfijar"
                                : "Fijar en pantalla"
                            }
                          >
                            <FontAwesomeIcon icon={faThumbtack} />
                          </button>
                          <FontAwesomeIcon
                            icon={
                              isAudioMuted ? faMicrophoneSlash : faMicrophone
                            }
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
                              src={api.getFileUrl(
                                peer.profile_picture,
                                peer.name
                              )}
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
                              onClick={() => handleTogglePin(peer.socket_id)}
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
                              icon={
                                peer.is_audio_muted
                                  ? faMicrophoneSlash
                                  : faMicrophone
                              }
                              className={`text-xs ${
                                peer.is_audio_muted
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invite Info in Sidebar */}
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
                          onClick={handleCopyCode}
                          className="text-xs text-gray-300 hover:text-white"
                        >
                          {copied ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Floating Controls Bar */}
            <footer className="h-20 bg-gray-900/95 backdrop-blur-md border-t border-white/10 px-6 flex items-center justify-center shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Microphone Toggle */}
                <Button
                  type="button"
                  variant={isAudioMuted ? "red" : "gray"}
                  animation="shrink"
                  icon={isAudioMuted ? faMicrophoneSlash : faMicrophone}
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full p-0 flex items-center justify-center text-lg ${
                    isAudioMuted
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  }`}
                  title={
                    isAudioMuted ? "Activar micrófono" : "Silenciar micrófono"
                  }
                />

                {/* Camera Toggle */}
                <Button
                  type="button"
                  variant={isVideoOff ? "red" : "gray"}
                  animation="shrink"
                  icon={isVideoOff ? faVideoSlash : faVideo}
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full p-0 flex items-center justify-center text-lg ${
                    isVideoOff
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  }`}
                  title={isVideoOff ? "Encender cámara" : "Apagar cámara"}
                />

                {/* Screen Share (if allowed) */}
                {allowScreenShare && (
                  <Button
                    type="button"
                    variant={isScreenSharing ? "blue" : "gray"}
                    animation="shrink"
                    icon={faDisplay}
                    onClick={
                      isScreenSharing ? stopScreenShare : startScreenShare
                    }
                    className={`w-12 h-12 rounded-full p-0 flex items-center justify-center text-lg ${
                      isScreenSharing
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                    title={
                      isScreenSharing
                        ? "Dejar de compartir pantalla"
                        : "Compartir pantalla"
                    }
                  />
                )}

                {/* End Call / Leave Meeting */}
                <div className="flex items-center gap-2 pl-2 sm:pl-4 border-l border-white/15">
                  <Button
                    type="button"
                    variant="red"
                    animation="shrink"
                    icon={faPhoneSlash}
                    onClick={leaveMeeting}
                    className="px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  >
                    Salir
                  </Button>

                  {/* Host option: End for all */}
                  {activeMeeting.isHost && (
                    <Button
                      type="button"
                      variant="transparent"
                      animation="shrink"
                      onClick={endMeetingForAll}
                      className="hidden sm:inline-flex px-3 py-2 text-xs text-red-400 hover:text-red-300 font-semibold underline"
                      title="Finalizar reunión para todos los participantes"
                    >
                      Finalizar para todos
                    </Button>
                  )}
                </div>
              </div>
            </footer>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
};

export default MeetingRoom;
