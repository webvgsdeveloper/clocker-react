// src/components/events/meeting/MeetingControls.jsx
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faDisplay,
  faPhoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../common/Button";

const MeetingControls = ({
  isAudioMuted,
  toggleAudio,
  isVideoOff,
  toggleVideo,
  allowScreenShare,
  isScreenSharing,
  startScreenShare,
  stopScreenShare,
  leaveMeeting,
  isHost,
  endMeetingForAll,
}) => {
  return (
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
          title={isAudioMuted ? "Activar micrófono" : "Silenciar micrófono"}
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

        {/* Screen Share */}
        {allowScreenShare && (
          <Button
            type="button"
            variant={isScreenSharing ? "blue" : "gray"}
            animation="shrink"
            icon={faDisplay}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
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

          {isHost && (
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
  );
};

export default MeetingControls;
