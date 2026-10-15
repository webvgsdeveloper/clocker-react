// src/components/events/EventFormModal.jsx
import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  faCalendarPlus,
  faEdit,
  faXmark,
  faUsers,
  faGlobe,
  faBriefcase,
  faSearch,
  faCheck,
  faTag,
  faCalendarDays,
  faAngleLeft,
  faArrowsRotate,
  faVideo,
  faHeadset,
  faCopy,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Input from "../common/Input";
import Image from "../common/Image";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { toInputDateTime, toIsoDateTime } from "../../utils/formatters";


/**
 * Sub-componente: Campos principales del evento
 */
const EventFormFields = memo(
  ({ formData, onFieldChange, types, loadingTypes }) => {
    return (
      <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Título */}
        <div className="md:col-span-2">
          <Input
            required
            type="text"
            label="Título del Evento"
            icon={faCalendarPlus}
            value={formData.title}
            onChange={(e) => onFieldChange("title", e.target.value)}
            placeholder="Ej: Pausa Activa de Estiramiento / Capacitación de Equipo"
          />
        </div>

        {/* Tipo de Evento */}
        <div className="space-y-1 md:col-span-2">
          <Input
            type="select"
            label="Tipo de Evento *"
            icon={faTag}
            value={formData.event_type_id}
            onChange={(e) => onFieldChange("event_type_id", e.target.value)}
            disabled={loadingTypes}
          >
            {loadingTypes ? (
              <option value="">Cargando tipos de eventos...</option>
            ) : (
              types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))
            )}
          </Input>
        </div>

        {/* Fecha y Hora Inicio */}
        <Input
          required
          type="datetime-local"
          label="Fecha y Hora de Inicio"
          icon={faCalendarDays}
          value={formData.start_time}
          onChange={(e) => onFieldChange("start_time", e.target.value)}
        />

        {/* Fecha y Hora Fin */}
        <Input
          required
          type="datetime-local"
          label="Fecha y Hora de Fin"
          icon={faCalendarDays}
          value={formData.end_time}
          onChange={(e) => onFieldChange("end_time", e.target.value)}
        />

        {/* Descripción */}
        <div className="space-y-1 md:col-span-2">
          <label className="block mb-1.5 text-sm font-medium text-vgsblack cursor-pointer">
            Descripción o Instrucciones
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => onFieldChange("description", e.target.value)}
            rows={3}
            className="block w-full transition-all duration-200 outline-none focus:ring-2 appearance-none border border-vgsgray/50 bg-vgswhite focus:border-vgsgray focus:ring-vgsgray/20 rounded-lg p-3 text-sm text-vgsblack placeholder-vgsgray resize-none"
            placeholder="Detalles sobre la sesión, enlace de reunión virtual u objetivos para los asistentes..."
          />
        </div>
      </fieldset>
    );
  }
);

EventFormFields.displayName = "EventFormFields";

/**
 * Sub-componente: Selector de Audiencia y Destinatarios
 */
const EventAudienceSelector = memo(
  ({
    targetType,
    onTargetTypeChange,
    inviteeIds,
    onToggleInvitee,
    onClearInvitees,
    availableUsers,
    loadingUsers,
    userSearch,
    onUserSearchChange,
  }) => {
    const filteredUsers = availableUsers.filter((u) => {
      if (!userSearch.trim()) return true;
      const query = userSearch.toLowerCase();
      return (
        (u.nombre && u.nombre.toLowerCase().includes(query)) ||
        (u.cedula && String(u.cedula).includes(query))
      );
    });

    return (
      <section className="border-t pt-4 border-vgsgray">
        <header className="flex items-center gap-2 mb-3">
          <Badge variant="blue" icon={faUsers} size="md">
            Audiencia y Participantes
          </Badge>
        </header>

        {/* Audience Pill Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: "all", label: "Todos", icon: faGlobe },
            { id: "workgroup", label: "Mi Grupo", icon: faBriefcase },
            { id: "users", label: "Específicos", icon: faUsers },
          ].map((opt) => {
            const isSelected = targetType === opt.id;
            return (
              <Button
                key={opt.id}
                type="button"
                variant={isSelected ? "active" : "gray"}
                animation="shrink"
                icon={opt.icon}
                onClick={() => onTargetTypeChange(opt.id)}
                className={`py-2 px-2 text-xs font-semibold flex items-center justify-center gap-1.5 ${
                  isSelected ? "shadow-sm" : ""
                }`}
              >
                <span>{opt.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Specific Users Picker */}
        {targetType === "users" && (
          <div className="border border-vgsgray/30 rounded-xl p-3.5 bg-gray-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="blue" size="xs" icon={faUsers}>
                Participantes Seleccionados ({inviteeIds.length})
              </Badge>
              {inviteeIds.length > 0 && (
                <Button
                  variant="transparent"
                  animation="shrink"
                  onClick={onClearInvitees}
                  className="text-[11px] text-vgsred font-semibold p-0 hover:underline"
                >
                  Deseleccionar todos
                </Button>
              )}
            </div>

            <Input
              icon={faSearch}
              type="text"
              value={userSearch}
              onChange={(e) => onUserSearchChange(e.target.value)}
              placeholder="Buscar colaborador por nombre o cédula..."
              className="py-1.5 text-xs"
            />

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {loadingUsers ? (
                <p className="text-xs text-vgsgray py-3 text-center">
                  Cargando lista de colaboradores...
                </p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-vgsgray py-3 text-center">
                  No se encontraron colaboradores
                </p>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = inviteeIds.includes(u.user_id);
                  return (
                    <div
                      key={u.user_id}
                      onClick={() => onToggleInvitee(u.user_id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? "bg-vgsdarkblue/10 border border-vgsdarkblue/30 font-semibold"
                          : "bg-white hover:bg-gray-100 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={api.getFileUrl(u.profile_picture, u.nombre)}
                          alt={u.nombre}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                        <span className="text-vgsblack">{u.nombre}</span>
                        <span className="text-vgsgray text-[10px]">
                          ({u.cedula})
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-vgsdarkblue border-vgsdarkblue text-white"
                            : "border-vgsgray bg-white"
                        }`}
                      >
                        {isSelected && (
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-[10px]"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>
    );
  }
);

EventAudienceSelector.displayName = "EventAudienceSelector";

/**
 * Sub-componente: Configuración de Reunión Virtual / Videollamada
 */
const EventMeetingConfig = memo(
  ({
    hasMeeting,
    onHasMeetingChange,
    meetingType,
    onMeetingTypeChange,
    meetingSettings,
    onMeetingSettingChange,
    meetingCode,
  }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      if (!meetingCode) return;
      navigator.clipboard.writeText(meetingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <section className="border-t pt-4 border-vgsgray">
        <header className="flex items-center justify-between mb-3">
          <Badge variant="blue" icon={faVideo} size="md">
            Reunión Virtual / Videollamada
          </Badge>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasMeeting}
              onChange={(e) => onHasMeetingChange(e.target.checked)}
              className="w-4 h-4 accent-vgsred rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-vgsblack">
              Habilitar llamada para este evento
            </span>
          </label>
        </header>

        {hasMeeting && (
          <div className="bg-gray-50/80 border border-vgsgray/30 rounded-xl p-4 space-y-4">
            {/* Si ya existe código asignado */}
            {meetingCode && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-vgsgray/20">
                <div>
                  <span className="text-[10px] uppercase font-bold text-vgsgray block">
                    Código de Reunión Asignado
                  </span>
                  <span className="font-mono text-sm font-bold text-vgsdarkblue">
                    {meetingCode}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="gray"
                  size="xs"
                  animation="shrink"
                  icon={copied ? faCheck : faCopy}
                  onClick={handleCopy}
                  className="text-xs"
                >
                  {copied ? "Copiado" : "Copiar Código"}
                </Button>
              </div>
            )}

            {/* Tipo de Reunión: Video o Audio */}
            <div>
              <label className="block text-xs font-bold text-vgsblack uppercase tracking-wider mb-2">
                Tipo de Sala
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "video",
                    label: "Videollamada",
                    desc: "Cámara de video y audio",
                    icon: faVideo,
                  },
                  {
                    id: "audio",
                    label: "Sala de Voz",
                    desc: "Solo audio / micrófono",
                    icon: faHeadset,
                  },
                ].map((opt) => {
                  const isSelected = meetingType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onMeetingTypeChange(opt.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-vgsdarkblue/5 border-vgsdarkblue shadow-xs"
                          : "bg-white border-vgsgray/30 hover:border-vgsgray"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-vgsdarkblue text-white"
                            : "bg-gray-100 text-vgsgray"
                        }`}
                      >
                        <FontAwesomeIcon icon={opt.icon} className="text-sm" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-vgsblack block leading-snug">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-vgsgray block">
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ajustes de Reunión */}
            <div className="pt-2 border-t border-vgsgray/20 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={meetingSettings?.allow_screen_share ?? true}
                  onChange={(e) =>
                    onMeetingSettingChange(
                      "allow_screen_share",
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 accent-vgsred rounded cursor-pointer"
                />
                <span className="text-xs font-medium text-vgsblack">
                  Permitir a los participantes compartir pantalla
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={meetingSettings?.mute_on_entry ?? false}
                  onChange={(e) =>
                    onMeetingSettingChange("mute_on_entry", e.target.checked)
                  }
                  className="w-4 h-4 accent-vgsred rounded cursor-pointer"
                />
                <span className="text-xs font-medium text-vgsblack">
                  Silenciar micrófonos automáticamente al ingresar a la sala
                </span>
              </label>
            </div>
          </div>
        )}
      </section>
    );
  }
);

EventMeetingConfig.displayName = "EventMeetingConfig";

const EventFormModal = ({
  token: propToken,
  isOpen = true,
  onClose,
  onSuccess,
  initialData = null,
  activeGroupId = null,
  activeGroupName = "",
}) => {
  const { token: authToken, activeGroup } = useAuth();
  const token = propToken || authToken;
  const currentGroupId = activeGroupId || activeGroup?.id;
  const currentGroupName = activeGroupName || activeGroup?.name;

  const { addNotification } = useNotification();
  const isEditing = !!initialData?.id;

  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type_id: "",
    target_type: "all",
    target_workgroup_id: currentGroupId || "",
    invitee_ids: [],
    start_time: "",
    end_time: "",
    has_meeting: false,
    meeting_type: "video",
    meeting_settings: {
      allow_screen_share: true,
      mute_on_entry: false,
    },
    meeting_code: "",
  });

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTargetTypeChange = useCallback((targetType) => {
    setFormData((prev) => ({ ...prev, target_type: targetType }));
  }, []);

  const handleHasMeetingChange = useCallback((hasMeeting) => {
    setFormData((prev) => ({ ...prev, has_meeting: hasMeeting }));
  }, []);

  const handleMeetingTypeChange = useCallback((meetingType) => {
    setFormData((prev) => ({ ...prev, meeting_type: meetingType }));
  }, []);

  const handleMeetingSettingChange = useCallback((settingKey, value) => {
    setFormData((prev) => ({
      ...prev,
      meeting_settings: {
        ...prev.meeting_settings,
        [settingKey]: value,
      },
    }));
  }, []);

  const handleToggleInvitee = useCallback((userId) => {
    setFormData((prev) => {
      const exists = prev.invitee_ids.includes(userId);
      return {
        ...prev,
        invitee_ids: exists
          ? prev.invitee_ids.filter((id) => id !== userId)
          : [...prev.invitee_ids, userId],
      };
    });
  }, []);

  const handleClearInvitees = useCallback(() => {
    setFormData((prev) => ({ ...prev, invitee_ids: [] }));
  }, []);

  useEffect(() => {
    if (!token || !isOpen) return;
    let isMounted = true;
    const fetchTypes = async () => {
      setLoadingTypes(true);
      try {
        const res = await api.getEventTypes(token);
        if (isMounted) {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setTypes(list);
          if (list.length > 0 && !initialData?.event_type_id) {
            setFormData((prev) => ({ ...prev, event_type_id: list[0].id }));
          }
        }
      } catch (err) {
        console.error("Error loading event types:", err);
      } finally {
        if (isMounted) setLoadingTypes(false);
      }
    };
    fetchTypes();
    return () => { isMounted = false; };
  }, [token, isOpen, initialData]);

  useEffect(() => {
    if (!token || !isOpen || formData.target_type !== "users") return;
    let isMounted = true;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await api.getUsers(token, { limit: 100, page: 1 });
        if (isMounted && res?.success) {
          setAvailableUsers(res.users || []);
        }
      } catch (err) {
        console.error("Error loading users for event:", err);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => { isMounted = false; };
  }, [token, isOpen, formData.target_type]);

  useEffect(() => {
    if (initialData) {
      const hasMeetingInitial = Boolean(
        initialData.has_meeting ||
          (initialData.meeting_code && initialData.meeting_type !== "none")
      );
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        event_type_id: initialData.event_type_id || "",
        target_type: initialData.target_type || "all",
        target_workgroup_id: initialData.target_workgroup_id || currentGroupId || "",
        invitee_ids: initialData.invitees?.map((i) => i.user_id || i.id || i) || [],
        start_time: toInputDateTime(initialData.start_time),
        end_time: toInputDateTime(initialData.end_time),
        has_meeting: hasMeetingInitial,
        meeting_type:
          initialData.meeting_type && initialData.meeting_type !== "none"
            ? initialData.meeting_type
            : "video",
        meeting_settings: initialData.meeting_settings || {
          allow_screen_share: true,
          mute_on_entry: false,
        },
        meeting_code: initialData.meeting_code || "",
      });
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const start = new Date(now.getTime() + 3600000);
      const end = new Date(start.getTime() + 3600000);
      setFormData({
        title: "",
        description: "",
        event_type_id: types[0]?.id || "",
        target_type: "all",
        target_workgroup_id: currentGroupId || "",
        invitee_ids: [],
        start_time: toInputDateTime(start.toISOString()),
        end_time: toInputDateTime(end.toISOString()),
        has_meeting: false,
        meeting_type: "video",
        meeting_settings: {
          allow_screen_share: true,
          mute_on_entry: false,
        },
        meeting_code: "",
      });
    }
  }, [initialData, currentGroupId, types]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addNotification("Validación", "Por favor ingresa un título para el evento", "warning", true);
      return;
    }
    if (!formData.event_type_id) {
      addNotification("Validación", "Debes seleccionar un tipo de evento", "warning", true);
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      addNotification("Validación", "Debes especificar la fecha y hora de inicio y fin", "warning", true);
      return;
    }
    const startIso = toIsoDateTime(formData.start_time);
    const endIso = toIsoDateTime(formData.end_time);
    if (new Date(endIso) <= new Date(startIso)) {
      addNotification("Validación", "La fecha de finalización debe ser posterior a la de inicio", "warning", true);
      return;
    }
    if (formData.target_type === "users" && formData.invitee_ids.length === 0) {
      addNotification("Validación", "Debes seleccionar al menos un participante", "warning", true);
      return;
    }
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      event_type_id: Number(formData.event_type_id),
      target_type: formData.target_type,
      start_time: startIso,
      end_time: endIso,
      has_meeting: formData.has_meeting,
      meeting_type: formData.has_meeting ? formData.meeting_type : "none",
    };

    if (formData.has_meeting) {
      payload.meeting_settings = formData.meeting_settings;
    }

    if (formData.target_type === "workgroup") {
      payload.target_workgroup_id = currentGroupId;
    } else if (formData.target_type === "users") {
      payload.invitee_ids = formData.invitee_ids;
    }
    setLoading(true);
    try {
      let res;
      if (isEditing) {
        res = await api.updateEvent(token, initialData.id, payload);
      } else {
        res = await api.createEvent(token, payload);
      }
      if (res?.success) {
        addNotification("Éxito", isEditing ? "Evento actualizado correctamente" : "Evento programado con éxito", "success", true);
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        addNotification("Error", res?.error || "No se pudo guardar el evento", "error", true);
      }
    } catch (err) {
      console.error("Error saving event:", err);
      addNotification("Error", err.message, "error", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="event-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
        >
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-vgsblack/60 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
          />

          {/* Draggable Pop-up (idéntico al estilo UserForm) */}
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
              pointer-events-auto border-t-4 ${
                isEditing ? "border-vgsdarkblue" : "border-vgsred"
              }
              select-none flex flex-col max-h-[90vh]
            `}
          >
            {/* Header (Drag Handle) */}
            <header className="drag-handle cursor-grab active:cursor-grabbing p-6 bg-vgswhite flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-vgswhite ${
                  isEditing ? "bg-vgsdarkblue" : "bg-vgsred"
                }`}
              >
                <FontAwesomeIcon
                  icon={isEditing ? faEdit : faCalendarPlus}
                  className="text-xl"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-vgsblack leading-none truncate">
                  {isEditing ? "Editar Evento" : "Programar Evento"}
                </h3>
                <p className="text-[10px] text-vgsgray uppercase font-bold tracking-widest mt-1 truncate">
                  Workspace: {currentGroupName || "General"}
                </p>
              </div>
              <Button
                type="button"
                variant="transparent"
                animation="shrink"
                icon={faXmark}
                onClick={onClose}
                className="text-vgsgray hover:text-vgsblack p-2 text-base"
                title="Cerrar"
              />
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col overflow-hidden"
            >
              <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <EventFormFields
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  types={types}
                  loadingTypes={loadingTypes}
                />

                <EventAudienceSelector
                  targetType={formData.target_type}
                  onTargetTypeChange={handleTargetTypeChange}
                  inviteeIds={formData.invitee_ids}
                  onToggleInvitee={handleToggleInvitee}
                  onClearInvitees={handleClearInvitees}
                  availableUsers={availableUsers}
                  loadingUsers={loadingUsers}
                  userSearch={userSearch}
                  onUserSearchChange={setUserSearch}
                />

                <EventMeetingConfig
                  hasMeeting={formData.has_meeting}
                  onHasMeetingChange={handleHasMeetingChange}
                  meetingType={formData.meeting_type}
                  onMeetingTypeChange={handleMeetingTypeChange}
                  meetingSettings={formData.meeting_settings}
                  onMeetingSettingChange={handleMeetingSettingChange}
                  meetingCode={formData.meeting_code}
                />
              </main>
              <footer className="p-6 bg-gray-50 border-t flex flex-row-reverse gap-3">
                <Button type="submit" variant={isEditing ? "blue" : "red"} animation="shrink" icon={isEditing ? faArrowsRotate : faCalendarPlus} iconClassName={loading ? "animate-spin" : ""} className="px-8" disabled={loading}>
                  {loading ? "Guardando..." : isEditing ? "Actualizar Evento" : "Crear Evento"}
                </Button>
                <Button type="button" variant="gray" animation="shrink" onClick={onClose} icon={faAngleLeft} className="px-6" disabled={loading}>
                  Cancelar
                </Button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventFormModal;
