import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import api from "../services/api";
import { io } from "socket.io-client";
import { useNotification } from "./NotificationContext";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const { exp } = JSON.parse(jsonPayload);
    return Date.now() >= exp * 1000;
  } catch (_error) {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const socket = useRef(null);
  const { addNotification } = useNotification();

  const logout = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        await api.logout(storedToken);
      }
    } catch (error) {
      console.error("Error during status logout:", error);
    } finally {
      if (socket.current) socket.current.disconnect();
      socket.current = null;
      setSocketInstance(null);
      setToken(null);
      setUser(null);
      setActiveGroup(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeGroupId");
      sessionStorage.removeItem("vgs_welcomed");
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const isLoggedIn = !!localStorage.getItem("token");
      if (isLoggedIn) {
        e.preventDefault();
        e.returnValue = "";
        addNotification(
          "Clo IA",
          "Remember to log out properly before leaving.",
          "info",
          true,
          true,
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [addNotification]);

  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(token)) {
        addNotification(
          "Clo IA",
          "Your session has expired due to inactivity. Logging out...",
          "info",
          true,
          true,
        );
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, [token, logout, addNotification]);

  const switchGroup = useCallback(
    (groupId) => {
      if (!user || !user.workgroups) return;
      const group = user.workgroups.find((g) => g.id === Number(groupId));
      if (group) {
        setActiveGroup(group);
        localStorage.setItem("activeGroupId", group.id);
        window.location.reload();
      }
    },
    [user],
  );

  const initSocket = useCallback(
    (userId) => {
      if (!userId) return;

      if (socket.current && socket.current.connected) {
        console.log("[AuthContext] Socket already connected, emitting join_private:", userId);
        socket.current.emit("join_private", userId);
        return;
      }
      if (socket.current) socket.current.disconnect();

      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        secure: true,
        reconnection: true,
        rejectUnauthorized: false,
      });

      socket.current = newSocket;
      setSocketInstance(newSocket);

      newSocket.on("connect", () => {
        console.log("[AuthContext] Socket connected, joining private room:", userId);
        newSocket.emit("join_private", userId);
      });

      if (newSocket.connected) {
        newSocket.emit("join_private", userId);
      }

      if (newSocket.io) {
        newSocket.io.on("reconnect", () => {
          console.log("[AuthContext] Socket reconnected, re-joining private room:", userId);
          newSocket.emit("join_private", userId);
        });
      }

      newSocket.on("global_notification", (data) => {
        console.log("Notificación global recibida:", data);
        addNotification(data.title, data.content, data.type || "info", true);
      });
      return () => {
        if (newSocket) {
          newSocket.off("global_notification");
        }
      };
    },
    [addNotification],
  );

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedGroupId = localStorage.getItem("activeGroupId");

    if (storedToken && isTokenExpired(storedToken)) {
      logout();
      setLoading(false);
      return;
    }

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);

      if (parsedUser.workgroups && parsedUser.workgroups.length > 0) {
        const initialGroup =
          parsedUser.workgroups.find((g) => g.id === Number(storedGroupId)) ||
          parsedUser.workgroups[0];
        setActiveGroup(initialGroup);
        localStorage.setItem("activeGroupId", initialGroup.id);
      }

      initSocket(parsedUser.user_id);
    }
    setLoading(false);

    const handleUnauthorized = () => logout();
    window.addEventListener("unauthorized-access", handleUnauthorized);

    return () => {
      window.removeEventListener("unauthorized-access", handleUnauthorized);
    };
  }, [logout, initSocket]);

  const login = useCallback(
    async (cedula) => {
      try {
        const response = await api.login(cedula);
        if (response.success) {
          setToken(response.token);
          setUser(response.user);

          if (response.user.workgroups && response.user.workgroups.length > 0) {
            const defaultGroup = response.user.workgroups[0];
            setActiveGroup(defaultGroup);
            localStorage.setItem("activeGroupId", defaultGroup.id);
          }

          localStorage.setItem("token", response.token);
          localStorage.setItem("user", JSON.stringify(response.user));
          initSocket(response.user.user_id);
          return { success: true };
        }
        return { success: false, error: response.error };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [initSocket],
  );

  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const can = useCallback(
    (permissionName) => {
      if (!user) return false;
      if (user.rol === "administrator") return true;

      if (activeGroup) {
        if (activeGroup.role === "administrator") return true;
        if (activeGroup.permissions && Array.isArray(activeGroup.permissions)) {
          const search = String(permissionName).trim().toLowerCase();
          return activeGroup.permissions.some(
            (p) => String(p).trim().toLowerCase() === search,
          );
        }
      }
      return false;
    },
    [user, activeGroup],
  );

  const isAdmin = useMemo(
    () =>
      activeGroup?.role === "administrator" || user?.rol === "administrator",
    [activeGroup?.role, user?.rol],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      activeGroup,
      socket: socketInstance || socket.current,
      loading,
      login,
      logout,
      updateUser,
      switchGroup,
      can,
      isAdmin,
    }),
    [
      user,
      token,
      activeGroup,
      socketInstance,
      loading,
      login,
      logout,
      updateUser,
      switchGroup,
      can,
      isAdmin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};