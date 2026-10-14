// src/components/events/EventDetailModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  faCalendarCheck,
  faXmark,
  faUsers,
  faCrown,
  faCheck,
  faSearch,
  faSave,
  faRotateRight,
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
import { useNotification } from "../../contexts/NotificationContext";
import { useEvents } from "../../contexts/EventsContext";
import { useMeeting } from "../../contexts/MeetingContext";
import { formatDateTime } from "../../utils/formatters";
import { popIn } from "../common/animations";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const EventDetailModal = ({
  token,
  eventId,
  isOpen,
  onClose,
  isAdminOrOrganizer = false,
}) => {
  const { addNotification } = useNotification();
  const { confirmAttendance, eventsRefreshKey } = useEvents();
  const { joinMeeting } = useMeeting();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState(false);

  // Bulk edit state: { [userId]: attended (boolean) }
  const [editingAttendance, setEditingAttendance] = useState({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!token || !eventId) return;
    setLoading(true);
    try {
      const res = await api.getEventById(token, eventId);
      if (res?.success && res.data) {
        setEventData(res.data);
        setEditingAttendance({});
        setHasChanges(false);
      } else {
        addNotification(
          "Error",
          res?.error || "No se pudo cargar el detalle del evento",
          "error"
        );
      }
    } catch (err) {
      console.error("Error fetching event detail:", err);
      addNotification("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, eventId, addNotification]);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchDetail();
    }
  }, [isOpen, eventId, fetchDetail, eventsRefreshKey]);

  const handleSelfConfirm = async (attended) => {
    const res = await confirmAttendance(eventId, attended);
    if (res?.success) {
      fetchDetail();
    }
  };

  const handleToggleUserAttendance = (userId, attended) => {
    setEditingAttendance((prev) => ({ ...prev, [userId]: attended }));
    setHasChanges(true);
  };

  const handleSaveBulk = async () => {
    const attendees = Object.entries(editingAttendance).map(
      ([userId, attended]) => ({
        user_id: Number(userId),
        attended: Boolean(attended),
      })
    );

    if (attendees.length === 0) return;

    setSavingBulk(true);
    try {
      const res = await api.bulkConfirmAttendance(token, eventId, attendees);
      if (res?.success) {
        addNotification(
          "Asistencia Actualizada",
          "Se guardaron los cambios de asistencia.",
          "success",
          true
        );
        fetchDetail();
      } else {
        addNotification(
          "Error",
          res?.error || "No se pudo actualizar la asistencia",
          "error",
          true
        );
      }
    } catch (err) {
      console.error("Error bulk updating attendance:", err);
      addNotification("Error", err.message, "error", true);
    } finally {
      setSavingBulk(false);
    }
  };

  const participants = useMemo(() => {
    if (!eventData?.participants) return [];
    return eventData.participants.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const currentStatus =
        editingAttendance[p.user_id] !== undefined
          ? editingAttendance[p.user_id]
            ? "attended"
            : "absent"
          : p.attendance_status;

      const matchesStatus =
        statusFilter === "all" || currentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [eventData, searchTerm, statusFilter, editingAttendance]);

  if (!isOpen) return null;

  const stats = eventData?.stats || {
    total_invited: 0,
    total_attended: 0,
    total_absent: 0,
    total_pending: 0,
  };

  const myParticipation = eventData?.my_participation;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 bg-vgsblack/60 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          variants={popIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-vgswhite rounded-2xl shadow-2xl border border-vgsgray/30 w-full max-w-3xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-vgsdarkblue px-6 py-4 flex justify-between items-center text-vgswhite shrink-0">
            <div className="flex items-center gap-2.5">
              <Badge
                variant="red"
                size="md"
                icon={faCalendarCheck}
              >
                {eventData?.title || "Detalles del Evento"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="transparent"
                animation="pop"
                icon={faRotateRight}
                onClick={fetchDetail}
                className="text-vgswhite/70 hover:text-vgswhite p-1.5"
                title="Actualizar información"
              />
              <Button
                variant="transparent"
                animation="shrink"
                icon={faXmark}
                onClick={onClose}
                className="text-vgswhite/70 hover:text-vgswhite p-1.5 text-base"
                title="Cerrar"
              />
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="py-16 text-center text-vgsgray">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vgsred mx-auto mb-3" />
                Cargando información del evento...
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 border border-vgsgray/30 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-vgsgray block">
                      Total Invitados
                    </span>
                    <span className="text-2xl font-bold text-vgsblack mt-1 inline-block">
                      {stats.total_invited}
                    </span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 block">
                      Asistieron
                    </span>
                    <span className="text-2xl font-bold text-green-700 mt-1 inline-block">
                      {stats.total_attended}
                    </span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-vgsred block">
                      Ausentes
                    </span>
                    <span className="text-2xl font-bold text-vgsred mt-1 inline-block">
                      {stats.total_absent}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Pendientes
                    </span>
                    <span className="text-2xl font-bold text-amber-800 mt-1 inline-block">
                      {stats.total_pending}
                    </span>
                  </div>
                </div>

                {/* Meeting Room Card */}
                {(eventData?.has_meeting || eventData?.meeting_code) && (
                  <div className="bg-gradient-to-r from-vgsdarkblue/5 via-blue-50/50 to-white border border-vgsdarkblue/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-vgsdarkblue text-white flex items-center justify-center shrink-0 shadow-md">
                        <FontAwesomeIcon
                          icon={
                            eventData.meeting_type === "audio"
                              ? faHeadset
                              : faVideo
                          }
                          className="text-lg"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-vgsdarkblue">
                            Sala de Reunión Virtual
                          </h4>
                          <Badge
                            variant={
                              eventData.meeting_type === "audio"
                                ? "green"
                                : "blue"
                            }
                            size="xs"
                          >
                            {eventData.meeting_type === "audio"
                              ? "Solo Voz"
                              : "Videollamada"}
                          </Badge>
                        </div>
                        <p className="text-xs text-vgsgray mt-0.5">
                          Código:{" "}
                          <span className="font-mono font-bold text-vgsblack">
                            {eventData.meeting_code}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <Button
                        type="button"
                        variant="gray"
                        size="xs"
                        animation="shrink"
                        icon={copiedCode ? faCheck : faCopy}
                        onClick={() => {
                          navigator.clipboard.writeText(eventData.meeting_code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="text-xs py-1.5 px-3"
                      >
                        {copiedCode ? "Copiado" : "Copiar"}
                      </Button>

                      <Button
                        type="button"
                        variant="blue"
                        size="xs"
                        animation="grow"
                        icon={
                          eventData.meeting_type === "audio"
                            ? faHeadset
                            : faVideo
                        }
                        onClick={() => {
                          onClose();
                          joinMeeting(eventData.meeting_code);
                        }}
                        className="text-xs py-1.5 px-4 font-bold shadow-xs bg-vgsdarkblue text-white"
                      >
                        Entrar a la Sala
                      </Button>
                    </div>
                  </div>
                )}

                {/* My Participation Banner if pending */}
                {myParticipation &&
                  myParticipation.attendance_status === "pending" && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          Tu asistencia a este evento aún está pendiente
                        </p>
                        <p className="text-[11px] text-amber-700">
                          ¿Participaste en esta actividad?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="green"
                          size="xs"
                          icon={faCheck}
                          animation="grow"
                          onClick={() => handleSelfConfirm(true)}
                          className="py-1 px-3 text-xs font-bold shadow-xs"
                        >
                          Sí, asistí
                        </Button>
                        <Button
                          variant="gray"
                          size="xs"
                          icon={faXmark}
                          animation="shrink"
                          onClick={() => handleSelfConfirm(false)}
                          className="py-1 px-3 text-xs hover:text-vgsred"
                        >
                          No asistí
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Participants Section */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="red" size="sm" icon={faUsers}>
                        Lista de Participantes ({eventData?.participants?.length || 0})
                      </Badge>
                    </div>

                    {hasChanges && isAdminOrOrganizer && (
                      <Button
                        variant="green"
                        size="xs"
                        icon={faSave}
                        animation="shrink gradient"
                        disabled={savingBulk}
                        onClick={handleSaveBulk}
                        className="text-xs font-bold py-1.5 px-3 shadow-xs"
                      >
                        {savingBulk ? "Guardando..." : "Guardar Asistencias"}
                      </Button>
                    )}
                  </div>

                  {/* Filters Bar: Search & Animated Pill Selector */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="flex-1">
                      <Input
                        icon={faSearch}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filtrar colaborador por nombre..."
                        className="py-1 text-xs h-9"
                      />
                    </div>

                    {/* Animated Pill filter for status */}
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 relative shrink-0">
                      {[
                        { id: "all", label: "Todos" },
                        { id: "attended", label: "Asistieron" },
                        { id: "absent", label: "Ausentes" },
                        { id: "pending", label: "Pendientes" },
                      ].map((st) => (
                        <Button
                          key={st.id}
                          variant="transparent"
                          onClick={() => setStatusFilter(st.id)}
                          className={`relative px-2.5 py-1 text-xs font-bold transition-colors z-10 ${
                            statusFilter === st.id
                              ? "text-vgsred"
                              : "text-vgsgray hover:text-vgsblack"
                          }`}
                        >
                          {statusFilter === st.id && (
                            <motion.div
                              layoutId="participantStatusPill"
                              className="absolute inset-0 bg-vgswhite rounded-md shadow-sm"
                              transition={{
                                type: "spring",
                                duration: 0.4,
                                bounce: 0.15,
                              }}
                            />
                          )}
                          <span className="relative z-20">{st.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="divide-y divide-vgsgray/20 border border-vgsgray/20 rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-white">
                    {participants.length === 0 ? (
                      <p className="p-6 text-center text-xs text-vgsgray">
                        No hay participantes para mostrar con este filtro.
                      </p>
                    ) : (
                      participants.map((p) => {
                        const currentStatus =
                          editingAttendance[p.user_id] !== undefined
                            ? editingAttendance[p.user_id]
                              ? "attended"
                              : "absent"
                            : p.attendance_status;

                        return (
                          <div
                            key={p.user_id}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Image
                                src={api.getFileUrl(p.profile_picture, p.name)}
                                alt={p.name}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-vgsblack truncate">
                                    {p.name}
                                  </p>
                                  {p.is_organizer && (
                                    <Badge
                                      variant="yellow"
                                      size="xs"
                                      icon={faCrown}
                                      className="text-[9px]"
                                    >
                                      Organizador
                                    </Badge>
                                  )}
                                </div>
                                {p.attended_at && (
                                  <p className="text-[10px] text-vgsgray truncate">
                                    Confirmado: {formatDateTime(p.attended_at)}
                                    {p.confirmed_by_name &&
                                      ` por ${p.confirmed_by_name}`}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Attendance Controls / Badge */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isAdminOrOrganizer ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant={currentStatus === "attended" ? "green" : "gray"}
                                    size="xs"
                                    icon={faCheck}
                                    animation="shrink"
                                    onClick={() =>
                                      handleToggleUserAttendance(p.user_id, true)
                                    }
                                    className="py-1 px-2 text-xs font-bold"
                                    title="Marcar Asistencia"
                                  >
                                    <span className="hidden sm:inline">Asistió</span>
                                  </Button>
                                  <Button
                                    variant={currentStatus === "absent" ? "red" : "gray"}
                                    size="xs"
                                    icon={faXmark}
                                    animation="shrink"
                                    onClick={() =>
                                      handleToggleUserAttendance(p.user_id, false)
                                    }
                                    className="py-1 px-2 text-xs font-bold hover:text-vgsred"
                                    title="Marcar Ausencia"
                                  >
                                    <span className="hidden sm:inline">Ausente</span>
                                  </Button>
                                </div>
                              ) : (
                                <Badge
                                  variant={
                                    currentStatus === "attended"
                                      ? "green"
                                      : currentStatus === "absent"
                                      ? "red"
                                      : "gray"
                                  }
                                  size="xs"
                                >
                                  {currentStatus === "attended"
                                    ? "Asistió"
                                    : currentStatus === "absent"
                                    ? "Ausente"
                                    : "Pendiente"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-vgsgray/30 flex justify-between items-center shrink-0">
            <span className="text-[11px] text-vgsgray">
              {isAdminOrOrganizer
                ? "* Como organizador/administrador puedes registrar o ajustar asistencias."
                : "Información de asistencia en tiempo real."}
            </span>
            <Button
              variant="gray"
              animation="shrink"
              size="sm"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventDetailModal;
