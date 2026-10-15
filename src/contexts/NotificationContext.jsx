import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Toast from "../components/common/Toast";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeToasts, setActiveToasts] = useState([]);
  const [mutedUserIds, setMutedUserIds] = useState([]);
  const audioEnabled = useRef(false);
  const loadingTimeouts = useRef({});

  useEffect(() => {
    const unlock = () => {
      audioEnabled.current = true;
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  const mutedUserIdsRef = useRef(mutedUserIds);
  mutedUserIdsRef.current = mutedUserIds;

  const activeToastsRef = useRef(activeToasts);
  activeToastsRef.current = activeToasts;

  const updateMutedUsers = useCallback((ids) => {
    setMutedUserIds(ids);
  }, []);

  const removeToast = useCallback((id) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addNotification = useCallback(
    (
      title,
      message,
      type = "info",
      isNew = true,
      streaming = false,
      senderId = null,
      customId = null
    ) => {
      if (
        type === "chat" &&
        senderId &&
        mutedUserIdsRef.current.includes(Number(senderId))
      ) {
        return;
      }

      const id = customId || Date.now();
      
      if (type === "loading" && activeToastsRef.current.some(t => t.id === id)) {
        return id;
      }

      const newNotif = {
        id,
        title,
        message,
        type,
        date: new Date(),
        read: false,
        streaming,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      if (isNew) {
        if (audioEnabled.current && type !== "loading") {
          const audio = new Audio("sounds/noty.mp3");
          audio.play().catch(() => {});
        }

        if (document.hidden && Notification.permission === "granted" && type !== "loading") {
          new Notification(title, { body: message });
        }

        setActiveToasts((prev) => [...prev, newNotif]);
      }
      return id;
    },
    [],
  );

  /**
   * @param {string} loaderId
   */
  const showLoading = useCallback((loaderId, title, message) => {
    if (loadingTimeouts.current[loaderId]) return;

    loadingTimeouts.current[loaderId] = setTimeout(() => {
      addNotification(title, message, "loading", true, false, null, loaderId);
      delete loadingTimeouts.current[loaderId];
    }, 1000);
  }, [addNotification]);

  const hideLoading = useCallback((loaderId) => {
    if (loadingTimeouts.current[loaderId]) {
      clearTimeout(loadingTimeouts.current[loaderId]);
      delete loadingTimeouts.current[loaderId];
    }
    removeToast(loaderId);
  }, [removeToast]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      showLoading,
      hideLoading,
      markAllAsRead,
      updateMutedUsers,
    }),
    [
      notifications,
      addNotification,
      showLoading,
      hideLoading,
      markAllAsRead,
      updateMutedUsers,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-3 right-3 z-9999 pointer-events-none flex flex-col items-end">
        {activeToasts.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <Toast
              {...n}
              streaming={n.streaming}
              onClose={() => removeToast(n.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};