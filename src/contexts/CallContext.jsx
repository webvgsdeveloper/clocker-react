import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";

export const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:stun.cloudflare.com:3478" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const SESSION_STORAGE_KEY = "clocker_active_call";

const resolveUserId = (id) => {
  if (id === null || id === undefined) return null;
  const num = Number(id);
  return isNaN(num) ? id : num;
};

export const CallProvider = ({ children }) => {
  const { socket, user } = useAuth();
  const { addNotification } = useNotification();

  const [callStatus, setCallStatus] = useState("idle");
  const [callType, setCallType] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);

  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [streamVersion, setStreamVersion] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [resumableCall, setResumableCall] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 60000) {
          return parsed;
        }
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (_err) {
      // Storage read or JSON parsing failed
    }
    return null;
  });

  const incomingAudio = useRef(new Audio("/sounds/incoming call.mp3"));
  const outgoingAudio = useRef(new Audio("/sounds/outcalling call.mp3"));

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const activeRemoteUserIdRef = useRef(null);
  const activeCallRoomIdRef = useRef(null);
  const iceCandidatesQueue = useRef([]);

  const callStatusRef = useRef(callStatus);
  const callerInfoRef = useRef(callerInfo);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    callerInfoRef.current = callerInfo;
  }, [callerInfo]);

  useEffect(() => {
    const audioIn = incomingAudio.current;
    const audioOut = outgoingAudio.current;
    audioIn.loop = true;
    audioOut.loop = true;

    return () => {
      audioIn.pause();
      audioOut.pause();
    };
  }, []);

  useEffect(() => {
    const stopAllSounds = () => {
      incomingAudio.current.pause();
      incomingAudio.current.currentTime = 0;
      outgoingAudio.current.pause();
      outgoingAudio.current.currentTime = 0;
    };

    switch (callStatus) {
      case "receiving":
        stopAllSounds();
        incomingAudio.current.play().catch(() => {});
        break;

      case "calling":
        stopAllSounds();
        outgoingAudio.current.play().catch(() => {});
        break;

      case "active":
      case "idle":
      default:
        stopAllSounds();
        break;
    }
  }, [callStatus]);

  const saveActiveCallSession = useCallback(
    (targetUserId, targetName, cType, targetAvatar, callRoomId) => {
      try {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            targetUserId: resolveUserId(targetUserId),
            targetName,
            targetAvatar,
            callType: cType,
            callRoomId,
            timestamp: Date.now(),
          }),
        );
      } catch (_err) {
        // Storage write failed or quota exceeded
      }
    },
    [],
  );

  const clearActiveCallSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (_err) {
      // Session storage access restricted
    }
    setResumableCall(null);
  }, []);

  const cleanupMediaAndPeer = useCallback(
    (shouldClearSession = true) => {
      console.log("[CallContext] Cleaning up media tracks and WebRTC connection");

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_err) {
            // Track may already be disposed
          }
        });
        screenStreamRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_err) {
            // Track may already be disposed
          }
        });
        localStreamRef.current = null;
      }

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.onicecandidate = null;
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.onconnectionstatechange = null;
          peerConnectionRef.current.close();
        } catch (_err) {
          // Connection may already be closed
        }
        peerConnectionRef.current = null;
      }

      cameraTrackRef.current = null;
      remoteStreamRef.current = null;
      remoteSocketIdRef.current = null;
      activeRemoteUserIdRef.current = null;
      activeCallRoomIdRef.current = null;
      iceCandidatesQueue.current = [];

      setStream(null);
      setRemoteStream(null);
      setStreamVersion(0);
      setIsScreenSharing(false);
      setIsMuted(false);
      setIsCamOff(false);
      setIsReconnecting(false);
      setCallStatus("idle");
      setCallerInfo(null);

      if (shouldClearSession) {
        clearActiveCallSession();
      }
    },
    [clearActiveCallSession],
  );

  const initiatePeerConnection = useCallback(
    async (remoteSocketId, isInitiator, _peerInfo = null) => {
      if (!user || !socket) return null;

      console.log(
        `[CallContext] Initiating connection with socket ${remoteSocketId} (initiator: ${isInitiator})`,
      );

      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (_err) {
          // Prior connection already closed
        }
      }

      remoteSocketIdRef.current = remoteSocketId;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("meeting_signal_ice", {
            to_socket_id: remoteSocketId,
            candidate: event.candidate,
            from_user: {
              user_id: user.user_id,
              name: user.nombre,
              profile_picture: user.profile_picture,
            },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(
          `[CallContext] Remote track received from ${remoteSocketId}:`,
          event.track.kind,
          event.streams[0],
        );
        let incomingStream = event.streams[0];
        if (!incomingStream) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);
          incomingStream = remoteStreamRef.current;
        } else {
          remoteStreamRef.current = incomingStream;
        }
        setRemoteStream(incomingStream);
        setStreamVersion((v) => v + 1);
      };

      pc.onconnectionstatechange = () => {
        console.log("[CallContext] WebRTC connectionState:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsReconnecting(false);
          setCallStatus("active");
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          setIsReconnecting(true);
        } else if (pc.connectionState === "closed") {
          cleanupMediaAndPeer();
        }
      };

      if (isInitiator && socket) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("meeting_signal_offer", {
            to_socket_id: remoteSocketId,
            offer,
            from_user: {
              user_id: user.user_id,
              name: user.nombre,
              profile_picture: user.profile_picture,
            },
          });
        } catch (err) {
          console.error("[CallContext] Error creating offer:", err);
        }
      }

      return pc;
    },
    [user, socket, cleanupMediaAndPeer],
  );

  const startCall = useCallback(
    async (targetUserId, targetName, type = "video", targetAvatar = null) => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Su navegador no soporta llamadas o requiere conexión segura HTTPS.",
          );
        }

        const isVideo = type === "video";
        const normalizedTargetId = resolveUserId(targetUserId);
        const myUserId = resolveUserId(user?.user_id || user?.id);

        const callRoomId = `call_${[myUserId, normalizedTargetId].sort().join("_")}_${Date.now()}`;
        activeCallRoomIdRef.current = callRoomId;
        activeRemoteUserIdRef.current = normalizedTargetId;

        setCallType(type);
        setCallerInfo({
          id: normalizedTargetId,
          name: targetName,
          type: type,
          avatar: targetAvatar,
          callRoomId,
        });
        setCallStatus("calling");

        saveActiveCallSession(
          normalizedTargetId,
          targetName,
          type,
          targetAvatar,
          callRoomId,
        );

        const myStream = await navigator.mediaDevices.getUserMedia({
          video: isVideo
            ? {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 30 },
              }
            : false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        localStreamRef.current = myStream;
        setStream(myStream);

        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) cameraTrackRef.current = videoTrack;

        console.log("[CallContext] Emitting call_request to:", normalizedTargetId);
        socket.emit("call_request", {
          to: normalizedTargetId,
          from: myUserId,
          callRoomId,
          callType: type,
          type: type,
          callerName: user?.nombre || "Usuario",
          callerAvatar: user?.profile_picture || null,
        });

        return myStream;
      } catch (err) {
        console.error("[CallContext] Error startCall:", err);
        addNotification(
          "Error de dispositivos",
          err.message || "No se pudo acceder a la cámara o micrófono.",
          "red",
        );
        cleanupMediaAndPeer();
        return null;
      }
    },
    [
      user,
      socket,
      saveActiveCallSession,
      addNotification,
      cleanupMediaAndPeer,
    ],
  );

  const acceptCall = useCallback(async () => {
    try {
      const currentCaller = callerInfoRef.current;
      if (!currentCaller || !currentCaller.callRoomId) {
        throw new Error("Información de llamada no disponible.");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Su navegador no soporta llamadas o requiere conexión segura HTTPS.",
        );
      }

      const isVideo =
        currentCaller.type === "video" || callType === "video";
      const normalizedCallerId = resolveUserId(currentCaller.id);
      const callRoomId = currentCaller.callRoomId;

      activeCallRoomIdRef.current = callRoomId;
      activeRemoteUserIdRef.current = normalizedCallerId;

      saveActiveCallSession(
        normalizedCallerId,
        currentCaller.name,
        currentCaller.type || "video",
        currentCaller.avatar,
        callRoomId,
      );

      const myStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30 },
            }
          : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = myStream;
      setStream(myStream);

      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) cameraTrackRef.current = videoTrack;

      socket.emit("accept_call", {
        to: normalizedCallerId,
        from: resolveUserId(user?.user_id || user?.id),
        callRoomId,
      });

      console.log("[CallContext] Joining ephemeral room:", callRoomId);
      socket.emit("meeting_join", {
        meeting_code: callRoomId,
        user_id: user?.user_id,
        name: user?.nombre || "Usuario",
        profile_picture: user?.profile_picture || null,
        is_audio_muted: isMuted,
        is_video_off: !isVideo,
      });

      setCallStatus("active");
      return myStream;
    } catch (err) {
      console.error("[CallContext] Error acceptCall:", err);
      addNotification(
        "Error al contestar",
        err.message || "No se pudo inicializar la llamada.",
        "red",
      );
      cleanupMediaAndPeer();
      return null;
    }
  }, [
    callType,
    user,
    socket,
    isMuted,
    saveActiveCallSession,
    addNotification,
    cleanupMediaAndPeer,
  ]);

  const rejectCall = useCallback(() => {
    const currentCaller = callerInfoRef.current;
    const targetId = currentCaller?.id || activeRemoteUserIdRef.current;
    if (targetId && socket) {
      console.log("[CallContext] Emitting reject_call to:", targetId);
      socket.emit("reject_call", {
        to: resolveUserId(targetId),
        from: resolveUserId(user?.user_id || user?.id),
      });
    }
    cleanupMediaAndPeer();
  }, [socket, user, cleanupMediaAndPeer]);

  const endCall = useCallback(() => {
    const targetId =
      activeRemoteUserIdRef.current || callerInfoRef.current?.id;
    const roomId = activeCallRoomIdRef.current;

    console.log("[CallContext] Ending call, target:", targetId, "room:", roomId);

    if (roomId && socket) {
      socket.emit("meeting_leave", { meeting_code: roomId });
    }

    if (targetId && socket) {
      socket.emit("end_call", {
        to: resolveUserId(targetId),
        from: resolveUserId(user?.user_id || user?.id),
      });
    }

    cleanupMediaAndPeer();
  }, [socket, user, cleanupMediaAndPeer]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return false;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = audioTrack.enabled;
      audioTrack.enabled = !nextMuted;
      setIsMuted(nextMuted);

      if (activeCallRoomIdRef.current && socket) {
        socket.emit("meeting_toggle_media", {
          meeting_code: activeCallRoomIdRef.current,
          is_audio_muted: nextMuted,
        });
      }
      return nextMuted;
    }
    return false;
  }, [socket]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return false;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextVideoOff = videoTrack.enabled;
      videoTrack.enabled = !nextVideoOff;
      setIsCamOff(nextVideoOff);

      if (activeCallRoomIdRef.current && socket) {
        socket.emit("meeting_toggle_media", {
          meeting_code: activeCallRoomIdRef.current,
          is_video_off: nextVideoOff,
        });
      }
      return nextVideoOff;
    }
    return false;
  }, [socket]);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_err) {
          // Track may already be disposed
        }
      });
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    // Revert outgoing video track back to the camera
    if (peerConnectionRef.current && cameraTrackRef.current) {
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");
      if (sender) {
        await sender.replaceTrack(cameraTrackRef.current);
      }
    }

    if (activeCallRoomIdRef.current && socket) {
      socket.emit("meeting_screen_share", {
        meeting_code: activeCallRoomIdRef.current,
        is_sharing: false,
      });
    }
  }, [socket]);

  const startScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current || isScreenSharing) return null;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === "video");

      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      setIsScreenSharing(true);

      if (activeCallRoomIdRef.current && socket) {
        socket.emit("meeting_screen_share", {
          meeting_code: activeCallRoomIdRef.current,
          is_sharing: true,
        });
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };
      return screenStream;
    } catch (err) {
      console.warn("[CallContext] Screen share cancelled or error:", err);
      return null;
    }
  }, [isScreenSharing, socket, stopScreenShare]);

  // Resume a recently interrupted call (e.g. after page reload)
  const resumeCall = useCallback(() => {
    if (!resumableCall) return;
    const { targetUserId, targetName, callType: cType, targetAvatar } =
      resumableCall;
    clearActiveCallSession();
    startCall(targetUserId, targetName, cType, targetAvatar);
  }, [resumableCall, clearActiveCallSession, startCall]);

  const discardResumableCall = useCallback(() => {
    clearActiveCallSession();
  }, [clearActiveCallSession]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleIncomingCall = (data) => {
      console.log("[CallContext] incoming_call received:", data);
      const callerId = data.from || data.callerId || data.id;
      const normalizedCallerId = resolveUserId(callerId);
      const callRoomId =
        data.callRoomId || `call_${[user?.user_id, normalizedCallerId].sort().join("_")}`;

      activeCallRoomIdRef.current = callRoomId;
      activeRemoteUserIdRef.current = normalizedCallerId;

      if (callStatusRef.current !== "idle" || localStreamRef.current) {
        console.log("[CallContext] User is busy. Emitting user_busy.");
        socket.emit("user_busy", {
          to: normalizedCallerId,
          from: resolveUserId(user?.user_id),
        });
        return;
      }

      setCallerInfo({
        id: normalizedCallerId,
        name: data.callerName || "Usuario",
        avatar: data.callerAvatar || null,
        callRoomId,
        type: data.callType || data.type || "video",
      });
      setCallType(data.callType || data.type || "video");
      setCallStatus("receiving");
    };

    const handleCallAccepted = async (data) => {
      console.log("[CallContext] call_accepted received:", data);
      const callRoomId = data.callRoomId || activeCallRoomIdRef.current;
      activeCallRoomIdRef.current = callRoomId;

      setCallStatus("active");

      console.log("[CallContext] Caller joining room:", callRoomId);
      socket.emit("meeting_join", {
        meeting_code: callRoomId,
        user_id: user?.user_id,
        name: user?.nombre || "Usuario",
        profile_picture: user?.profile_picture || null,
        is_audio_muted: isMuted,
        is_video_off: callType === "audio",
      });
    };

    const drainIceCandidates = async (pc) => {
      if (iceCandidatesQueue.current.length > 0 && pc) {
        const queued = [...iceCandidatesQueue.current];
        iceCandidatesQueue.current = [];
        for (const c of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (err) {
            console.warn("[CallContext] Error adding queued ICE candidate:", err);
          }
        }
      }
    };

    const handleMeetingJoined = async ({ peers }) => {
      if (!activeCallRoomIdRef.current || callStatusRef.current !== "active") return;
      console.log("[CallContext] meeting_joined in room, existing peers:", peers);
      if (Array.isArray(peers) && peers.length > 0) {
        // The other peer is already present; initiate connection as caller
        const otherPeer = peers[0];
        await initiatePeerConnection(otherPeer.socket_id, true, otherPeer);
      }
    };

    const handleMeetingPeerJoined = async (newPeer) => {
      if (!activeCallRoomIdRef.current || callStatusRef.current !== "active") return;
      console.log("[CallContext] meeting_peer_joined in room:", newPeer);
      if (newPeer?.socket_id) {
        await initiatePeerConnection(newPeer.socket_id, false, newPeer);
      }
    };

    const handleSignalOffer = async ({ from_socket_id, offer, from_user }) => {
      if (!activeCallRoomIdRef.current || callStatusRef.current !== "active") return;
      console.log("[CallContext] meeting_signal_offer received from:", from_socket_id);
      let pc = peerConnectionRef.current;
      if (!pc) {
        pc = await initiatePeerConnection(from_socket_id, false, from_user);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await drainIceCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("meeting_signal_answer", {
          to_socket_id: from_socket_id,
          answer,
          from_user: {
            user_id: user?.user_id,
            name: user?.nombre,
            profile_picture: user?.profile_picture,
          },
        });
      } catch (err) {
        console.error("[CallContext] Error answering offer:", err);
      }
    };

    const handleSignalAnswer = async ({ from_socket_id, answer }) => {
      if (!activeCallRoomIdRef.current || callStatusRef.current !== "active") return;
      console.log("[CallContext] meeting_signal_answer received from:", from_socket_id);
      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (pc.signalingState !== "have-local-offer") {
        console.warn(
          "[CallContext] Ignoring redundant/unexpected answer; signalingState is:",
          pc.signalingState,
        );
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await drainIceCandidates(pc);
      } catch (err) {
        console.error("[CallContext] Error setting remote answer:", err);
      }
    };

    const handleSignalIce = async ({ _from_socket_id, candidate }) => {
      if (!activeCallRoomIdRef.current || callStatusRef.current !== "active") return;
      const pc = peerConnectionRef.current;
      if (!candidate) return;

      // Buffer candidate if remote description is not ready yet
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        iceCandidatesQueue.current.push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("[CallContext] Error adding ICE candidate:", err);
      }
    };

    const handleMeetingPeerLeft = ({ socket_id }) => {
      if (!activeCallRoomIdRef.current || callStatusRef.current !== "active") return;
      console.log("[CallContext] Peer left room:", socket_id);
      addNotification("Llamada finalizada", "El usuario ha finalizado la llamada.", "info", true);
      cleanupMediaAndPeer();
    };

    const handleCallBusyResponse = () => {
      console.log("[CallContext] call_busy_response received");
      addNotification(
        "Usuario Ocupado",
        "El usuario se encuentra actualmente en otra llamada.",
        "info",
        true,
      );
      cleanupMediaAndPeer();
    };

    const handleCallRejected = () => {
      console.log("[CallContext] call_rejected received");
      addNotification(
        "Llamada rechazada",
        "El usuario ha rechazado la llamada.",
        "info",
        true,
      );
      cleanupMediaAndPeer();
    };

    const handleCallEnded = () => {
      console.log("[CallContext] call_ended received");
      addNotification(
        "Llamada finalizada",
        "La llamada ha terminado.",
        "info",
        true,
      );
      cleanupMediaAndPeer();
    };

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_busy_response", handleCallBusyResponse);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);

    socket.on("meeting_joined", handleMeetingJoined);
    socket.on("meeting_peer_joined", handleMeetingPeerJoined);
    socket.on("meeting_signal_offer", handleSignalOffer);
    socket.on("meeting_signal_answer", handleSignalAnswer);
    socket.on("meeting_signal_ice", handleSignalIce);
    socket.on("meeting_peer_left", handleMeetingPeerLeft);

    return () => {
      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_busy_response", handleCallBusyResponse);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);

      socket.off("meeting_joined", handleMeetingJoined);
      socket.off("meeting_peer_joined", handleMeetingPeerJoined);
      socket.off("meeting_signal_offer", handleSignalOffer);
      socket.off("meeting_signal_answer", handleSignalAnswer);
      socket.off("meeting_signal_ice", handleSignalIce);
      socket.off("meeting_peer_left", handleMeetingPeerLeft);
    };
  }, [
    socket,
    user,
    isMuted,
    callType,
    initiatePeerConnection,
    addNotification,
    cleanupMediaAndPeer,
  ]);

  return (
    <CallContext.Provider
      value={{
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
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleAudio: toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        resumeCall,
        discardResumableCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
