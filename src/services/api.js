// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {
  getFileUrl(path, name = "User") {
    if (!path || path === "null" || path === "undefined") {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
    }
    if (path.startsWith("http")) return path;
    const backendBase = API_BASE_URL.replace(/\/api$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${backendBase}${cleanPath}`;
  }

  buildUrl(endpoint) {
    return `${API_BASE_URL}/${endpoint}`;
  }

  getActiveGroupId() {
    return localStorage.getItem("activeGroupId");
  }

  async post(endpoint, args, token = null) {
    try {
      const isFormData = args instanceof FormData;
      const headers = {};
      if (!isFormData) headers["Content-Type"] = "application/json";
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const workgroupId = this.getActiveGroupId();
      if (workgroupId) headers["x-workgroup-id"] = workgroupId;

      const response = await fetch(this.buildUrl(endpoint), {
        method: "POST",
        headers: headers,
        body: isFormData ? args : JSON.stringify(args),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event("unauthorized-access"));
        throw new Error("Sesión expirada");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error en el servidor");
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async get(endpoint, token = null) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const workgroupId = this.getActiveGroupId();
      if (workgroupId) headers["x-workgroup-id"] = workgroupId;

      const response = await fetch(this.buildUrl(endpoint), {
        method: "GET",
        headers: headers,
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event("unauthorized-access"));
        throw new Error("Sesión expirada");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error en el servidor");
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async put(endpoint, body, token = null) {
    try {
      const isFormData = body instanceof FormData;
      const headers = {};
      if (!isFormData) headers["Content-Type"] = "application/json";
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const workgroupId = this.getActiveGroupId();
      if (workgroupId) headers["x-workgroup-id"] = workgroupId;

      const response = await fetch(this.buildUrl(endpoint), {
        method: "PUT",
        headers: headers,
        body: isFormData ? body : JSON.stringify(body),
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event("unauthorized-access"));
        throw new Error("Sesión expirada");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error en el servidor");
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(endpoint, token = null) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const workgroupId = this.getActiveGroupId();
      if (workgroupId) headers["x-workgroup-id"] = workgroupId;

      const response = await fetch(this.buildUrl(endpoint), {
        method: "DELETE",
        headers: headers,
      });
      if (response.status === 401) {
        window.dispatchEvent(new Event("unauthorized-access"));
        throw new Error("Sesión expirada");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error en el servidor");
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async login(cedula) {
    return this.post("auth/login", { cedula });
  }
  async logout(token) {
    return this.post("auth/logout", {}, token);
  }
  async getMyStatus(token) {
    return this.get("users/my-status", token);
  }
  async updateProfile(token, formData) {
    return this.put("users/update-profile", formData, token);
  }

  async updateStatus(token, newStatus) {
    return this.post("status/update", { newStatus }, token);
  }

  async getHistory(token, params) {
    return this.post(
      "status/history",
      {
        user_id: params.cedula,
        name: params.nombre,
        status: params.estado,
        start_date: params.start_date,
        end_date: params.end_date,
        page: params.page,
        limit: params.limit,
        workgroup_id: this.getActiveGroupId(),
      },
      token,
    );
  }

  async getAllStatus(token, filters = {}) {
    return this.post(
      "users/get-users",
      {
        nombre: filters.nombre,
        cedula: filters.cedula,
        estado: filters.estado,
        page: filters.page || 1,
        limit: filters.limit || 10,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        workgroup_id: this.getActiveGroupId(),
      },
      token,
    );
  }

  async getUsers(token, params = {}) {
    return this.post(
      "users/get-users",
      {
        nombre: params.nombre,
        cedula: params.cedula,
        page: params.page || 1,
        limit: params.limit || 10,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        workgroup_id: this.getActiveGroupId(),
      },
      token,
    );
  }

  async createUser(token, userData) {
    return this.post("users/upsert", { ...userData }, token);
  }

  async deleteUser(token, userId) {
    return this.post("users/delete", { user_id: userId }, token);
  }

  async getAllPermissions(token) {
    return this.get("users/permissions/all", token);
  }

  async getUserPermissions(token, userId) {
    return this.get(`users/permissions/user/${userId}`, token);
  }

  async assignPermissions(token, userId, permissionsIds) {
    return this.post(
      "users/permissions/assign",
      { user_id: userId, permissions_ids: permissionsIds },
      token,
    );
  }

  async getChatList(token, filters = {}) {
    return this.post(
      "chat/list",
      {
        nombre: filters.nombre,
        estado: filters.estado,
        workgroup_id: this.getActiveGroupId(),
      },
      token,
    );
  }

  async getMessages(token, contactId) {
    return this.get(`chat/messages/${contactId}`, token);
  }

  async sendChatMessage(token, receiverId, message, file = null) {
    if (file) {
      const formData = new FormData();
      formData.append("receiver_id", receiverId);
      if (message) formData.append("message", message);
      formData.append("file", file);
      return this.post("chat/send", formData, token);
    }
    return this.post("chat/send", { receiver_id: receiverId, message }, token);
  }

  async toggleMuteChat(token, contactId, isMuted) {
    return this.post(
      "chat/mute",
      { contact_id: contactId, is_muted: isMuted ? 1 : 0 },
      token,
    );
  }

  async deleteChatConversation(token, contactId) {
    return this.post("chat/delete", { contact_id: contactId }, token);
  }

  async checkChatNotifications(token) {
    return this.get("chat/notifications", token);
  }

  async sendGlobalNotification(token, data) {
    return this.post("notifications/global", data, token);
  }

  async getMetrics(token, filters = {}) {
    return this.post(
      "reports/metrics",
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
        userId: filters.userId,
        workgroupId: this.getActiveGroupId(),
      },
      token,
    );
  }

  async getMyStats(token, filters = {}) {
    return this.post(
      "users/my-stats",
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      token,
    );
  }

  async exportExcel(token, filters = {}) {
    // eslint-disable-next-line no-useless-catch
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-workgroup-id": this.getActiveGroupId(),
      };

      const response = await fetch(this.buildUrl("reports/export"), {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: filters.userId,
          workgroupId: this.getActiveGroupId(),
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      return blob;
    } catch (error) {
      throw error;
    }
  }

  // Events Endpoints
  async getEventTypes(token) {
    return this.get("events/types", token);
  }

  async getEvents(token, params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.scope) queryParams.append("scope", params.scope);
    if (params.workgroup_id)
      queryParams.append("workgroup_id", params.workgroup_id);
    if (params.start_date) queryParams.append("start_date", params.start_date);
    if (params.end_date) queryParams.append("end_date", params.end_date);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const qs = queryParams.toString();
    const endpoint = qs ? `events?${qs}` : "events";
    return this.get(endpoint, token);
  }

  async getEventById(token, id) {
    return this.get(`events/${id}`, token);
  }

  async createEvent(token, data) {
    return this.post("events", data, token);
  }

  async updateEvent(token, id, data) {
    return this.put(`events/${id}`, data, token);
  }

  async deleteEvent(token, id) {
    return this.delete(`events/${id}`, token);
  }

  async confirmAttendance(token, eventId, attended) {
    return this.post(`events/${eventId}/attendance`, { attended }, token);
  }

  async bulkConfirmAttendance(token, eventId, attendees) {
    return this.post(`events/${eventId}/attendance/bulk`, { attendees }, token);
  }

  async getPendingAttendance(token) {
    return this.get("events/pending-attendance", token);
  }

  async getMeetingInfo(token, code) {
    return this.get(`events/meeting/${code}`, token);
  }
}

export default new ApiService();
