// src/components/events/EventsPanel.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  faCalendarPlus,
  faCalendarDays,
  faClock,
  faUsers,
  faCheck,
  faXmark,
  faEye,
  faEdit,
  faTrash,
  faTag,
  faRotateRight,
  faCrown,
  faGlobe,
  faBriefcase,
  faExclamationCircle,
  faSearch,
  faVideo,
  faHeadset,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import Badge from "../common/Badge";
import Card from "../common/Card";
import Input from "../common/Input";
import Image from "../common/Image";
import Pagination from "../common/Pagination";
import ConfirmationBox from "../common/ConfirmationBox";
import EventFormModal from "./EventFormModal";
import EventDetailModal from "./EventDetailModal";
import { useAuth } from "../../contexts/AuthContext";
import { useEvents } from "../../contexts/EventsContext";
import { useMeeting } from "../../contexts/MeetingContext";
import { useNotification } from "../../contexts/NotificationContext";
import api from "../../services/api";
import { formatDateTime } from "../../utils/formatters";
import {
  staggerContainer,
  fadeInUp,
  slideInLeft,
  slideInRight,
} from "../common/animations";

const containerVariants = staggerContainer(0.08, 0.1);

const STATUS_BADGES = {
  scheduled: { label: "Programado", variant: "blue" },
  in_progress: { label: "En Curso", variant: "green" },
  completed: { label: "Completado", variant: "gray" },
  cancelled: { label: "Cancelado", variant: "red" },
};

const EventsPanel = () => {
  const { user, token, activeGroup, isAdmin } = useAuth();
  const {
    pendingAttendances,
    confirmAttendance,
    eventsRefreshKey,
    userCanCreate,
    triggerRefresh,
  } = useEvents();
  const { joinMeeting } = useMeeting();
  const { addNotification } = useNotification();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  // Filter states
  const [scope, setScope] = useState("all"); // 'all' or 'my_events'
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [detailEventId, setDetailEventId] = useState(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");

  // Quick attendance action loading id
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (scope === "my_events") params.scope = "my_events";
      if (statusFilter) params.status = statusFilter;
      if (activeGroup?.id) params.workgroup_id = activeGroup.id;

      const res = await api.getEvents(token, params);
      if (res?.success) {
        setEvents(res.data || []);
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1,
          }));
        }
      } else {
        addNotification("Error", res?.error || "Error al cargar eventos", "error");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      addNotification("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [
    token,
    pagination.page,
    pagination.limit,
    scope,
    statusFilter,
    activeGroup?.id,
    addNotification,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, eventsRefreshKey]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleQuickAttendance = async (eventId, attended) => {
    setActionLoadingId(eventId);
    try {
      await confirmAttendance(eventId, attended);
      fetchEvents();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteEventTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteEvent(token, deleteEventTarget.id);
      if (res?.success) {
        addNotification("Éxito", "Evento eliminado correctamente", "success", true);
        setDeleteEventTarget(null);
        triggerRefresh();
        fetchEvents();
      } else {
        addNotification("Error", res?.error || "No se pudo eliminar el evento", "error", true);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      addNotification("Error", err.message, "error", true);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(
      (ev) =>
        (ev.title && ev.title.toLowerCase().includes(query)) ||
        (ev.event_type_name && ev.event_type_name.toLowerCase().includes(query)) ||
        (ev.organizer_name && ev.organizer_name.toLowerCase().includes(query))
    );
  }, [events, searchQuery]);

  const handleJoinWithCode = (e) => {
    if (e) e.preventDefault();
    const code = joinCodeInput.trim();
    if (!code) {
      addNotification(
        "Validación",
        "Por favor ingresa un código de reunión.",
        "warning",
        true
      );
      return;
    }
    setIsJoinCodeModalOpen(false);
    setJoinCodeInput("");
    joinMeeting(code);
  };

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Pending Attendance Top Banner */}
      <AnimatePresence>
        {pendingAttendances.length > 0 && (
          <motion.section variants={slideInRight}>
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-lg" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Tienes {pendingAttendances.length} confirmación
                    {pendingAttendances.length > 1 ? "es" : ""} de asistencia pendiente
                    {pendingAttendances.length > 1 ? "s" : ""}
                  </h4>
                  <p className="text-xs text-amber-700">
                    Por favor confirma si asististe a tus actividades concluidas para mantener tus registros actualizados.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0 self-end sm:self-center">
                {pendingAttendances.slice(0, 1).map((ev) => {
                  const eId = ev.id || ev.event_id;
                  const isLoading = actionLoadingId === eId;
                  return (
                    <div key={`banner-${eId}`} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-900 hidden md:inline">
                        "{ev.title}":
                      </span>
                      <Button
                        variant="green"
                        size="xs"
                        icon={faCheck}
                        animation="grow"
                        disabled={isLoading}
                        onClick={() => handleQuickAttendance(eId, true)}
                        className="py-1 px-3 text-xs font-bold shadow-xs"
                      >
                        Sí, asistí
                      </Button>
                      <Button
                        variant="gray"
                        size="xs"
                        icon={faXmark}
                        animation="shrink"
                        disabled={isLoading}
                        onClick={() => handleQuickAttendance(eId, false)}
                        className="py-1 px-3 text-xs hover:text-vgsred"
                      >
                        No asistí
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Control Bar: Header & Actions */}
      <motion.header
        variants={slideInLeft}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-vgswhite p-4 rounded-xl border border-vgsgray/30 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <Badge icon={faCalendarDays} variant="red" size="lg">
            Events & Activities
          </Badge>
          <Button
            onClick={fetchEvents}
            variant="transparent"
            animation="pop"
            icon={faRotateRight}
            className="text-xs text-vgsgray hover:text-vgsdarkblue p-2"
            title="Actualizar eventos"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Animated Pill Selector (matching StatusGrid.jsx style) */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 relative">
            <Button
              onClick={() => {
                setScope("all");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              variant="transparent"
              className={`relative px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-2 text-xs font-bold z-10 ${
                scope === "all"
                  ? "text-vgsred"
                  : "text-vgsgray hover:text-vgsblack"
              }`}
              title="Todos los Eventos"
            >
              {scope === "all" && (
                <motion.div
                  layoutId="eventsScopeTab"
                  className="absolute inset-0 bg-vgswhite rounded-md shadow-sm"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <span className="relative z-20 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faGlobe} />
                <span>Todos</span>
              </span>
            </Button>

            <Button
              onClick={() => {
                setScope("my_events");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              variant="transparent"
              className={`relative px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-2 text-xs font-bold z-10 ${
                scope === "my_events"
                  ? "text-vgsred"
                  : "text-vgsgray hover:text-vgsblack"
              }`}
              title="Mis Eventos"
            >
              {scope === "my_events" && (
                <motion.div
                  layoutId="eventsScopeTab"
                  className="absolute inset-0 bg-vgswhite rounded-md shadow-sm"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <span className="relative z-20 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUsers} />
                <span>Mis Eventos</span>
              </span>
            </Button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 text-xs bg-white border border-vgsgray/40 rounded-lg outline-none font-medium focus:border-vgsdarkblue cursor-pointer h-9"
          >
            <option value="">Todos los Estados</option>
            <option value="scheduled">Programados</option>
            <option value="in_progress">En Curso</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          {/* Search Input using Atomic Input */}
          <div className="w-44 sm:w-56">
            <Input
              icon={faSearch}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar evento..."
              className="py-1 text-xs h-9"
            />
          </div>

          {/* Join with code button */}
          <Button
            variant="blue"
            icon={faVideo}
            animation="shrink"
            onClick={() => setIsJoinCodeModalOpen(true)}
            className="text-xs font-bold py-2 px-3 shadow-xs bg-vgsdarkblue text-white ml-auto lg:ml-0"
            title="Unirse a una reunión o sala con código"
          >
            Unirse con Código
          </Button>

          {/* Create Button (permission gated) */}
          {userCanCreate && (
            <Button
              variant="red"
              icon={faCalendarPlus}
              animation="shrink gradient"
              onClick={() => {
                setEditingEvent(null);
                setIsFormOpen(true);
              }}
              className="text-xs font-bold py-2 px-4 shadow-sm"
            >
              Nuevo Evento
            </Button>
          )}
        </div>
      </motion.header>

      {/* Events Grid / Content with Entrance Animation */}
      <motion.section variants={fadeInUp} className="w-full">
        {loading ? (
        <div className="text-center py-20 text-vgsgray">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vgsred mx-auto mb-3" />
          <p className="text-sm">Cargando actividades y eventos...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="text-center py-16">
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="text-vgsgray/40 text-5xl mb-3"
          />
          <h4 className="text-base font-bold text-vgsblack mb-1">
            No se encontraron eventos
          </h4>
          <p className="text-xs text-vgsgray max-w-sm mx-auto mb-5">
            {scope === "my_events"
              ? "No tienes eventos programados ni participaciones activas."
              : "No hay actividades registradas con los filtros seleccionados."}
          </p>
          {userCanCreate && (
            <Button
              variant="blue"
              icon={faCalendarPlus}
              animation="grow"
              onClick={() => {
                setEditingEvent(null);
                setIsFormOpen(true);
              }}
            >
              Programar Primer Evento
            </Button>
          )}
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredEvents.map((event) => {
            const statusInfo = STATUS_BADGES[event.status] || {
              label: event.status || "Programado",
              variant: "blue",
            };

            const canManage =
              isAdmin ||
              event.is_my_organized_event ||
              Number(event.organizer_id) === Number(user?.user_id);

            const isPendingMyAttendance =
              event.my_attendance_status === "pending" &&
              event.status === "completed";

            const attendancePercent =
              event.total_invited > 0
                ? Math.round(
                    ((event.total_attended || 0) / event.total_invited) * 100
                  )
                : 0;

            const isCurrentActionLoading = actionLoadingId === event.id;
            const hasMeeting = Boolean(
              event.has_meeting ||
                (event.meeting_code && event.meeting_type !== "none")
            );

            return (
              <motion.article
                key={event.id}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <div className="bg-vgswhite rounded-2xl border border-vgsgray/30 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
                  {/* Top Bar: Event Type & Status */}
                  <div className="px-5 pt-4 pb-2 flex justify-between items-center gap-2 border-b border-vgsgray/10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="blue" size="xs" icon={faTag}>
                        {event.event_type_name || "Actividad"}
                      </Badge>
                      {hasMeeting && (
                        <Badge
                          variant={
                            event.meeting_type === "audio" ? "green" : "blue"
                          }
                          size="xs"
                          icon={
                            event.meeting_type === "audio" ? faHeadset : faVideo
                          }
                        >
                          {event.meeting_type === "audio" ? "Voz" : "Meet"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {event.status === "in_progress" && (
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                      )}
                      <Badge variant={statusInfo.variant} size="xs">
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-vgsdarkblue line-clamp-1 leading-snug">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-xs text-vgsgray line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Meta info: Organizer & Target */}
                    <div className="space-y-2 pt-2 border-t border-vgsgray/15 text-xs text-vgsgray">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Image
                            src={api.getFileUrl(
                              event.organizer_profile_picture,
                              event.organizer_name
                            )}
                            alt={event.organizer_name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                          <span className="truncate text-vgsblack font-medium">
                            {event.organizer_name}
                          </span>
                        </div>
                        {event.is_my_organized_event && (
                          <Badge
                            variant="yellow"
                            size="xs"
                            icon={faCrown}
                            className="text-[10px] font-bold"
                          >
                            Organizador
                          </Badge>
                        )}
                      </div>

                      {/* Audience */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-vgsgray">
                          <FontAwesomeIcon
                            icon={
                              event.target_type === "all"
                                ? faGlobe
                                : event.target_type === "workgroup"
                                ? faBriefcase
                                : faUsers
                            }
                            className="text-vgsdarkblue"
                          />
                          {event.target_type === "all"
                            ? "Público General"
                            : event.target_type === "workgroup"
                            ? "Grupo de Trabajo"
                            : "Usuarios Seleccionados"}
                        </span>
                        <span className="font-semibold text-vgsblack">
                          {event.total_invited || 0} invitados
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-1.5 text-[11px] text-vgsgray pt-0.5">
                        <FontAwesomeIcon icon={faClock} className="text-vgsred" />
                        <span className="truncate">
                          {formatDateTime(event.start_time)}
                        </span>
                      </div>
                    </div>

                    {/* Attendance Progress & My Status */}
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-vgsgray/20 space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-vgsblack">
                          Asistencias ({event.total_attended || 0}/
                          {event.total_invited || 0})
                        </span>
                        <span className="font-mono text-vgsdarkblue font-bold">
                          {attendancePercent}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${attendancePercent}%` }}
                        />
                      </div>

                      {/* My Attendance Badge or Quick Action */}
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-vgsgray tracking-wider">
                          Mi Asistencia:
                        </span>

                        {isPendingMyAttendance ? (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="green"
                              size="xs"
                              animation="grow"
                              disabled={isCurrentActionLoading}
                              onClick={() =>
                                handleQuickAttendance(event.id, true)
                              }
                              className="py-0.5 px-2 text-[10px] font-bold shadow-xs"
                            >
                              {isCurrentActionLoading ? "..." : "Asistí"}
                            </Button>
                            <Button
                              variant="gray"
                              size="xs"
                              animation="shrink"
                              disabled={isCurrentActionLoading}
                              onClick={() =>
                                handleQuickAttendance(event.id, false)
                              }
                              className="py-0.5 px-2 text-[10px] hover:text-vgsred"
                            >
                              {isCurrentActionLoading ? "..." : "No asistí"}
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant={
                              event.my_attendance_status === "attended"
                                ? "green"
                                : event.my_attendance_status === "absent"
                                ? "red"
                                : "gray"
                            }
                            size="xs"
                          >
                            {event.my_attendance_status === "attended"
                              ? "✓ Asististe"
                              : event.my_attendance_status === "absent"
                              ? "Ausente"
                              : "Pendiente"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-vgsgray/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="transparent"
                        icon={faEye}
                        animation="pop"
                        onClick={() => setDetailEventId(event.id)}
                        className="text-xs font-semibold hover:text-vgsdarkblue p-0"
                      >
                        Detalles y Asistencia
                      </Button>

                      {hasMeeting && event.meeting_code && (
                        <Button
                          variant="blue"
                          size="xs"
                          animation="shrink"
                          icon={
                            event.meeting_type === "audio" ? faHeadset : faVideo
                          }
                          onClick={() => joinMeeting(event.meeting_code)}
                          className="py-1 px-2.5 text-[11px] font-bold shadow-xs bg-vgsdarkblue text-white"
                        >
                          Unirse a Llamada
                        </Button>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="gray"
                          icon={faEdit}
                          animation="shrink"
                          onClick={() => {
                            setEditingEvent(event);
                            setIsFormOpen(true);
                          }}
                          className="px-2 py-1 text-xs"
                          title="Editar evento"
                        />
                        <Button
                          variant="gray"
                          icon={faTrash}
                          animation="shrink"
                          onClick={() => setDeleteEventTarget(event)}
                          className="px-2 py-1 text-xs hover:text-vgsred"
                          title="Eliminar evento"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}
      </motion.section>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          totalRecords={pagination.total}
          currentCount={filteredEvents.length}
          unit="eventos"
        />
      )}

      {/* Create / Edit Modal */}
      <EventFormModal
        token={token}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={() => {
          triggerRefresh();
          fetchEvents();
        }}
        initialData={editingEvent}
        activeGroupId={activeGroup?.id}
        activeGroupName={activeGroup?.name}
      />

      {/* Detail Modal */}
      {detailEventId && (
        <EventDetailModal
          token={token}
          eventId={detailEventId}
          isOpen={!!detailEventId}
          onClose={() => setDetailEventId(null)}
          isAdminOrOrganizer={
            isAdmin ||
            events.find((e) => e.id === detailEventId)?.is_my_organized_event
          }
        />
      )}

      {/* Delete Confirmation Box */}
      <ConfirmationBox
        isOpen={!!deleteEventTarget}
        onClose={() => setDeleteEventTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title="Eliminar Evento"
        description={`¿Estás seguro de eliminar el evento "${deleteEventTarget?.title}"?`}
        description2="Esta acción eliminará el evento y todos sus registros de asistencia asociados de forma permanente."
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="rec"
        icon={faTrash}
      />

      {/* Join with Code Modal */}
      <AnimatePresence>
        {isJoinCodeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-vgsgray/20 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-vgsdarkblue/10 flex items-center justify-center text-vgsdarkblue">
                    <FontAwesomeIcon icon={faRightToBracket} />
                  </div>
                  <h3 className="font-bold text-vgsdarkblue text-base">
                    Unirse con Código
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsJoinCodeModalOpen(false)}
                  className="text-vgsgray hover:text-vgsblack transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <p className="text-xs text-vgsgray">
                Ingresa el código alfanumérico de la sala de reunión (ej.{" "}
                <span className="font-mono font-semibold text-vgsdarkblue">
                  clk-abc-xyz
                </span>
                ).
              </p>

              <form onSubmit={handleJoinWithCode} className="space-y-4">
                <Input
                  label="Código de la reunión"
                  placeholder="clk-xxxx-xxx"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  autoFocus
                  required
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="gray"
                    onClick={() => setIsJoinCodeModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="blue"
                    disabled={!joinCodeInput.trim()}
                    icon={faRightToBracket}
                  >
                    Unirse a la Sala
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
};

export default EventsPanel;
