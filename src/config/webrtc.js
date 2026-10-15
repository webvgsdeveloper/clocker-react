// src/config/webrtc.js
/**
 * Shared WebRTC STUN and TURN server configuration for p2p calls and meeting rooms.
 */
const customTurnServers = [];

if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURN_URL) {
  customTurnServers.push({
    urls: import.meta.env.VITE_TURN_URL,
    username: import.meta.env.VITE_TURN_USERNAME || '',
    credential: import.meta.env.VITE_TURN_PASSWORD || '',
  });
}

export const RTC_CONFIG = {
  iceServers: [
    ...customTurnServers,
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80?transport=udp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export const ICE_SERVERS = RTC_CONFIG;
