// src/components/call/CallManager.jsx
import { useEffect, useRef, useState, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCall } from "../../contexts/CallContext";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Image from "../common/Image";
import {
  faPhone,
  faVideo,
  faPhoneSlash,
  faMicrophone,
  faMicrophoneSlash,
  faVideoSlash,
  faDisplay,
  faRotateRight,
  faWindowMaximize,
  faWindowMinimize,
} from "@fortawesome/free-solid-svg-icons";

// Persistent Remote Audio Stream: matches MeetingRoom.jsx exactly
const RemoteAudioStream = memo(({ stream, streamVersion, isAudioMuted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch((e) => {
        console.warn("[CallManager] Audio play error:", e);
      });
    }
  }, [stream, streamVersion]);

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

const CallManager = () => {
  const { user } = useAuth();
  const {
    callStatus,
    callType,
    callerInfo,
    stream,
    remoteStream,
    streamVersion,
    isMuted,
    isCamOff,
    isScreenSharing,
    isReconnecting,
    resumableCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    resumeCall,
    discardResumableCall,
  } = useCall();

  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const callingPreviewVideoRef = useRef(null);

  // Prevent leaving during call
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (callStatus !== "idle") {
        e.preventDefault();
        e.returnValue = "¿Seguro que deseas salir o recargar? La llamada se pausará.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [callStatus]);

  // Duration timer
  useEffect(() => {
    if (callStatus !== "active") {
      setCallDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setCallDuration((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Bind remote video stream directly (muted={true} avoids browser autoplay block)
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (videoEl && remoteStream) {
      if (videoEl.srcObject !== remoteStream) {
        videoEl.srcObject = remoteStream;
      }
      videoEl.play().catch((err) => {
        console.warn("[CallManager] Remote video play was deferred or blocked:", err);
      });
    }
  }, [remoteStream, streamVersion, callStatus]);

  // Bind local video stream in PiP
  useEffect(() => {
    const videoEl = localVideoRef.current;
    if (videoEl && stream && (callStatus === "active" || callStatus === "calling")) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch(() => {});
    }
  }, [stream, callStatus, isCamOff, isScreenSharing]);

  // Bind local stream to calling preview
  useEffect(() => {
    const videoEl = callingPreviewVideoRef.current;
    if (videoEl && stream && callStatus === "calling") {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch(() => {});
    }
  }, [stream, callStatus]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  // Check if remote video track is active (matches MeetingRoom pattern)
  const hasRemoteVideo = useMemo(() => {
    if (callType !== "video" || !remoteStream) return false;
    const tracks = remoteStream.getVideoTracks();
    return tracks.length > 0 && tracks.some((t) => t.enabled);
  }, [callType, remoteStream]);

  // Check if local video track is active
  const hasLocalVideo = useMemo(() => {
    if (isCamOff || !stream) return false;
    const tracks = stream.getVideoTracks();
    return tracks.length > 0 && tracks.some((t) => t.enabled);
  }, [isCamOff, stream]);

  return (
    <>
      {/* Persistent Remote Audio Stream: ALWAYS mounted in DOM just like MeetingRoom.jsx */}
      <RemoteAudioStream stream={remoteStream} streamVersion={streamVersion} isAudioMuted={false} />

      <AnimatePresence>
        {/* Banner: Resumable Call prompt after page reload */}
        {callStatus === "idle" && resumableCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-10005 bg-gray-900/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 w-84 text-white pointer-events-auto"
          >
            <div className="flex items-center gap-3 mb-2.5">
              <Image
                src={api.getFileUrl(
                  resumableCall.targetAvatar,
                  resumableCall.targetName,
                )}
                alt={resumableCall.targetName}
                className="w-11 h-11 rounded-full object-cover border-2 border-vgsblue"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-vgsblue tracking-wider">
                  Llamada previa detectada
                </span>
                <h5 className="text-sm font-bold truncate">
                  {resumableCall.targetName}
                </h5>
              </div>
            </div>
            <p className="text-xs text-white/70 mb-3">
              Tenías una llamada en curso antes de recargar. ¿Deseas retomarla?
            </p>
            <div className="flex gap-2">
              <Button
                variant="none"
                onClick={resumeCall}
                icon={faRotateRight}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Retomar llamada
              </Button>
              <Button
                variant="none"
                onClick={discardResumableCall}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs transition-all"
              >
                Descartar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Incoming Call Notification: Non-invasive FLOATING widget in bottom-right corner */}
        {callStatus === "receiving" && (
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
        )}

        {/* Active & Calling Screen: Unified single-mounted container that toggles between full stage and floating PiP */}
        {(callStatus === "active" || callStatus === "calling") && (
          <motion.div
            layout
            drag={isMinimized}
            dragMomentum={false}
            dragConstraints={{
              left: -(window.innerWidth - 380),
              right: 20,
              top: -(window.innerHeight - 280),
              bottom: 20,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 240 }}
            className={`fixed ${
              isMinimized
                ? "bottom-6 right-6 z-10003 w-87.5 sm:w-95 h-62.5 sm:h-67.5 rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
                : "inset-0 z-10002 w-screen h-screen rounded-none"
            } bg-gray-950 flex flex-col text-white select-none pointer-events-auto overflow-hidden`}
          >
            {/* Header Bar */}
            <header
              className={`px-4 ${
                isMinimized ? "py-2 cursor-grab active:cursor-grabbing" : "py-3.5"
              } bg-gray-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-20`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <Image
                    src={api.getFileUrl(callerInfo?.avatar, callerInfo?.name)}
                    alt={callerInfo?.name}
                    className={`${
                      isMinimized ? "w-6 h-6" : "w-9 h-9"
                    } rounded-full object-cover border border-white/20`}
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 ${
                      isMinimized ? "w-2 h-2" : "w-3 h-3"
                    } rounded-full border-2 border-gray-900 ${
                      callStatus === "active"
                        ? "bg-green-500"
                        : "bg-yellow-400 animate-ping"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-bold text-vgswhite truncate ${
                      isMinimized ? "text-xs max-w-37.5" : "text-sm max-w-50 sm:max-w-md"
                    }`}
                  >
                    {callerInfo?.name || "Contacto"}
                  </h4>
                  {!isMinimized && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-vgswhite/60">
                        {callStatus === "active"
                          ? isReconnecting
                            ? "Reconectando señal..."
                            : "En llamada 1 a 1"
                          : "Llamando..."}
                      </span>
                      {callStatus === "active" && !isReconnecting && (
                        <span className="text-[11px] font-mono text-green-400 font-bold">
                          {formatTimer(callDuration)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {isMinimized && callStatus === "active" && (
                  <span className="text-[11px] font-mono text-green-400 font-bold mr-1">
                    {formatTimer(callDuration)}
                  </span>
                )}
                <Button
                  variant="none"
                  onClick={() => setIsMinimized(!isMinimized)}
                  icon={isMinimized ? faWindowMaximize : faWindowMinimize}
                  className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title={isMinimized ? "Maximizar a pantalla completa" : "Minimizar"}
                >
                  <span className="hidden sm:inline">
                    {isMinimized ? "Maximizar" : "Minimizar"}
                  </span>
                </Button>
              </div>
            </header>

            {/* Video Viewport Stage */}
            <main className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {callStatus === "calling" ? (
                /* Dialing / Ringing Google Meet Preview */
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-radial from-gray-900 to-gray-950 p-4">
                  {callType === "video" && stream && (
                    <video
                      ref={callingPreviewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-20 filter blur-sm"
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 rounded-full bg-vgsblue/30 animate-ping" />
                      <Image
                        src={api.getFileUrl(
                          callerInfo?.avatar,
                          callerInfo?.name,
                        )}
                        alt={callerInfo?.name}
                        className={`${
                          isMinimized ? "w-16 h-16" : "w-28 h-28 sm:w-36 sm:h-36"
                        } rounded-full object-cover border-4 border-vgsblue shadow-2xl relative z-10`}
                      />
                    </div>

                    <span className="text-xs uppercase font-bold text-vgsblue tracking-widest mb-1">
                      {callType === "video" ? "Videollamada" : "Llamada de voz"}
                    </span>
                    <h2
                      className={`${
                        isMinimized ? "text-base" : "text-2xl"
                      } font-extrabold text-white mb-1`}
                    >
                      {callerInfo?.name || "Contacto"}
                    </h2>
                    <p className="text-xs text-white/70 flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                      Esperando respuesta...
                    </p>
                  </div>
                </div>
              ) : (
                /* Active Call Stage */
                <>
                  {/* Remote Video Stream: ALWAYS mounted in DOM, muted={true} so browser never blocks video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={true}
                    className={`w-full h-full ${
                      isMinimized ? "object-cover" : "object-contain bg-black"
                    } ${hasRemoteVideo ? "block" : "hidden"}`}
                  />

                  {/* Remote Avatar Fallback if camera is off */}
                  {!hasRemoteVideo && (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="relative mb-3">
                        <div
                          className={`${
                            isMinimized ? "w-16 h-16" : "w-32 h-32 sm:w-40 sm:h-40"
                          } rounded-full bg-linear-to-br from-gray-800 to-gray-900 border-4 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden`}
                        >
                          <Image
                            src={api.getFileUrl(
                              callerInfo?.avatar,
                              callerInfo?.name,
                            )}
                            alt={callerInfo?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <h3
                        className={`${
                          isMinimized ? "text-sm" : "text-xl sm:text-2xl"
                        } font-bold text-white mb-1`}
                      >
                        {callerInfo?.name || "Contacto"}
                      </h3>
                      {!isMinimized && (
                        <span className="text-xs sm:text-sm text-white/50">
                          {callType === "audio"
                            ? "Llamada de voz en curso"
                            : "Cámara desactivada"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reconnecting Overlay */}
                  {isReconnecting && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-30 p-4">
                      <div className="w-10 h-10 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin mb-3" />
                      <h4 className="text-base font-bold text-white mb-1">
                        Reconectando...
                      </h4>
                      <p className="text-xs text-white/60 text-center max-w-xs">
                        Sincronizando señal con el otro usuario.
                      </p>
                    </div>
                  )}

                  {/* Local PiP Preview Box */}
                  {callType === "video" && (
                    <motion.div
                      layout
                      className={`absolute ${
                        isMinimized
                          ? "bottom-2 right-2 w-24 aspect-video rounded-xl"
                          : "bottom-24 sm:bottom-28 right-5 sm:right-8 z-20 w-36 sm:w-56 aspect-video rounded-2xl"
                      } bg-gray-900 overflow-hidden border-2 border-white/20 shadow-2xl group`}
                    >
                      {hasLocalVideo ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full ${
                            isScreenSharing
                              ? "object-contain bg-black"
                              : "object-cover transform -scale-x-100"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 p-1.5 text-center">
                          <Image
                            src={api.getFileUrl(
                              user?.profile_picture,
                              user?.nombre,
                            )}
                            alt={user?.nombre || "Tú"}
                            className="w-7 h-7 rounded-full object-cover mb-1 border border-white/20"
                          />
                          <span className="text-[9px] text-white/60">
                            Off
                          </span>
                        </div>
                      )}

                      <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-semibold text-white/90 flex items-center gap-1">
                        {isMuted && (
                          <FontAwesomeIcon
                            icon={faMicrophoneSlash}
                            className="text-red-400 text-[8px]"
                          />
                        )}
                        <span>Tú</span>
                      </div>

                      {isScreenSharing && (
                        <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          Pantalla
                        </span>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </main>

            {/* Bottom Controls Bar */}
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
                  <FontAwesomeIcon
                    icon={isMuted ? faMicrophoneSlash : faMicrophone}
                  />
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
                    <FontAwesomeIcon
                      icon={isCamOff ? faVideoSlash : faVideo}
                    />
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallManager;
