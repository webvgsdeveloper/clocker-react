/* eslint-disable no-unused-vars */
// src/components/events/EventDetailModal.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { confirmAttendance, eventsRefreshKey, triggerRefresh } = useEvents();
  const { joinMeeting } = useMeeting();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedCode, setCopiedCode] = useState(false);
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
          res?.error || "Could not load event details",
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
      triggerRefresh?.();
    }
  };

  const handleToggleUserAttendance = (userId, attended) => {
    setEditingAttendance((prev) => ({ ...prev, [userId]: attended }));
    setHasChanges(true);
  };

  const handleSaveBulk = async () => {
    const attendances = Object.entries(editingAttendance).map(
      ([userId, isAttended]) => ({
        user_id: Number(userId),
        status: isAttended ? "attended" : "absent",
      })
    );

    if (attendances.length === 0) return;

    setSavingBulk(true);
    try {
      const res = await api.bulkConfirmAttendance(token, eventId, attendances);
      if (res?.success) {
        addNotification(
          "Attendance Updated",
          "Attendance changes saved successfully.",
          "success",
          true
        );
        setEditingAttendance({});
        setHasChanges(false);
        fetchDetail();
        triggerRefresh?.();
      } else {
        addNotification(
          "Error",
          res?.error || "Could not update attendance",
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

  const stats = useMemo(() => {
    const rawStats = eventData?.stats;
    const participantsList = Array.isArray(eventData?.participants)
      ? eventData.participants
      : [];

    let attended = Number(rawStats?.total_attended ?? eventData?.total_attended ?? 0);
    let absent = Number(rawStats?.total_absent ?? eventData?.total_absent ?? 0);
    let pending = Number(rawStats?.total_pending ?? eventData?.total_pending ?? 0);
    let invited = Number(
      rawStats?.total_invited ??
        rawStats?.total_participants ??
        eventData?.total_participants ??
        eventData?.total_invited ??
        participantsList.length ??
        0
    );

    if (participantsList.length > 0 && !rawStats) {
      let countAttended = 0;
      let countAbsent = 0;
      let countPending = 0;
      for (const p of participantsList) {
        if (p.attendance_status === "attended") countAttended++;
        else if (p.attendance_status === "absent") countAbsent++;
        else countPending++;
      }
      attended = countAttended;
      absent = countAbsent;
      pending = countPending;
      if (invited === 0) invited = participantsList.length;
    }

    return {
      total_invited: invited,
      total_attended: attended,
      total_absent: absent,
      total_pending: pending,
    };
  }, [eventData]);

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
          className="relative bg-vgswhite rounded-2xl shadow-[0_12px_40px_rgb(12,34,75,0.1)] border border-vgsgray/20 w-full max-w-3xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
        >
          <div className="bg-vgsdarkblue px-6 py-4 flex justify-between items-center text-vgswhite shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-md font-bold">{eventData?.title || "Event Details"}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="transparent"
                animation="pop"
                icon={faRotateRight}
                onClick={fetchDetail}
                className="text-vgswhite/70 hover:text-vgswhite p-1.5"
                title="Refresh information"
              />
              <Button
                variant="transparent"
                animation="shrink"
                icon={faXmark}
                onClick={onClose}
                className="text-vgswhite/70 hover:text-vgswhite p-1.5 text-base"
                title="Close"
              />
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="py-16 text-center text-vgsgray">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vgsred mx-auto mb-3" />
                Loading event details...
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-vgsgray/5 border border-vgsgray/20 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-vgsgray block">
                      Total Invited
                    </span>
                    <span className="text-2xl font-bold text-vgsblack mt-1 inline-block">
                      {stats.total_invited}
                    </span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 block">
                      Attended
                    </span>
                    <span className="text-2xl font-bold text-green-700 mt-1 inline-block">
                      {stats.total_attended}
                    </span>
                  </div>
                  <div className="bg-vgsred/5 border border-vgsred/20 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-vgsred block">
                      Absent
                    </span>
                    <span className="text-2xl font-bold text-vgsred mt-1 inline-block">
                      {stats.total_absent}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Pending
                    </span>
                    <span className="text-2xl font-bold text-amber-800 mt-1 inline-block">
                      {stats.total_pending}
                    </span>
                  </div>
                </div>

                {/* Meeting Room Card */}
                {(eventData?.has_meeting || eventData?.meeting_code) && (
                  <div className="bg-linear-to-r from-vgsdarkblue/5 to-vgswhite border border-vgsdarkblue/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-vgsdarkblue text-white flex items-center justify-center shrink-0">
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
                            Virtual Meeting Room
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
                              ? "Voice Only"
                              : "Video Call"}
                          </Badge>
                        </div>
                        <p className="text-xs text-vgsgray mt-0.5">
                          Code:{" "}
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
                        {copiedCode ? "Copied" : "Copy"}
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
                      >
                        Join Room
                      </Button>
                    </div>
                  </div>
                )}

                {/* My Participation Banner if pending */}
                {myParticipation &&
                  myParticipation.attendance_status === "pending" && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          Your attendance for this event is still pending
                        </p>
                        <p className="text-[11px] text-amber-700">
                          Did you participate in this activity?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="green"
                          size="xs"
                          icon={faCheck}
                          animation="grow"
                          onClick={() => handleSelfConfirm(true)}
                        >
                          Yes, I attended
                        </Button>
                        <Button
                          variant="gray"
                          size="xs"
                          icon={faXmark}
                          animation="shrink"
                          onClick={() => handleSelfConfirm(false)}
                          className="hover:text-vgsred"
                        >
                          I did not attend
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Participants Section */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="red" size="sm" icon={faUsers}>
                        Participants List ({eventData?.participants?.length || stats.total_invited || 0})
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
                      >
                        {savingBulk ? "Saving..." : "Save Attendance"}
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
                        placeholder="Filter coworker by name..."
                        className="py-1 text-xs h-9"
                      />
                    </div>

                    {/* Animated Pill filter for status */}
                    <div className="flex bg-vgsgray/10 p-1 rounded-lg border border-vgsgray/20 relative shrink-0">
                      {[
                        { id: "all", label: "All" },
                        { id: "attended", label: "Attended" },
                        { id: "absent", label: "Absent" },
                        { id: "pending", label: "Pending" },
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
                  <div className="divide-y divide-vgsgray/20 border border-vgsgray/20 rounded-xl overflow-hidden max-h-72 overflow-y-auto bg-vgswhite">
                    {participants.length === 0 ? (
                      <p className="p-6 text-center text-xs text-vgsgray">
                        No participants to display with this filter.
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
                            className="p-3 flex items-center justify-between gap-3 hover:bg-vgsgray/10 transition-colors"
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
                                      variant="blue"
                                      outline
                                      size="xs"
                                      icon={faCrown}
                                      className="text-[9px]"
                                    >
                                      Organizer
                                    </Badge>
                                  )}
                                </div>
                                {p.attended_at && (
                                  <p className="text-[10px] text-vgsgray truncate">
                                    Confirmed: {formatDateTime(p.attended_at)}
                                    {p.confirmed_by_name &&
                                      ` by ${p.confirmed_by_name}`}
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
                                    title="Mark Attended"
                                  >
                                    <span className="hidden sm:inline">Attended</span>
                                  </Button>
                                  <Button
                                    variant={currentStatus === "absent" ? "red" : "gray"}
                                    size="xs"
                                    icon={faXmark}
                                    animation="shrink"
                                    onClick={() =>
                                      handleToggleUserAttendance(p.user_id, false)
                                    }
                                    className="hover:text-vgsred"
                                    title="Mark Absent"
                                  >
                                    <span className="hidden sm:inline">Absent</span>
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
                                    ? "Attended"
                                    : currentStatus === "absent"
                                    ? "Absent"
                                    : "Pending"}
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
          <div className="bg-vgsgray/5 px-6 py-3 border-t border-vgsgray/20 flex justify-between items-center shrink-0">
            <span className="text-[11px] text-vgsgray">
              {isAdminOrOrganizer
                ? "* As organizer/administrator you can register or adjust attendance."
                : "Real-time attendance information."}
            </span>
            <Button
              variant="gray"
              animation="shrink"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventDetailModal;
