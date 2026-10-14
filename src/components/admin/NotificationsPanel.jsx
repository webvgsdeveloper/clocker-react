// src/components/admin/NotificationPanel.jsx
import React, { useState, memo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  faPaperPlane,
  faBell,
  faExclamationTriangle,
  faInfoCircle,
  faCheckCircle,
  faExclamationCircle,
  faComments,
  faRobot,
  faPaintBrush,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Input from "../common/Input";
import Toast from "../common/Toast";
import ConfirmationBox from "../common/ConfirmationBox";
import api from "../../services/api";
import { useNotification } from "../../contexts/NotificationContext";
import {
  staggerContainer,
  slideInLeft,
  slideInRight
} from "../common/animations";

const containerVariants = staggerContainer(0.1, 0.2);

const NOTIFICATION_TYPES = [
  {
    id: "info",
    label: "Information",
    icon: faInfoCircle,
    color: "text-vgsgray",
  },
  {
    id: "success",
    label: "Success",
    icon: faCheckCircle,
    color: "text-vgsblack",
  },
  {
    id: "warning",
    label: "Warning",
    icon: faExclamationTriangle,
    color: "text-orange-500",
  },
  {
    id: "error",
    label: "Urgent/Error",
    icon: faExclamationCircle,
    color: "text-vgsred",
  },
  {
    id: "chat",
    label: "Chat Message",
    icon: faComments,
    color: "text-vgsdarkblue",
  },
  { id: "ai", label: "Clocker IA", icon: faRobot, color: "text-vgsblack" },
];

const TypeSelector = memo(({ selectedType, onSelect }) => (
  <fieldset className="space-y-4">
    <legend className="w-full">
      <Badge
        icon={faPaintBrush}
        variant="gray"
        size="md"
        className="w-full mb-5 flex justify-start"
      >
        Style / Type
      </Badge>
    </legend>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup">
      {NOTIFICATION_TYPES.map((t) => {
        const isSelected = selectedType === t.id;
        return (
          <Button
            key={t.id}
            variant="none"
            onClick={() => onSelect(t.id)}
            role="radio"
            aria-checked={isSelected}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-y-2 text-center focus:outline-none focus:ring-2 focus:ring-vgsgray/20 ${
              isSelected
                ? "border-vgsgray shadow-inner bg-white"
                : "border-transparent bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <Badge
              icon={t.icon}
              variant="none"
              size="md"
              iconSize="xl"
              className={`text-lg transition-colors ${isSelected ? t.color : "text-vgsblack/50"}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-tighter block mt-1">
                {t.label}
              </span>
            </Badge>
          </Button>
        );
      })}
    </div>
  </fieldset>
));

const NotificationsPanel = ({ token }) => {
  const { addNotification, showLoading, hideLoading } = useNotification();

  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info",
  });

  const handleTypeSelect = useCallback((typeId) => {
    setFormData((prev) => ({ ...prev, type: typeId }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      addNotification("Clocker IA", "Please fill in all fields", "info");
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmBroadcast = async () => {
    const loaderId = "global-noty";
    showLoading(
      loaderId,
      "Broadcasting",
      "Sending notification to everyone...",
    );
    setLoading(true);

    try {
      const res = await api.sendGlobalNotification(token, formData);
      if (res.success) {
        setFormData({ title: "", content: "", type: "info" });
        addNotification(
          "Clocker IA",
          "Notification broadcasted successfully!",
          "success",
        );
        setIsConfirmOpen(false);
      } else {
        addNotification("Clocker IA", "Error: " + res.error, "error");
      }
    } catch (error) {
      console.error("Broadcast Error:", error);
      addNotification("Clocker IA", "System error", "error");
    } finally {
      setLoading(false);
      hideLoading(loaderId);
    }
  };

  return (
    <>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <motion.section variants={slideInLeft}>
          <Card>
            <header className="flex items-center gap-3 mb-6">
              <Badge icon={faBell} variant="red" size="lg">
                Global Notifications
              </Badge>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              <TypeSelector
                selectedType={formData.type}
                onSelect={handleTypeSelect}
              />
              <div className="space-y-4">
                <Input
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ex: Maintenance Notice"
                />
                <Input
                  label="Content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="What do you want to tell everyone?"
                />
              </div>
              <Button
                type="submit"
                variant="red"
                animation="shrink gradient"
                icon={faPaperPlane}
                className="w-full py-4"
                disabled={loading}
              >
                {loading ? "Processing..." : "Notify Everyone"}
              </Button>
            </form>
          </Card>
        </motion.section>

        <motion.aside
          variants={slideInRight}
          className="flex flex-col gap-4"
        >
          <header>
            <Badge
              icon={faEye}
              variant="gray"
              size="md"
              className="w-full flex justify-start"
            >
              Live Preview
            </Badge>
          </header>

          <article className="bg-gray-100 rounded-2xl p-8 border-2 border-dashed border-vgsgray/30 flex items-center justify-center min-h-87.5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-50"></div>

            <div className="relative z-10 w-full flex justify-center">
              {!formData.title && !formData.content ? (
                <p className="text-vgsgray/40 italic text-sm">
                  Preview will appear here...
                </p>
              ) : (
                <Toast
                  id="preview"
                  title={formData.title || "No Title"}
                  message={formData.content || "No message content yet..."}
                  type={formData.type}
                  isPreview={true}
                />
              )}
            </div>
          </article>
        </motion.aside>
      </motion.main>

      {/* Confirmacion */}
      <ConfirmationBox
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmBroadcast}
        loading={loading}
        title="Send Global Notification"
        description=" This action cannot be undone."
        description2="You will send a real-time notification to ALL users."
        confirmText="Yes, Broadcast Now"
        cancelText="Cancel"
        variant="rec"
        icon={faBell}
        confirmIcon={faPaperPlane}
      />
    </>
  );
};

export default NotificationsPanel;
