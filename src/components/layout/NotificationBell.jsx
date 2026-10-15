// src/components/layout/NotificationBell.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faInbox,
  faTrash,
  faCalendarCheck,
  faCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../common/Button";
import { useNotification } from "../../contexts/NotificationContext";
import { useEvents } from "../../contexts/EventsContext";
import { formatDateTime } from "../../utils/formatters";

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transformOrigin: "top right",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

const NotificationBell = () => {
  const { notifications, markAllAsRead } = useNotification();
  const { pendingAttendances, confirmAttendance } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const dropdownRef = useRef(null);
  const [lastClearedTimestamp, setLastClearedTimestamp] = useState(() => {
    const saved = localStorage.getItem("vgs_notifications_cleared_at");
    return saved ? parseInt(saved, 10) : null;
  });

  const visibleNotifications = lastClearedTimestamp
    ? notifications.filter(
        (n) => new Date(n.date).getTime() > lastClearedTimestamp,
      )
    : notifications;

  const unreadCount =
    visibleNotifications.filter((n) => !n.read).length +
    pendingAttendances.length;
  const latestNotifications = visibleNotifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    if (!isOpen) markAllAsRead();
    setIsOpen(!isOpen);
  };

  const handleClearVisual = (e) => {
    e.stopPropagation();
    const now = Date.now();
    setLastClearedTimestamp(now);
    localStorage.setItem("vgs_notifications_cleared_at", now.toString());
  };

  const handleConfirmAction = async (eventId, attended) => {
    setActionLoadingId(eventId);
    try {
      await confirmAttendance(eventId, attended);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={toggleMenu}
        icon={faBell}
        variant="transparent"
        className="text-xl relative"
        animation="pop"
      >
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-1 right-1 bg-vgsred text-vgswhite text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white z-10"
            >
              {unreadCount > 9 ? "+9" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-84 sm:w-92 bg-vgswhite rounded-xl shadow-2xl border border-vgsgray z-100 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-3 bg-vgsred flex justify-between items-center">
              <h3 className="text-vgswhite font-bold text-sm sm:text-base">
                Notifications
              </h3>
              {visibleNotifications.length > 0 && (
                <Button
                  onClick={handleClearVisual}
                  variant="red"
                  icon={faTrash}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Static Pending Attendance Section */}
            {pendingAttendances && pendingAttendances.length > 0 && (
              <div className="bg-amber-50/80 border-b-2 border-amber-200/80 p-3 space-y-2.5 max-h-56 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <FontAwesomeIcon
                      icon={faCalendarCheck}
                      className="text-amber-600"
                    />
                    Pending Confirmations ({pendingAttendances.length})
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                    Action Required
                  </span>
                </div>

                {pendingAttendances.map((event) => {
                  const eventId = event.id || event.event_id;
                  const isLoading = actionLoadingId === eventId;
                  return (
                    <div
                      key={`pending-${eventId}`}
                      className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-vgsdarkblue leading-tight line-clamp-1">
                            {event.title}
                          </p>
                          <p className="text-[10px] text-vgsgray mt-0.5">
                            {event.event_type ||
                              event.event_type_name ||
                              "Event"}
                            {event.end_time
                              ? ` • ${formatDateTime(event.end_time)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-gray-700">
                        ¿Asististe a este evento?
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="green"
                          icon={faCheck}
                          disabled={isLoading}
                          onClick={() => handleConfirmAction(eventId, true)}
                          className="flex-1 py-1 text-xs font-bold"
                        >
                          {isLoading ? "..." : "Sí, asistí"}
                        </Button>
                        <Button
                          variant="gray"
                          icon={faXmark}
                          disabled={isLoading}
                          onClick={() => handleConfirmAction(eventId, false)}
                          className="flex-1 py-1 text-xs font-semibold hover:text-vgsred"
                        >
                          {isLoading ? "..." : "No asistí"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* General Notifications List */}
            <div className="max-h-72 overflow-y-auto">
              {visibleNotifications.length === 0 &&
              pendingAttendances.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <FontAwesomeIcon
                    icon={faInbox}
                    className="text-vgsgray text-4xl mb-2"
                  />
                  <p className="text-gray-400 text-sm">Nothing here</p>
                </motion.div>
              ) : (
                latestNotifications.map((n) => (
                  <motion.div
                    key={n.id}
                    variants={itemVariants}
                    className="p-3.5 border-b border-vgsgray last:border-0 hover:bg-vgsgray/10 transition-colors relative"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          n.read ? "bg-transparent" : "bg-vgsred"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-vgsdarkblue leading-none mb-1">
                          {n.title}
                        </p>
                        <p className="text-xs text-vgsblack line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-vgsgray mt-2">
                          {new Date(n.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;

