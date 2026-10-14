// src/components/dashboard/StatusManager.jsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import CurrentStatus from "./CurrentStatus";
import StatusButtons from "./StatusButtons";
import Card from "../common/Card";
import List from "../common/List";
import ConfirmationBox from "../common/ConfirmationBox";
import { faPersonChalkboard } from "@fortawesome/free-solid-svg-icons";
import { STATUS_CONFIG } from "../layout/statusConfig";
import { 
  staggerContainer, 
  springUp 
} from "../common/animations";

// Definimos el contenedor con el stagger exacto que tenías (0.15)
const managerContainer = staggerContainer(0.15);

const StatusManager = () => {
  const { user, token, socket } = useAuth();
  const { showLoading, hideLoading } = useNotification();
  const [currentStatus, setCurrentStatus] = useState("offline");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    pendingStatus: null,
    title: "",
    description: "",
    variant: "blue",
    icon: null,
    confirmText: "Yes",
  });

  const loadStatus = useCallback(async () => {
    const response = await api.getMyStatus(token);
    if (response.success && response.status) {
      setCurrentStatus(response.status.current_status || "offline");
      setLastUpdate(response.status.last_update);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleStatusChangeInitiated = (newStatus) => {
    const config = STATUS_CONFIG[newStatus];
    let variant = "blue";
    let description = `You are about to change your status to ${config.label}.`;
    let icon = config?.icon || null;
    let confirmText = "Yes, Change";
    switch (newStatus) {
      case "online":
        variant = "online";
        description = "You will be available";
        confirmText = "Go Online";
        break;
      case "break":
        variant = "break";
        description = "Enjoy your break! Remember to come back in 10 minutes.";
        confirmText = "Let's Take a Break";
        break;
      case "lunch":
        variant = "lunch";
        description = "Time to recharge! Enjoy your meal.";
        confirmText = "Let's have Lunch";
        break;
      case "brb":
        variant = "brb";
        description = "You will be marked as 'Be Righ Back'.";
        confirmText = "I'll be back";
        break;
      case "rec":
        variant = "rec";
        description = "This status is for marketing purposes only.";
        confirmText = "Let's start Recording";
        break;
      case "coaching":
        variant = "coaching";
        description = "Let's make this a constructive time";
        confirmText = "Start Coaching";
        break;
      case "team_meeting":
        variant = "team_meeting";
        description = "You will be marked as 'In a Meeting'.";
        confirmText = "Join Meeting";
        break;
      case "away":
        variant = "away";
        description = "You will be marked as 'Away'.";
        confirmText = "Set Away";
        break;
      default:
        break;
    }

    setConfirmModal({
      isOpen: true,
      pendingStatus: newStatus,
      title: `Switch to ${config.label}?`,
      icon: icon,
      confirmIcon: icon,
      description: description,
      variant: variant,
      confirmText: confirmText,
    });
  };

  const executeStatusChange = async () => {
    const newStatus = confirmModal.pendingStatus;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    const loaderId = "status-update";
    showLoading(loaderId, "Status Sync", "Updating your status live...");
    setLoading(true);

    try {
      const response = await api.updateStatus(token, newStatus);
      if (response.success) {
        const now = new Date().toISOString();
        setCurrentStatus(newStatus);
        setLastUpdate(now);
        if (socket) {
          console.log("[StatusManager] Emitting update_status_live:", {
            user_id: user?.user_id,
            status: newStatus,
            name: user?.nombre,
            last_update: now,
          });
          socket.emit("update_status_live", {
            user_id: user?.user_id,
            status: newStatus,
            name: user?.nombre,
            last_update: now,
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      hideLoading(loaderId);
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      initial="hidden"
      animate="visible"
      variants={managerContainer}
    >
      <motion.div variants={springUp}>
        <Card>
          <CurrentStatus status={currentStatus} lastUpdate={lastUpdate} />
        </Card>
      </motion.div>
      <motion.div variants={springUp}>
        <Card>
          <StatusButtons
            currentStatus={currentStatus}
            onStatusChange={handleStatusChangeInitiated}
            loading={loading}
          />
        </Card>
      </motion.div>
      <ConfirmationBox
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        icon={confirmModal.icon}
        confirmIcon={confirmModal.confirmIcon}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        onConfirm={executeStatusChange}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        loading={loading}
      />
      <motion.div variants={springUp} className="col-span-1 lg:col-span-2">
        <Card>
          <List
            title="User Guidelines"
            titleIcon={faPersonChalkboard}
            items={[
              "Sync your status in real-time with your team.",
              "All changes are logged for performance history.",
              "Keep your status updated to improve office communication.",
            ]}
            colorScheme="red"
          />
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StatusManager;