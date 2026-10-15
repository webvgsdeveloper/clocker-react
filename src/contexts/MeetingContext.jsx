// src/contexts/MeetingContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import { ICE_SERVERS } from "../config/webrtc";
import api from "../services/api";

const MeetingContext = createContext();

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
};


export const MeetingProvider = ({ children }) => {
  const { user, token, socket } = useAuth();
  const { addNotification } = useNotification();

  // Active meeting state
  const [activeMeeting, setActiveMeeting] = useState(null);
  // activeMeeting = { event, isHost, meetingCode, meetingType, settings }

  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Local media state
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);

  // WebRTC multi-peer connections: { [socket_id]: RTCPeerConnection }
  const peerConnections = useRef({});

  // Remote peers information: { [socket_id]: { socket_id, stream, user_id, name, profile_picture, is_host, is_audio_muted, is_video_off, is_sharing } }
  const [remotePeers, setRemotePeers] = useState({});

  // Synchronize refs with state
  const isJoinedRef = useRef(isJoined);
  const activeMeetingRef = useRef(activeMeeting);

  useEffect(() => {
    isJoinedRef.current = isJoined;
  }, [isJoined]);

  useEffect(() => {
    activeMeetingRef.current = activeMeeting;
  }, [activeMeeting]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Clean all WebRTC connections and stop tracks
  const cleanupConnections = useCallback(() => {
    // Close and remove all peer connections
    Object.entries(peerConnections.current).forEach(([socketId, pc]) => {
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
      } catch (err) {
        console.warn(`[MeetingContext] Error closing pc for ${socketId}:`, err);
      }
    });
    peerConnections.current = {};

    // Stop screen share if any
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemotePeers({});
    setIsJoined(false);
    setIsJoining(false);
    setIsScreenSharing(false);
    setIsMinimized(false);
    setActiveMeeting(null);
  }, []);

  // Update peer information with stream
  const updatePeerStream = useCallback((socketId, stream, peerInfo = null) => {
    setRemotePeers((prev) => {
      const existing = prev[socketId] || {};
      return {
        ...prev,
        [socketId]: {
          ...existing,
          ...peerInfo,
          socket_id: socketId,
          stream,
        },
      };
    });
  }, []);

  // Initiate or prepare a peer connection
  const initiatePeerConnection = useCallback(
    async (remoteSocketId, isInitiator, peerInfo = null) => {
      if (!user) return null;

      // If connection already exists, return it
      if (peerConnections.current[remoteSocketId]) {
        return peerConnections.current[remoteSocketId];
      }

      console.log(
        `[MeetingContext] Initiating connection with ${remoteSocketId} (initiator: ${isInitiator})`
      );

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current[remoteSocketId] = pc;

      // 1. Add local tracks to connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // 2. Handle ICE candidates generated locally
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

      // 3. Receive remote stream
      pc.ontrack = (event) => {
        console.log(
          `[MeetingContext] Remote track received from ${remoteSocketId}:`,
          event.streams[0]
        );
        const remoteStream = event.streams[0];
        updatePeerStream(remoteSocketId, remoteStream, peerInfo);
      };

      // Store initial peer metadata if provided
      if (peerInfo) {
        setRemotePeers((prev) => ({
          ...prev,
          [remoteSocketId]: {
            ...prev[remoteSocketId],
            ...peerInfo,
            socket_id: remoteSocketId,
          },
        }));
      }

      // 4. If initiator, create and send Offer
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
          console.error(
            `[MeetingContext] Error creating offer for ${remoteSocketId}:`,
            err
          );
        }
      }

      return pc;
    },
    [user, socket, updatePeerStream]
  );

  // Start local media (Audio / Video)
  const startLocalMedia = useCallback(
    async (meetingType = "video", muteOnEntry = false) => {
      const constraints = {
        audio: true,
        video:
          meetingType === "video"
            ? { width: { ideal: 1280 }, height: { ideal: 720 } }
            : false,
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (muteOnEntry) {
          stream.getAudioTracks().forEach((t) => (t.enabled = false));
          setIsAudioMuted(true);
        } else {
          setIsAudioMuted(false);
        }

        if (meetingType === "audio") {
          setIsVideoOff(true);
        } else {
          setIsVideoOff(false);
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err) {
        console.error("[MeetingContext] Error accessing local media:", err);
        addNotification(
          "Error de Dispositivos",
          "No se pudo acceder a la cámara o micrófono. Verifica los permisos del navegador.",
          "error",
          true
        );
        throw err;
      }
    },
    [addNotification]
  );

  // Join a meeting using its code
  const joinMeeting = useCallback(
    async (meetingCode) => {
      if (!meetingCode || !token || !socket) return;

      setIsJoining(true);
      try {
        // Step 1: Validate meeting code with backend
        const res = await api.getMeetingInfo(token, meetingCode);
        if (!res || !res.success || !res.data?.event) {
          addNotification(
            "Sala no disponible",
            res?.error || "El código de reunión no es válido o ha expirado.",
            "error",
            true
          );
          setIsJoining(false);
          return;
        }

        const { event, is_host: isHost } = res.data;
        const meetingType = event.meeting_type || "video";
        const muteOnEntry = event.meeting_settings?.mute_on_entry ?? false;

        setActiveMeeting({
          event,
          isHost,
          meetingCode,
          meetingType,
          settings: event.meeting_settings || {},
        });

        // Step 2: Start local media
        await startLocalMedia(meetingType, muteOnEntry);

        setIsJoined(true);

        // Step 3: Emit join event through Socket.IO
        socket.emit("meeting_join", {
          meeting_code: meetingCode,
          user_id: user.user_id,
          name: user.nombre,
          profile_picture: user.profile_picture,
          is_host: isHost,
          is_audio_muted: muteOnEntry,
          is_video_off: meetingType === "audio",
        });
      } catch (err) {
        console.error("[MeetingContext] Error joining meeting:", err);
        cleanupConnections();
        setActiveMeeting(null);
      } finally {
        setIsJoining(false);
      }
    },
    [token, socket, user, startLocalMedia, cleanupConnections, addNotification]
  );

  // Leave meeting voluntarily
  const leaveMeeting = useCallback(() => {
    if (activeMeeting && socket) {
      socket.emit("meeting_leave", {
        meeting_code: activeMeeting.meetingCode,
      });
    }
    cleanupConnections();
    setActiveMeeting(null);
    addNotification("Reunión Finalizada", "Has salido de la sala.", "info", true);
  }, [activeMeeting, socket, cleanupConnections, addNotification]);

  // Host terminates meeting for all participants
  const endMeetingForAll = useCallback(() => {
    if (activeMeeting && activeMeeting.isHost && socket) {
      socket.emit("meeting_end_for_all", {
        meeting_code: activeMeeting.meetingCode,
      });
    }
    cleanupConnections();
    setActiveMeeting(null);
    addNotification(
      "Reunión Finalizada",
      "Has finalizado la sesión para todos los asistentes.",
      "info",
      true
    );
  }, [activeMeeting, socket, cleanupConnections, addNotification]);

  // Toggle Audio (Mute / Unmute)
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextMuted = !isAudioMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsAudioMuted(nextMuted);

    if (activeMeeting && socket) {
      socket.emit("meeting_toggle_media", {
        meeting_code: activeMeeting.meetingCode,
        is_audio_muted: nextMuted,
      });
    }
  }, [isAudioMuted, activeMeeting, socket]);

  // Toggle Video (Camera On / Off)
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const nextVideoOff = !isVideoOff;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !nextVideoOff;
    });
    setIsVideoOff(nextVideoOff);

    if (activeMeeting && socket) {
      socket.emit("meeting_toggle_media", {
        meeting_code: activeMeeting.meetingCode,
        is_video_off: nextVideoOff,
      });
    }
  }, [isVideoOff, activeMeeting, socket]);

  const stopScreenShare = useCallback(() => {
    if (!isScreenSharing) return;

    // Restore camera track to all senders
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (cameraTrack) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      });
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    if (activeMeeting && socket) {
      socket.emit("meeting_screen_share", {
        meeting_code: activeMeeting.meetingCode,
        is_sharing: false,
      });
    }
  }, [isScreenSharing, activeMeeting, socket]);

  // Start / Stop Screen Sharing
  const startScreenShare = useCallback(async () => {
    if (!localStreamRef.current || isScreenSharing) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      // Replace video track in all active RTCPeerConnections
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      setIsScreenSharing(true);

      if (activeMeeting && socket) {
        socket.emit("meeting_screen_share", {
          meeting_code: activeMeeting.meetingCode,
          is_sharing: true,
        });
      }

      // Handle user stopping screen share via browser's native bar
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("[MeetingContext] Screen share cancelled or error:", err);
    }
  }, [isScreenSharing, activeMeeting, socket, stopScreenShare]);

  const initiatePeerConnectionRef = useRef(initiatePeerConnection);
  initiatePeerConnectionRef.current = initiatePeerConnection;

  const cleanupConnectionsRef = useRef(cleanupConnections);
  cleanupConnectionsRef.current = cleanupConnections;

  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  // Socket.IO signaling event listeners
  useEffect(() => {
    if (!socket || !user) return;

    // 1. Existing peers list received after joining
    const handleMeetingJoined = async ({ peers }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      if (Array.isArray(peers)) {
        for (const peer of peers) {
          await initiatePeerConnectionRef.current(peer.socket_id, true, peer);
        }
      }
    };

    // 2. New peer joined the room
    const handlePeerJoined = async (newPeer) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      if (newPeer?.socket_id) {
        await initiatePeerConnectionRef.current(newPeer.socket_id, false, newPeer);
      }
    };

    // 3. WebRTC Offer received
    const handleSignalOffer = async ({ from_socket_id, offer, from_user }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      let pc = peerConnections.current[from_socket_id];
      if (!pc) {
        pc = await initiatePeerConnectionRef.current(from_socket_id, false, from_user);
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("meeting_signal_answer", {
          to_socket_id: from_socket_id,
          answer,
          from_user: {
            user_id: user.user_id,
            name: user.nombre,
            profile_picture: user.profile_picture,
          },
        });
      } catch (err) {
        console.error(
          `[MeetingContext] Error answering offer from ${from_socket_id}:`,
          err
        );
      }
    };

    // 4. WebRTC Answer received
    const handleSignalAnswer = async ({ from_socket_id, answer }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      console.log(`[MeetingContext] Answer received from ${from_socket_id}`);
      const pc = peerConnections.current[from_socket_id];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error(
            `[MeetingContext] Error setting remote answer from ${from_socket_id}:`,
            err
          );
        }
      }
    };

    // 5. ICE Candidate received
    const handleSignalIce = async ({ from_socket_id, candidate }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      const pc = peerConnections.current[from_socket_id];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn(
            `[MeetingContext] Error adding ICE candidate from ${from_socket_id}:`,
            err
          );
        }
      }
    };

    // 6. Peer toggled mic or camera
    const handlePeerMediaChanged = ({
      socket_id,
      is_audio_muted,
      is_video_off,
    }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      setRemotePeers((prev) => {
        if (!prev[socket_id]) return prev;
        return {
          ...prev,
          [socket_id]: {
            ...prev[socket_id],
            ...(is_audio_muted !== undefined && { is_audio_muted }),
            ...(is_video_off !== undefined && { is_video_off }),
          },
        };
      });
    };

    // 7. Peer toggled screen share
    const handlePeerScreenShare = ({ socket_id, is_sharing }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      setRemotePeers((prev) => {
        if (!prev[socket_id]) return prev;
        return {
          ...prev,
          [socket_id]: {
            ...prev[socket_id],
            is_sharing,
          },
        };
      });
    };

    // 8. Peer left the room
    const handlePeerLeft = ({ socket_id }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      console.log(`[MeetingContext] Peer left: ${socket_id}`);
      if (peerConnections.current[socket_id]) {
        try {
          peerConnections.current[socket_id].close();
        } catch (err) {
          console.warn("Error closing pc on peer left:", err);
        }
        delete peerConnections.current[socket_id];
      }
      setRemotePeers((prev) => {
        const updated = { ...prev };
        delete updated[socket_id];
        return updated;
      });
    };

    // 9. Meeting ended by host
    const handleMeetingEndedByHost = ({ message }) => {
      if (!isJoinedRef.current || !activeMeetingRef.current) return;
      cleanupConnectionsRef.current();
      setActiveMeeting(null);
      addNotificationRef.current(
        "Reunión Finalizada",
        message || "El anfitrión ha finalizado la reunión.",
        "warning",
        true
      );
    };

    socket.on("meeting_joined", handleMeetingJoined);
    socket.on("meeting_peer_joined", handlePeerJoined);
    socket.on("meeting_signal_offer", handleSignalOffer);
    socket.on("meeting_signal_answer", handleSignalAnswer);
    socket.on("meeting_signal_ice", handleSignalIce);
    socket.on("meeting_peer_media_changed", handlePeerMediaChanged);
    socket.on("meeting_screen_share", handlePeerScreenShare);
    socket.on("meeting_peer_left", handlePeerLeft);
    socket.on("meeting_ended_by_host", handleMeetingEndedByHost);

    return () => {
      socket.off("meeting_joined", handleMeetingJoined);
      socket.off("meeting_peer_joined", handlePeerJoined);
      socket.off("meeting_signal_offer", handleSignalOffer);
      socket.off("meeting_signal_answer", handleSignalAnswer);
      socket.off("meeting_signal_ice", handleSignalIce);
      socket.off("meeting_peer_media_changed", handlePeerMediaChanged);
      socket.off("meeting_screen_share", handlePeerScreenShare);
      socket.off("meeting_peer_left", handlePeerLeft);
      socket.off("meeting_ended_by_host", handleMeetingEndedByHost);
    };
  }, [socket, user?.user_id]);

  // Warn on beforeunload if user is in an active meeting
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isJoinedRef.current && activeMeetingRef.current) {
        e.preventDefault();
        e.returnValue = "Hay una videollamada activa en curso.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Clean WebRTC connections ONLY on provider unmount (app logout or close)
  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  const value = useMemo(
    () => ({
      activeMeeting,
      isJoining,
      isJoined,
      isMinimized,
      localStream,
      remotePeers,
      isAudioMuted,
      isVideoOff,
      isScreenSharing,
      joinMeeting,
      leaveMeeting,
      endMeetingForAll,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      stopScreenShare,
      setIsMinimized,
    }),
    [
      activeMeeting,
      isJoining,
      isJoined,
      isMinimized,
      localStream,
      remotePeers,
      isAudioMuted,
      isVideoOff,
      isScreenSharing,
      joinMeeting,
      leaveMeeting,
      endMeetingForAll,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      stopScreenShare,
      setIsMinimized,
    ]
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
};

export default MeetingContext;
