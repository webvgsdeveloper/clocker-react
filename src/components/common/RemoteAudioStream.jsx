// src/components/common/RemoteAudioStream.jsx
import React, { useEffect, useRef, memo } from "react";

/**
 * Persistent Remote Audio Stream.
 * Remains mounted in DOM to prevent browser audio dropouts during layout toggles or minimization.
 */
const RemoteAudioStream = memo(({ stream, streamVersion, isAudioMuted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
      }
      audioRef.current.play().catch(() => {});
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

export default RemoteAudioStream;
