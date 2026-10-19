// src/components/events/MeetingRoom.jsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useMeeting } from "../../contexts/MeetingContext";
import { useAuth } from "../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Badge from "../common/Badge";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faPhoneSlash,
  faUsers,
  faCopy,
  faCheck,
  faExpand,
  faCompress,
  faHeadset,
  faTableCellsLarge,
  faTableColumns,
  faWindowMaximize,
} from "@fortawesome/free-solid-svg-icons";

import RemoteAudioStream from "../common/RemoteAudioStream";
import { formatSecondsToTime } from "../../utils/formatters";

import RemoteVideoTile from "./meeting/RemoteVideoTile";
import LocalVideoTile from "./meeting/LocalVideoTile";
import MeetingParticipantsDrawer from "./meeting/MeetingParticipantsDrawer";
import MeetingControls from "./meeting/MeetingControls";


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

  const formatTimer = (totalSeconds) => formatSecondsToTime(totalSeconds);


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
      <div className="fixed inset-0 z-9999 bg-gray-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
        <div className="w-14 h-14 rounded-full border-4 border-vgsdarkblue border-t-transparent animate-spin mb-4" />
        <h3 className="text-base font-bold text-white">
          Connecting to meeting...
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Accessing camera and microphone
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
      <div className="hidden" aria-hidden="true">
        {peersList.map((peer) => (
          <RemoteAudioStream
            key={peer.socket_id}
            stream={peer.stream}
            isAudioMuted={peer.is_audio_muted}
          />
        ))}
      </div>
      {isMinimized ? (
        <motion.div
          drag
          dragMomentum={false}
          className="fixed bottom-6 right-6 z-10000 w-84 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none"
        >
          <header className="p-3 bg-gray-800/80 flex items-center justify-between border-b border-white/10 cursor-grab active:cursor-grabbing">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-white truncate max-w-35">
                {focusedPeer?.is_sharing
                  ? `[Screen Share] ${focusedPeer.name}`
                  : focusedPeer
                  ? focusedPeer.name
                  : activeMeeting.event?.title || "Meeting"}
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
                title="Maximize"
              />
              <Button
                type="button"
                variant="transparent"
                size="xs"
                icon={faPhoneSlash}
                onClick={leaveMeeting}
                className="text-red-400 hover:text-red-300 p-1 text-xs"
                title="Leave"
              />
            </div>
          </header>
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
              Open ({totalParticipants})
            </Button>
          </footer>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 bg-vgsblack flex flex-col overflow-hidden"
          >
            <header className="h-16 px-4 sm:px-6 bg-vgsdarkblue flex items-center justify-between shrink-0 relative z-50">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 text-vgswhite">
                <div className="flex items-center gap-2.5 ">
                  <span className="w-3 h-3 rounded-full bg-vgsred animate-pulse shrink-0" />
                  <h2 className="text-sm sm:text-base font-bold truncate max-w-40 sm:max-w-md">
                    {activeMeeting.event?.title || "Meeting"}
                  </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg">
                  {formatTimer(callDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleCopyCode}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 transition-colors border border-vgswhite text-vgswhite rounded-xl text-xs"
                  title="Copy Meeting Code"
                >
                  <span>{activeMeeting.meetingCode}</span>
                  <FontAwesomeIcon
                    icon={copied ? faCheck : faCopy}
                    className={copied ? "text-gvgsred" : ""}
                  />
                </button>
                <div className="relative">
                  <Button
                    variant="red"
                    size="sx"
                    icon={
                      layoutMode === "grid"
                        ? faTableCellsLarge
                        : layoutMode === "sidebar"
                        ? faTableColumns
                        : faWindowMaximize
                    }
                    onClick={() => setIsLayoutMenuOpen((prev) => !prev)}
                    title="Change Layout"
                  />

                  <AnimatePresence>
                    {isLayoutMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsLayoutMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 25,
                          }}
                          className="absolute right-0 mt-2 w-48 bg-vgswhite rounded-lg z-50"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setLayoutMode("grid");
                              setIsLayoutMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                              layoutMode === "grid"
                                ? "bg-vgsred text-vgswhite"
                                : "text-vgsblack hover:bg-vgsgray/50"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faTableCellsLarge}
                              className="w-4"
                            />
                            <span>Grid</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLayoutMode("sidebar");
                              setIsLayoutMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                              layoutMode === "sidebar"
                                ? "bg-vgsred text-vgswhite"
                                : "text-vgsblack hover:bg-vgsgray/50"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faTableColumns}
                              className="w-4"
                            />
                            <span>Sidebar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLayoutMode("spotlight");
                              setIsLayoutMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                              layoutMode === "spotlight"
                                ? "bg-vgsblue text-fullwhite"
                                : "text-vgsblack hover:bg-vgsgray/50"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={faWindowMaximize}
                              className="w-4"
                            />
                            <span>Spotlight</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  type="button"
                  variant="white"
                  size="sx"
                  icon={faCompress}
                  onClick={() => setIsMinimized(true)}
                  title="Minimize"
                />

                <Button
                  variant="red"
                  size="sx"
                  icon={faUsers}
                  title={`${totalParticipants} participants`}
                  onClick={() => setShowParticipants((prev) => !prev)}
                />
              </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
              <LayoutGroup id="meeting-room-layout">
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

              <MeetingParticipantsDrawer
                showParticipants={showParticipants}
                onClose={() => setShowParticipants(false)}
                totalParticipants={totalParticipants}
                user={user}
                activeMeeting={activeMeeting}
                pinnedPeerId={pinnedPeerId}
                onTogglePin={handleTogglePin}
                isAudioMuted={isAudioMuted}
                peersList={peersList}
                copied={copied}
                onCopyCode={handleCopyCode}
              />
            </main>

            <MeetingControls
              isAudioMuted={isAudioMuted}
              toggleAudio={toggleAudio}
              isVideoOff={isVideoOff}
              toggleVideo={toggleVideo}
              allowScreenShare={allowScreenShare}
              isScreenSharing={isScreenSharing}
              startScreenShare={startScreenShare}
              stopScreenShare={stopScreenShare}
              leaveMeeting={leaveMeeting}
              isHost={activeMeeting.isHost}
              endMeetingForAll={endMeetingForAll}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </>

  );
};

export default MeetingRoom;
