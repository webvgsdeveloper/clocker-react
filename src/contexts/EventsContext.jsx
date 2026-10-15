// src/contexts/EventsContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import api from "../services/api";

const EventsContext = createContext();

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};

/**
 * Helper to validate user creation/editing permissions for events
 * according to backend rules.
 */
export function canCreateEvents(user, currentWorkgroupId) {
  if (!user) return false;
  if (user.rol === "administrator") return true;
  if (!user.workgroups || !currentWorkgroupId) return false;
  const group = user.workgroups.find(
    (g) => Number(g.id) === Number(currentWorkgroupId)
  );
  if (!group) return false;
  return (
    group.role === "administrator" ||
    (Array.isArray(group.permissions) &&
      group.permissions.includes("create_events"))
  );
}

export const EventsProvider = ({ children }) => {
  const { user, token, socket, activeGroup } = useAuth();
  const { addNotification } = useNotification();

  const [pendingAttendances, setPendingAttendances] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [activePromptEvent, setActivePromptEvent] = useState(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);

  const userCanCreate = useMemo(() => {
    return canCreateEvents(user, activeGroup?.id);
  }, [user, activeGroup?.id]);

  const fetchPendingAttendances = useCallback(async () => {
    if (!token) return;
    setLoadingPending(true);
    try {
      const res = await api.getPendingAttendance(token);
      if (res && (res.success || Array.isArray(res.data) || Array.isArray(res))) {
        const items = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.pending)
          ? res.pending
          : [];
        setPendingAttendances(items);
      }
    } catch (err) {
      console.error("[EventsContext] Error fetching pending attendances:", err);
    } finally {
      setLoadingPending(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingAttendances();
  }, [fetchPendingAttendances]);

  const confirmAttendance = useCallback(
    async (eventId, attended) => {
      if (!token) return { success: false, error: "No token available" };
      try {
        const res = await api.confirmAttendance(token, eventId, attended);
        if (res.success) {
          setPendingAttendances((prev) =>
            prev.filter((e) => (e.id || e.event_id) !== eventId)
          );
          if (
            activePromptEvent &&
            (activePromptEvent.event_id === eventId ||
              activePromptEvent.id === eventId)
          ) {
            setIsPromptOpen(false);
            setActivePromptEvent(null);
          }
          addNotification(
            "Attendance Recorded",
            attended
              ? "You confirmed your attendance. Thank you!"
              : "Marked as absent.",
            "success",
            true
          );
          setEventsRefreshKey((k) => k + 1);
          return { success: true };
        } else {
          addNotification(
            "Attendance Error",
            res.error || "Could not record attendance.",
            "error",
            true
          );
          return { success: false, error: res.error };
        }
      } catch (err) {
        console.error("[EventsContext] Attendance confirmation error:", err);
        addNotification("System Error", err.message, "error", true);
        return { success: false, error: err.message };
      }
    },
    [token, activePromptEvent, addNotification]
  );

  const openPrompt = useCallback((event) => {
    setActivePromptEvent(event);
    setIsPromptOpen(true);
  }, []);

  const closePrompt = useCallback(() => {
    setIsPromptOpen(false);
    setActivePromptEvent(null);
  }, []);

  const triggerRefresh = useCallback(() => {
    setEventsRefreshKey((k) => k + 1);
  }, []);

  // WebSocket Listeners for real-time events
  useEffect(() => {
    if (!socket || !user?.user_id) return;

    const handleAttendancePrompt = (data) => {
      console.log("[EventsContext] Received event_attendance_prompt:", data);
      const eventId = data?.event_id ?? data?.id;
      if (eventId) {
        setPendingAttendances((prev) => {
          const exists = prev.some((e) => (e.id || e.event_id) === eventId);
          if (exists) return prev;
          return [data, ...prev];
        });
      }
      setActivePromptEvent(data);
      setIsPromptOpen(true);
      addNotification(
        data.title || "Confirm Attendance",
        data.message ||
          "The event has concluded. Please confirm whether you attended.",
        "info",
        true
      );
    };

    const handleEventCreated = (event) => {
      console.log("[EventsContext] Received event_created:", event);
      addNotification(
        "New Event",
        `Scheduled: ${event?.title || "New event added"}`,
        "info",
        true
      );
      setEventsRefreshKey((k) => k + 1);
    };

    const handleEventUpdated = (event) => {
      console.log("[EventsContext] Received event_updated:", event);
      addNotification(
        "Event Updated",
        `Event "${event?.title || ""}" has been updated.`,
        "info",
        true
      );
      setEventsRefreshKey((k) => k + 1);
    };

    const handleEventDeleted = (data) => {
      console.log("[EventsContext] Received event_deleted:", data);
      const deletedId = data?.event_id ?? data?.id;
      if (deletedId) {
        setPendingAttendances((prev) =>
          prev.filter((e) => (e.id || e.event_id) !== deletedId)
        );
      }
      addNotification(
        "Event Cancelled",
        "An event has been cancelled or removed.",
        "warning",
        true
      );
      setEventsRefreshKey((k) => k + 1);
    };

    const handleAttendanceUpdated = (data) => {
      console.log("[EventsContext] Received event_attendance_updated:", data);
      setEventsRefreshKey((k) => k + 1);
    };

    socket.on("event_attendance_prompt", handleAttendancePrompt);
    socket.on("event_created", handleEventCreated);
    socket.on("event_updated", handleEventUpdated);
    socket.on("event_deleted", handleEventDeleted);
    socket.on("event_attendance_updated", handleAttendanceUpdated);

    return () => {
      socket.off("event_attendance_prompt", handleAttendancePrompt);
      socket.off("event_created", handleEventCreated);
      socket.off("event_updated", handleEventUpdated);
      socket.off("event_deleted", handleEventDeleted);
      socket.off("event_attendance_updated", handleAttendanceUpdated);
    };
  }, [socket, user?.user_id, addNotification]);

  const value = useMemo(
    () => ({
      pendingAttendances,
      loadingPending,
      activePromptEvent,
      isPromptOpen,
      eventsRefreshKey,
      userCanCreate,
      canCreateEvents,
      fetchPendingAttendances,
      confirmAttendance,
      openPrompt,
      closePrompt,
      triggerRefresh,
    }),
    [
      pendingAttendances,
      loadingPending,
      activePromptEvent,
      isPromptOpen,
      eventsRefreshKey,
      userCanCreate,
      fetchPendingAttendances,
      confirmAttendance,
      openPrompt,
      closePrompt,
      triggerRefresh,
    ]
  );

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
};
