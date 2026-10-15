// src/components/admin/UserForm.jsx
import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../common/Button";
import Input from "../common/Input";
import Pin from "../common/Pin";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import {
  faIdBadge,
  faIdCard,
  faCircleUser,
  faAngleLeft,
  faArrowsRotate,
  faUserPlus,
  faShieldHalved,
  faUserEdit,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../common/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Sub-componentes
 */
const UserFormFields = memo(
  ({ formData, onFieldChange, isEditMode, activeGroupName }) => {
    return (
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          required
          type="text"
          label="Identification (ID)"
          icon={faIdCard}
          value={formData.cedula}
          onChange={(e) => onFieldChange("cedula", e.target.value)}
          placeholder="Enter ID number"
        />
        <Input
          required
          type="text"
          label="Name"
          icon={faIdBadge}
          value={formData.nombre}
          onChange={(e) => onFieldChange("nombre", e.target.value)}
          placeholder="Enter a name"
        />
        <div className="space-y-1">
          <Input
            type="select"
            label={`Role in ${activeGroupName || "Workgroup"}`}
            icon={faCircleUser}
            value={formData.rol}
            onChange={(e) => onFieldChange("rol", e.target.value)}
          >
            <option value="user">Standard User</option>
            <option value="administrator">Group Administrator</option>
          </Input>
          {formData.rol === "administrator" && (
            <p className="text-[10px] text-vgsdarkblue mt-1 font-bold uppercase italic">
              * Group Admins receive all permissions for this group
              automatically.
            </p>
          )}
        </div>

        <div className="flex items-end pb-2 mt-6.5">
          {isEditMode && (
            <label
              htmlFor="is_active"
              className="flex gap-2 px-3 py-2.5 bg-vgsgray/10 rounded-lg border border-dotted border-vgsgray w-full cursor-pointer hover:bg-vgsgray/20 transition-colors"
            >
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => onFieldChange("is_active", e.target.checked)}
                className="w-4 h-4 accent-vgsred rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-vgsblack">
                User Account Active
              </span>
            </label>
          )}
        </div>
      </fieldset>
    );
  },
);

const UserPermissionsSelector = memo(
  ({ allPermissions, selectedPermissions, loading, onToggle }) => {
    return (
      <section className="border-t pt-4 border-vgsgray">
        <header className="flex items-center gap-2 mb-3">
          <Badge variant="red" icon={faShieldHalved} size="md">
            Workgroup Permissions
          </Badge>
        </header>

        {loading ? (
          <div className="text-xs text-vgsblack animate-pulse py-4">
            Loading group permissions...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allPermissions.map((perm) => {
              const isActive = selectedPermissions.includes(perm.id);
              return (
                <label
                  key={perm.id}
                  className={`
                relative flex items-center p-2 rounded-lg border transition-all cursor-pointer
                ${isActive ? "bg-vgsred/10 border-vgsred/30 shadow-sm" : "bg-vgswhite border-vgsgray/50 hover:bg-vgsgray/20"}
              `}
                >
                  {isActive && (
                    <Pin
                      color="red"
                      size="sm"
                      position="top-right"
                      ping={true}
                    />
                  )}
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isActive}
                    onChange={() => onToggle(perm.id)}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold ${isActive ? "text-vgsred" : "text-vgsblack"}`}
                    >
                      {perm.name}
                    </span>
                    <span className="text-[10px] text-vgsblack leading-tight">
                      {perm.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </section>
    );
  },
);

/**
 * Componente Principal UserForm
 */
const UserForm = ({ onSubmit, onClose, initialData, isOpen = true }) => {
  const { token, can, activeGroup } = useAuth();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    rol: "user",
    is_active: true,
    permissions_ids: [],
  });
  const [allPermissions, setAllPermissions] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePermissionToggle = useCallback((permId) => {
    setFormData((prev) => {
      const isSelected = prev.permissions_ids.includes(permId);
      const newList = isSelected
        ? prev.permissions_ids.filter((id) => id !== permId)
        : [...prev.permissions_ids, permId];
      return { ...prev, permissions_ids: newList };
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await onSubmit(formData);
    if (res.success) {
      addNotification(
        "Success",
        "User and group permissions saved!",
        "success",
      );
      onClose();
    } else {
      addNotification("Error", res.error, "error");
    }
  };

  useEffect(() => {
    if (can("Manage Permissions")) {
      setLoadingPerms(true);
      api
        .getAllPermissions(token)
        .then((res) => {
          if (res.success) setAllPermissions(res.permissions);
        })
        .finally(() => {
          setLoadingPerms(false);
        });
    }
  }, [token, can]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        cedula: initialData.cedula || "",
        nombre: initialData.nombre || "",
        rol: initialData.rol || "user",
        user_id: initialData.user_id,
        is_active: initialData.is_active ?? true,
      }));
      if (can("Manage Permissions") && initialData.user_id) {
        api.getUserPermissions(token, initialData.user_id).then((res) => {
          if (res.success)
            setFormData((prev) => ({
              ...prev,
              permissions_ids: res.permissions.map((p) => p.id),
            }));
        });
      }
    }
  }, [initialData, token, can]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="user-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-vgsblack/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`
                relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden 
                pointer-events-auto border-t-4 ${initialData ? "border-vgsdarkblue" : "border-vgsred"}
                select-none flex flex-col max-h-[90vh]
              `}
          >
            {/* Header */}
            <header className="drag-handle cursor-grab active:cursor-grabbing p-6 bg-vgswhite flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-vgswhite ${initialData ? "bg-vgsdarkblue " : "bg-vgsred"}`}
              >
                <FontAwesomeIcon
                  icon={initialData ? faUserEdit : faUserPlus}
                  className="text-xl"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-vgsblack leading-none">
                  {initialData ? "Edit Member" : "Register Member"}
                </h3>
                <p className="text-[10px] text-vgsgray uppercase font-bold tracking-widest mt-1">
                  Workspace: {activeGroup?.name}
                </p>
              </div>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col overflow-hidden"
            >
              <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <UserFormFields
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  isEditMode={!!initialData}
                  activeGroupName={activeGroup?.name}
                />

                {can("Manage Permissions") &&
                  formData.rol !== "administrator" && (
                    <UserPermissionsSelector
                      allPermissions={allPermissions}
                      selectedPermissions={formData.permissions_ids}
                      loading={loadingPerms}
                      onToggle={handlePermissionToggle}
                    />
                  )}
              </main>

              <footer className="p-6 bg-gray-50 border-t flex flex-row-reverse gap-3">
                <Button
                  type="submit"
                  variant={initialData ? "blue" : "red"}
                  animation="shrink"
                  icon={initialData ? faArrowsRotate : faUserPlus}
                  iconClassName={initialData ? "animate-spin" : ""}
                  className="px-8"
                >
                  {initialData ? "Update Member" : "Create Member"}
                </Button>
                <Button
                  type="button"
                  variant="gray"
                  animation="shrink"
                  onClick={onClose}
                  icon={faAngleLeft}
                  className="px-6"
                >
                  Cancel
                </Button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserForm;
