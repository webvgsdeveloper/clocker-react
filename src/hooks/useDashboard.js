// src/hooks/useDashboard.js
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import api from "../services/api";

const ITEMS_PER_PAGE = 12;

export const useDashboard = (allTabs) => {
  const { token, can, user, socket } = useAuth();
  const { addNotification, showLoading, hideLoading } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total_records: 0, total_pages: 0 });
  const [sorting, setSorting] = useState({
    sortBy: "nombre",
    sortOrder: "ASC",
  });
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    estado: "",
    fechaInicio: null,
    fechaFin: null,
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const loadingRefs = useRef({ show: showLoading, hide: hideLoading });
  useEffect(() => {
    loadingRefs.current = { show: showLoading, hide: hideLoading };
  }, [showLoading, hideLoading]);

  const allowedTabs = useMemo(() => {
    return allTabs.filter((tab) => {
      if (!tab.perm) return true;
      if (Array.isArray(tab.perm)) {
        return tab.perm.some((p) => can(p));
      }
      return can(tab.perm);
    });
  }, [allTabs, can]);

  useEffect(() => {
    if (
      allowedTabs.length > 0 &&
      (!activeTab || !allowedTabs.find((t) => t.id === activeTab))
    ) {
      setActiveTab(allowedTabs[0].id);
    }
  }, [allowedTabs, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchData = useCallback(async () => {
    if (!token || !activeTab) return;

    if (activeTab !== "status" && activeTab !== "users") return;
    const loaderId = "fetch-dashboard-data";
    loadingRefs.current.show(
      loaderId,
      "Clocker System",
      "Synchronizing information...",
    );
    setLoading(true);

    try {
      let response;
      const params = {
        nombre: debouncedFilters.nombre,
        cedula: debouncedFilters.cedula,
        estado: debouncedFilters.estado,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
      };

      if (activeTab === "status") {
        response = await api.getAllStatus(token, params);
      } else {
        response = await api.getUsers(token, params);
      }

      if (response?.success) {
        setUsers(response.users || []);
        setMeta(response.meta || { total_records: 0, total_pages: 0 });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
      loadingRefs.current.hide(loaderId);
    }
  }, [token, activeTab, debouncedFilters, currentPage, sorting]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActionSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback((column) => {
    setSorting((prev) => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "ASC" ? "DESC" : "ASC",
    }));
  }, []);

  const handleCreateUser = useCallback(
    async (userData) => {
      const loaderId = "save-user";
      showLoading(loaderId, "User Management", "Saving user data...");
      try {
        const response = await api.createUser(token, userData);
        if (response.success) {
          if (can("Manage Permissions") && userData.permissions_ids) {
            await api.assignPermissions(
              token,
              response.user_id,
              userData.permissions_ids,
            );
          }
          handleActionSuccess();
          setShowUserForm(false);
          setEditingUser(null);
          return { success: true };
        }
        return { success: false, error: response.error };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        hideLoading(loaderId);
      }
    },
    [token, can, handleActionSuccess, showLoading, hideLoading],
  );

  const handleDeleteUser = useCallback(
    async (id) => {
      if (window.confirm("Are you sure you want to delete this user?")) {
        const lId = "delete-user";
        showLoading(lId, "Admin", "Deleting user...");
        try {
          const res = await api.deleteUser(token, id);
          if (res.success) handleActionSuccess();
        } catch (error) {
          console.error("Error deleting user:", error);
        } finally {
          hideLoading(lId);
        }
      }
    },
    [token, handleActionSuccess, showLoading, hideLoading],
  );

  const handleEditUser = useCallback((u) => {
    setEditingUser(u);
    setShowUserForm(true);
  }, []);

  // Socket listener for live updates
  useEffect(() => {
    if (!socket || !user?.user_id) return;

    console.log("[useDashboard] Registering live status listeners on socket");

    const handleUserStatusChanged = (data) => {
      console.log("[useDashboard] user_status_changed received:", data);
      const targetUserId = data?.user_id ?? data?.userId ?? data?.id;
      const newStatus = data?.status || data?.current_status;
      const newUpdate = data?.last_update || data?.lastUpdate || new Date().toISOString();

      if (targetUserId !== undefined) {
        setUsers((prev) =>
          prev.map((u) =>
            Number(u.user_id) === Number(targetUserId)
              ? {
                  ...u,
                  current_status: newStatus,
                  last_update: newUpdate,
                }
              : u,
          ),
        );
        setLastUpdate(new Date());
      }
    };

    const handleNewDirectMessage = (msg) => {
      if (
        msg.sender_id !== user.user_id &&
        activeTab !== "chat" &&
        Number(msg.sender_id) !== 0
      ) {
        addNotification(
          msg.sender_name || "Chat",
          msg.message || "New File",
          "chat",
          true,
          false,
          msg.sender_id,
        );
      }
    };

    socket.on("user_status_changed", handleUserStatusChanged);
    socket.on("status_updated", handleUserStatusChanged);
    socket.on("update_status_live", handleUserStatusChanged);
    socket.on("new_direct_message", handleNewDirectMessage);

    return () => {
      socket.off("user_status_changed", handleUserStatusChanged);
      socket.off("status_updated", handleUserStatusChanged);
      socket.off("update_status_live", handleUserStatusChanged);
      socket.off("new_direct_message", handleNewDirectMessage);
    };
  }, [socket, activeTab, user?.user_id, addNotification]);

  return {
    user,
    token,
    users,
    loading,
    showUserForm,
    setShowUserForm,
    editingUser,
    setEditingUser,
    activeTab,
    setActiveTab,
    lastUpdate,
    currentPage,
    setCurrentPage,
    sorting,
    handleSort,
    meta,
    filters,
    setFilters,
    debouncedFilters,
    allowedTabs,
    handleCreateUser,
    handleDeleteUser,
    handleEditUser,
  };
};
