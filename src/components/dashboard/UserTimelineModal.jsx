import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  Suspense,
} from "react";
import { motion, useDragControls } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faClock,
  faHourglassHalf,
  faHistory,
  faCircleInfo,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { STATUS_CONFIG } from "../layout/statusConfig";
import { formatDuration } from "../../utils/formatters";
import StatusBadge from "../common/StatusBadge";
import DateRangePicker from "../common/DateRangePicker";
import api from "../../services/api";
import { modalSidePanel } from "../common/animations";

const parseSafeDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  const normalized = String(dateStr).trim().replace(" ", "T");
  const date = new Date(normalized);

  return isNaN(date.getTime()) ? null : date;
};

const safeFormatTime = (dateInput) => {
  const date = parseSafeDate(dateInput);
  if (!date) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const LiveTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState("0s");

  useEffect(() => {
    const start = parseSafeDate(startTime);

    if (!start) {
      setElapsed("0s");
      return;
    }

    const calculate = () => {
      const now = new Date();
      const diffMs = now - start;

      if (diffMs <= 0) {
        setElapsed("0s");
        return;
      }

      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (mins > 0 || hours > 0) parts.push(`${mins}m`);
      parts.push(`${secs}s`);

      setElapsed(parts.join(" "));
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return <span>{elapsed}</span>;
};

const UserTimelineModal = ({ user, onClose, token }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);
  const [startDate, endDate] = dateRange;
  const dragControls = useDragControls();

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const response = await api.getHistory(token, {
        cedula: user.cedula || user.identification,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        limit: 100,
        page: 1,
      });

      if (response.success) {
        setHistory(response.history || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [user.cedula, user.identification, startDate, endDate, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const currentStatusStartTime = useMemo(() => {
    const userDate = parseSafeDate(user.last_update);
    if (userDate) return userDate;

    if (!loading && history.length > 0) {
      const historyDate = parseSafeDate(history[0].ended_at);
      if (historyDate) return historyDate;
    }
    return null;
  }, [user.last_update, history, loading]);

  const isToday =
    new Date(startDate).toDateString() === new Date().toDateString();

  return (
    <motion.div
      // Usar variante centralizada
      variants={modalSidePanel}
      initial="initial"
      animate="animate"
      exit="exit"
      
      // Drag Logic
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ left: -1000, right: 1000, top: -200, bottom: 800 }}
      dragElastic={0.1}
      className="fixed top-20 right-10 z-100 w-100 bg-vgswhite rounded-xl shadow-2xl border border-vgsgray/30 overflow-hidden flex flex-col max-h-[80vh] min-h-[70vh]"
    >
      <header
        onPointerDown={(e) => dragControls.start(e)}
        className="modal-header bg-vgsred p-4 flex justify-between items-center cursor-move text-white shrink-0 select-none"
      >
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faHistory} className="text-vgswhite" />
          <div>
            <h3 className="font-bold text-sm leading-none capitalize">
              {user.nombre}
            </h3>
            <p className="text-[10px] opacity-80 mt-1 uppercase tracking-tighter">
              Live Status Timeline
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 w-8 h-8 rounded-full transition-colors flex items-center justify-center pointer-events-auto"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>
      <div className="p-3 bg-gray-50 border-b flex items-center shrink-0">
        <div className="relative flex-1">
          <Suspense
            fallback={<div className="h-8 bg-gray-200 animate-pulse rounded" />}
          >
            <DateRangePicker
              label="Date Range"
              icon={faCalendarDays}
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              dateFormat="MMM dd, yyyy"
              placeholderText="Select Date"
            />
          </Suspense>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-white">
        {loading ? (
          <div className="flex flex-col items-center py-10 text-vgsgray">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vgsred mb-2"></div>
            <span className="text-xs uppercase font-bold tracking-widest text-vgsgray/50">
              Syncing...
            </span>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-3.75 top-2 bottom-2 w-0.5 bg-gray-100 z-0"></div>
            {isToday && (
              <div className="relative mb-10 pl-10">
                <div
                  className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center ${STATUS_CONFIG[user.current_status]?.classes || "bg-gray-400"}`}
                >
                  <FontAwesomeIcon
                    icon={STATUS_CONFIG[user.current_status]?.icon || faClock}
                    className="text-[10px] animate-pulse"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={user.current_status} />
                    <span className="text-[10px] font-bold text-green-500 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      LIVE
                    </span>
                  </div>
                  {currentStatusStartTime ? (
                    <div className="mt-2 rounded-lg p-3 border border-dotted border-vgsgray animate-in fade-in duration-300">
                      <div className="text-[11px] text-vgsblack flex items-center gap-2">
                        <FontAwesomeIcon
                          icon={faHourglassHalf}
                          className="text-green-600"
                        />
                        <span className="font-medium">Current Time:</span>
                        <span className="font-bold text-vgsblack tabular-nums">
                          <LiveTimer startTime={currentStatusStartTime} />
                        </span>
                      </div>
                      <div className="text-[10px] text-vgsblack mt-1 flex items-center gap-1">
                        <span>Started at:</span>
                        <span className="font-bold">
                          {safeFormatTime(currentStatusStartTime)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 text-[10px] text-vgsgray italic">
                      Waiting for session data...
                    </div>
                  )}
                </div>
              </div>
            )}
            <ul className="space-y-8">
              {history.length > 0
                ? history.map((item, index) => {
                  const normalizedStatus = item.status
                    ? item.status.toLowerCase()
                    : "default";
                  const config =
                    STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.default;

                  return (
                    <li
                      key={item.history_id || index}
                      className="relative pl-10"
                    >
                      <div
                        className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 border-white shadow-sm z-10 flex items-center justify-center ${config.classes}`}
                      >
                        <FontAwesomeIcon
                          icon={config.icon}
                          className="text-[10px]"
                        />
                      </div>

                      <div className="flex flex-col group">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={item.status} />
                          <span className="text-[10px] font-bold text-vgsblack px-2 py-0.5 rounded group-hover:bg-vgsgray group-hover:text-white transition-colors tabular-nums">
                            {formatDuration(item.duration_minutes) || 0}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-[10px] text-vgsblack font-medium">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-vgsblack rounded-full"></span>
                            Start: {safeFormatTime(item.started_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-vgsblack rounded-full"></span>
                            End: {safeFormatTime(item.ended_at)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })
                : !isToday && (
                  <div className="text-center py-10 opacity-50 flex flex-col items-center">
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      className="text-2xl mb-2 text-vgsgray"
                    />
                    <p className="text-xs italic">
                      No records for this period
                    </p>
                  </div>
                )}
            </ul>
          </div>
        )}
      </div>

      <footer className="p-3 bg-vgsred text-center shrink-0">
        <p className="text-xs text-vgswhite uppercase tracking-widest font-bold">
          VGS Office Hub System
        </p>
      </footer>
    </motion.div>
  );
};

export default memo(UserTimelineModal);