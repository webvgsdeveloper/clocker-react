// src/components/events/AttendancePromptModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  faCalendarCheck,
  faCheck,
  faXmark,
  faClock,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { useEvents } from "../../contexts/EventsContext";
import { formatDateTime } from "../../utils/formatters";
import { popIn } from "../common/animations";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const AttendancePromptModal = () => {
  const { activePromptEvent, isPromptOpen, closePrompt, confirmAttendance } =
    useEvents();
  const [submitting, setSubmitting] = useState(false);

  if (!isPromptOpen || !activePromptEvent) return null;

  const eventId = activePromptEvent.event_id || activePromptEvent.id;
  const title = activePromptEvent.title || "Finished Event";
  const typeName =
    activePromptEvent.event_type ||
    activePromptEvent.event_type_name ||
    "Activity";
  const startTime = activePromptEvent.start_time;
  const endTime = activePromptEvent.end_time;
  const description = activePromptEvent.description;

  const handleChoice = async (attended) => {
    setSubmitting(true);
    try {
      await confirmAttendance(eventId, attended);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closePrompt}
          className="fixed inset-0 bg-vgsblack/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Card */}
        <motion.div
          variants={popIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-vgswhite rounded-2xl shadow-[0_12px_40px_rgb(12,34,75,0.1)] border border-vgsgray/20 w-full max-w-md overflow-hidden z-10"
          role="dialog"
          aria-modal="true"
        >
          {/* Top colored accent bar */}
          <div className="h-2 bg-linear-to-r from-vgsred via-vgsdarkblue to-green-500" />

          <div className="p-6">
            <header className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-vgsred/10 text-vgsred flex items-center justify-center text-xl shrink-0">
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </div>
                <div>
                  <Badge variant="blue" size="xs" icon={faTag} className="mb-1">
                    {typeName}
                  </Badge>
                  <h3 className="text-lg font-bold text-vgsblack leading-snug">
                    Confirm Attendance
                  </h3>
                </div>
              </div>
              <Button
                variant="transparent"
                animation="shrink"
                icon={faXmark}
                onClick={closePrompt}
                className="text-vgsgray hover:text-vgsblack p-1 text-base"
                title="Decide later"
              />
            </header>

            <div className="bg-vgsgray/5 rounded-xl p-4 border border-vgsgray/15 mb-5 space-y-2">
              <h4 className="font-bold text-vgsdarkblue text-base">{title}</h4>
              {description && (
                <p className="text-xs text-vgsgray leading-relaxed">
                  {description}
                </p>
              )}
              {(startTime || endTime) && (
                <div className="flex items-center gap-2 text-xs text-vgsgray pt-1 border-t border-vgsgray/20">
                  <FontAwesomeIcon icon={faClock} className="text-vgsred" />
                  <span>
                    {startTime ? formatDateTime(startTime) : ""}
                    {endTime ? ` - ${formatDateTime(endTime)}` : ""}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm font-semibold text-center text-vgsblack mb-5">
              Did you attend this event?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="green"
                size="md"
                icon={faCheck}
                animation="grow"
                disabled={submitting}
                onClick={() => handleChoice(true)}
              >
                {submitting ? "Saving..." : "Yes, I attended"}
              </Button>

              <Button
                type="button"
                variant="gray"
                size="md"
                icon={faXmark}
                animation="shrink"
                className="hover:text-vgsred"
                disabled={submitting}
                onClick={() => handleChoice(false)}
              >
                {submitting ? "Saving..." : "I did not attend"}
              </Button>
            </div>

            <p className="text-[11px] text-vgsgray text-center mt-4">
              If you close this prompt, you can respond later from the notifications panel.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AttendancePromptModal;
