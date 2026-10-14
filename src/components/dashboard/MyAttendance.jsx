// src/components/dashboard/MyAttendance.jsx
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Title,
  BarChart,
  AreaChart,
  Subtitle,
  Grid,
  Metric,
  Text,
  Flex,
} from "@tremor/react";
import {
  faFilter,
  faCalendarDays,
  faBroom,
  faExclamationTriangle,
  faHourglassHalf,
  faAlarmClock,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence } from "framer-motion";
import { formatDuration } from "../../utils/formatters.js";
import api from "../../services/api";
import { STATUS_CONFIG } from "../layout/statusConfig";
import DateRangePicker from "../common/DateRangePicker";
import Button from "../common/Button";
import Input from "../common/Input";
import StatusBadge from "../common/StatusBadge";
import Badge from "../common/Badge";
import Card from "../common/Card";
import {
  fadeInUp,
  tooltipVariants,
  staggerContainer,
} from "../common/animations";

const RELEVANT_STATUSES = [
  "break",
  "lunch",
  "brb",
  "rec",
  "coaching",
  "team_meeting",
];

const STATUS_TO_TREMOR_COLOR = {
  break: "yellow",
  lunch: "orange",
  brb: "purple",
  rec: "red",
  coaching: "indigo",
  team_meeting: "cyan",
  online: "green",
};

const formatAxisValue = (value, isPayroll = false) => {
  if (value === 0) return "";
  if (isPayroll) return `${value.toFixed(0)}h`;
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(value)}m`;
};

// Tooltip
const ChartTooltip = ({ payload, active, label, isPayroll = false }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <motion.div
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-y-1 w-52 p-3 rounded-md border border-vgsgray border-dashed bg-vgswhite shadow-lg z-50"
    >
      <div className="border-b border-vgsgray/20 pb-1 mb-1">
        <p className="text-[10px] font-bold text-vgsblack uppercase tracking-tight">
          {label}
        </p>
      </div>
      {payload.map((category, idx) => {
        if (category.value <= 0) return null;

        const cleanStatus = isPayroll
          ? "online"
          : category.dataKey.replace("_usage", "").replace("_overrate", "");

        const count = data[`${cleanStatus}_count`] || 0;

        return (
          <div
            key={idx}
            className="w-full flex gap-x-2 text-xs font-bold items-center"
          >
            <span className="text-vgsgray font-mono min-w-3.75">{count}</span>
            <StatusBadge status={cleanStatus} />
            <p className="ml-auto text-vgsgray font-mono">
              {formatDuration(isPayroll ? category.value * 60 : category.value)}
            </p>
          </div>
        );
      })}
    </motion.div>
  );
};

// KPIs
const KPICards = ({ data }) => {
  const totals = useMemo(() => {
    const hours = data.reduce(
      (acc, curr) => acc + (curr["Worked Hours"] || 0),
      0,
    );
    const over = data.reduce((acc, curr) => {
      let dailyOver = 0;
      RELEVANT_STATUSES.forEach(
        (st) => (dailyOver += curr[`${st}_overrate`] || 0),
      );
      return acc + dailyOver;
    }, 0);
    return { hours: hours.toFixed(1), over: Math.round(over) };
  }, [data]);

  return (
    <Grid numItemsSm={1} numItemsLg={3} className="gap-4 mb-6">
      <Card className="border border-vgsgray border-t-4 border-t-green-600">
        <Flex justifyContent="start" className="gap-4">
          <StatusBadge status="online" />
          <div>
            <Text className="text-green-600 font-bold uppercase text-xs">
              Total Worked Hours
            </Text>
            <Metric className="text-vgsblack">{totals.hours} h</Metric>
          </div>
        </Flex>
      </Card>
      <Card className="border border-vgsgray border-t-4 border-t-red-500">
        <Flex justifyContent="start" className="gap-4">
          <Badge icon={faAlarmClock} variant="red" size="lg" outline="true" />
          <div>
            <Text className="text-red-500 font-bold uppercase text-xs">
              Total Overrate
            </Text>
            <Metric className="text-vgsblack">{totals.over} m</Metric>
          </div>
        </Flex>
      </Card>
      <Card className="border border-vgsgray border-t-4 border-t-teal-500">
        <Flex justifyContent="start" className="gap-4">
          <Badge
            icon={faCheckCircle}
            variant="none"
            size="lg"
            outline="true"
            className="text-teal-500! border-teal-500!"
          />
          <div>
            <Text className="text-teal-500 font-bold uppercase text-xs">
              Days Analyzed
            </Text>
            <Metric className="text-vgsblack">{data.length}</Metric>
          </div>
        </Flex>
      </Card>
    </Grid>
  );
};

// ScrollableChart
const ScrollableChartContainer = ({ children, minWidth }) => (
  <div className="mt-6 overflow-x-auto pb-4 custom-scrollbar">
    <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
  </div>
);

const FilterBar = ({
  dates,
  setDates,
  selectedStatus,
  setSelectedStatus,
  onSync,
  onClear,
  isLoading,
}) => (
  <Card className="border border-vgsgray">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
      <DateRangePicker
        label="Select Period"
        icon={faCalendarDays}
        startDate={dates[0]}
        endDate={dates[1]}
        onChange={setDates}
      />
      <Input
        type="select"
        label="Filter by Type"
        icon={faFilter}
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
      >
        <option value="">All status</option>
        {RELEVANT_STATUSES.map((st) => (
          <option key={st} value={st}>
            {STATUS_CONFIG[st]?.label || st}
          </option>
        ))}
      </Input>
      <div className="flex gap-x-2">
        <Button
          variant="blue"
          icon={faFilter}
          onClick={onSync}
          tittle="Apply filters"
          disabled={isLoading}
          animation="pop"
        >
          Filter
        </Button>
        <Button
          variant="gray"
          icon={faBroom}
          onClick={onClear}
          tittle="Clear filters"
          animation="translate"
        />
      </div>
    </div>
  </Card>
);

const StatusLegend = ({
  visibleStatuses,
  hiddenCats,
  onToggle,
  appliedFilter,
  isOverrate = false,
}) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [moved, setMoved] = useState(false);

  const filteredList = useMemo(() => {
    if (!appliedFilter) return visibleStatuses;
    return visibleStatuses.includes(appliedFilter)
      ? visibleStatuses.filter((s) => s === appliedFilter)
      : [appliedFilter];
  }, [visibleStatuses, appliedFilter]);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll, filteredList]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setMoved(false);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setMoved(false), 10);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) setMoved(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
    checkScroll();
  };

  const scrollBy = (dist) => {
    scrollRef.current.scrollBy({ left: dist, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className="relative flex items-center flex-1 min-w-0 group">
      {/* Flecha Izquierda */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            onClick={() => scrollBy(-150)}
            className="absolute left-0 z-10 bg-linear-to-r from-vgswhite via-vgswhite to-transparent pr-4 pl-1 text-vgsgray hover:text-vgsblack transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} size="xs" />
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex p-1 gap-2 flex-1 overflow-x-auto no-scrollbar items-center cursor-grab active:cursor-grabbing select-none`}
      >
        <AnimatePresence mode="popLayout">
          {filteredList.map((status) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!moved) onToggle(status);
              }}
            >
              <StatusBadge
                status={status}
                icon={isOverrate ? faExclamationTriangle : null}
                className={`transition-opacity ${hiddenCats.has(status) ? "opacity-30" : "opacity-100"}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Flecha Derecha */}
      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            onClick={() => scrollBy(150)}
            className="absolute right-0 z-10 bg-linear-to-l from-vgswhite via-vgswhite to-transparent pl-4 pr-1 text-vgsblack"
          >
            <FontAwesomeIcon icon={faChevronRight} size="xs" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const MyAttendance = ({ token }) => {
  const [dates, setDates] = useState(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return [start, end];
  });
  const [selectedStatus, setSelectedStatus] = useState("");
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [appliedFilters, setAppliedFilters] = useState({
    dates: [
      new Date(new Date().setHours(0, 0, 0, 0) - 7 * 24 * 60 * 60 * 1000),
      new Date(new Date().setHours(23, 59, 59, 999)),
    ],
    status: "",
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["my-metrics", appliedFilters.dates],
    queryFn: () =>
      api.getMyStats(token, {
        startDate: appliedFilters.dates[0],
        endDate: appliedFilters.dates[1],
      }),
    enabled: !!token && !!appliedFilters.dates[0],
  });

  const handleSync = useCallback(
    () => setAppliedFilters({ dates, status: selectedStatus }),
    [dates, selectedStatus],
  );

  const handleClearFilters = useCallback(() => {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysAgoStart = new Date();
    sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 7);
    sevenDaysAgoStart.setHours(0, 0, 0, 0);

    const defaultDates = [sevenDaysAgoStart, todayEnd];

    setDates(defaultDates);
    setSelectedStatus("");
    setAppliedFilters({ dates: defaultDates, status: "" });
    setHiddenCats(new Set());
  }, []);

  const toggleCategory = useCallback((status) => {
    setHiddenCats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) newSet.delete(status);
      else newSet.add(status);
      return newSet;
    });
  }, []);

  const { chartData, usageConfig, overrateConfig, visibleStatuses } =
    useMemo(() => {
      const rawData = metrics?.data || [];
      const dateMap = {};

      rawData.forEach((curr) => {
        const dateKey = new Date(curr.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = {
            date: dateKey,
            "Worked Hours": 0,
            online_count: 0,
          };
          RELEVANT_STATUSES.forEach((st) => {
            dateMap[dateKey][`${st}_usage`] = 0;
            dateMap[dateKey][`${st}_overrate`] = 0;
            dateMap[dateKey][`${st}_count`] = 0;
          });
        }

        const rawStatus = curr.status.toLowerCase();
        let statusKey =
          rawStatus === "meeting" || rawStatus === "team"
            ? "team_meeting"
            : rawStatus;

        if (RELEVANT_STATUSES.includes(statusKey)) {
          dateMap[dateKey][`${statusKey}_usage`] += parseFloat(
            curr.total_minutes || 0,
          );
          dateMap[dateKey][`${statusKey}_overrate`] += parseFloat(
            curr.overrate_minutes || 0,
          );
          dateMap[dateKey][`${statusKey}_count`] += curr.occurrences || 0;
        } else if (statusKey === "online") {
          dateMap[dateKey]["online_count"] += curr.occurrences || 0;
        }
        dateMap[dateKey]["Worked Hours"] = Math.max(
          dateMap[dateKey]["Worked Hours"],
          curr.worked_hours || 0,
        );
      });

      const initialData = Object.values(dateMap);

      // Determinar qué categorías tienen datos reales en el periodo
      const getActiveStatuses = () => {
        return RELEVANT_STATUSES.filter((st) => {
          const hasData = initialData.some((d) => d[`${st}_usage`] > 0);
          const isSelected = appliedFilters.status === st;
          return hasData || isSelected;
        });
      };

      const currentVisibleStatuses = getActiveStatuses();

      // Configuración de categorías estable para animación fluida
      const getChartConfig = (suffix) => ({
        cats: currentVisibleStatuses.map((st) => `${st}_${suffix}`),
        cols: currentVisibleStatuses.map(
          (st) => STATUS_TO_TREMOR_COLOR[st] || "blue",
        ),
      });

      // Data final inyectando ceros para los estados ocultos (permite animación fluida)
      const finalChartData = initialData.map((item) => {
        const newItem = { ...item };
        RELEVANT_STATUSES.forEach((st) => {
          if (
            hiddenCats.has(st) ||
            (appliedFilters.status && appliedFilters.status !== st)
          ) {
            newItem[`${st}_usage`] = 0;
            newItem[`${st}_overrate`] = 0;
          }
        });
        return newItem;
      });

      return {
        chartData: finalChartData,
        usageConfig: getChartConfig("usage"),
        overrateConfig: getChartConfig("overrate"),
        visibleStatuses: currentVisibleStatuses,
      };
    }, [metrics, appliedFilters.status, hiddenCats]);

  const chartMinWidth = useMemo(
    () => Math.max(chartData.length * 70, 600),
    [chartData],
  );

  const statusLabel = appliedFilters.status
    ? STATUS_CONFIG[appliedFilters.status]?.label?.toLowerCase()
    : "";

  const attendanceContainer = staggerContainer(0.1);

  return (
    <motion.div
      variants={attendanceContainer}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <motion.div variants={fadeInUp}>
        <FilterBar
          dates={dates}
          setDates={setDates}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          onSync={handleSync}
          onClear={handleClearFilters}
          isLoading={isLoading}
        />
      </motion.div>

      <AnimatePresence>
        {!isLoading && chartData.length > 0 && (
          <motion.div variants={fadeInUp}>
            <KPICards data={chartData} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <motion.div variants={fadeInUp}>
          <Card className="border border-vgsgray overflow-hidden h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-1 w-full overflow-hidden">
                  <div className="shrink-0">
                    <Title className="text-vgsblack font-bold flex items-center gap-2">
                      <Badge
                        icon={faHourglassHalf}
                        variant="blue"
                        outline="true"
                        size="md"
                      />
                      Time Usage
                    </Title>
                  </div>
                  <StatusLegend
                    visibleStatuses={visibleStatuses}
                    hiddenCats={hiddenCats}
                    onToggle={toggleCategory}
                    appliedFilter={appliedFilters.status}
                  />
                </div>
                <Subtitle className="pl-2">
                  {statusLabel
                    ? `Time on ${statusLabel}`
                    : "Distribution per status (Click to filter)"}
                </Subtitle>
              </div>
            </div>
            <ScrollableChartContainer minWidth={chartMinWidth}>
              <BarChart
                className="h-80"
                data={chartData}
                index="date"
                categories={usageConfig.cats}
                colors={usageConfig.cols}
                stack={true}
                valueFormatter={(num) => formatAxisValue(num, false)}
                customTooltip={(props) => <ChartTooltip {...props} />}
                showAnimation={true}
                showLegend={false}
                yAxisWidth={65}
              />
            </ScrollableChartContainer>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border border-vgsgray overflow-hidden h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-1 w-full overflow-hidden">
                  <div className="shrink-0">
                    <Title className="text-vgsblack font-bold flex items-center gap-2">
                      <Badge
                        icon={faAlarmClock}
                        variant="red"
                        outline="true"
                        size="md"
                      />
                      Overrate
                    </Title>
                  </div>
                  <StatusLegend
                    visibleStatuses={visibleStatuses}
                    hiddenCats={hiddenCats}
                    onToggle={toggleCategory}
                    appliedFilter={appliedFilters.status}
                    isOverrate
                  />
                </div>
                <Subtitle className="pl-2">
                  {statusLabel
                    ? `Excess on ${statusLabel}`
                    : "Excess time taken per state"}
                </Subtitle>
              </div>
            </div>
            <ScrollableChartContainer minWidth={chartMinWidth}>
              <BarChart
                className="h-80"
                data={chartData}
                index="date"
                categories={overrateConfig.cats}
                colors={overrateConfig.cols}
                stack={true}
                valueFormatter={(num) => formatAxisValue(num, false)}
                customTooltip={(props) => <ChartTooltip {...props} />}
                showAnimation={true}
                showLegend={false}
                yAxisWidth={65}
              />
            </ScrollableChartContainer>
          </Card>
        </motion.div>
      </div>
      <motion.div variants={fadeInUp}>
        <Card className="border border-vgsgray overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <Title className="text-vgsblack font-bold flex items-center gap-2 mb-1">
              <StatusBadge status="online" />
              Worked Hours (Payroll)
            </Title>
          </div>
          <Subtitle>Trend in hours worked per day</Subtitle>
          <ScrollableChartContainer minWidth={chartMinWidth}>
            <AreaChart
              className="h-80 mt-4"
              data={chartData}
              index="date"
              categories={["Worked Hours"]}
              colors={["green"]}
              valueFormatter={(num) => formatAxisValue(num, true)}
              customTooltip={(props) => <ChartTooltip {...props} isPayroll />}
              showAnimation={true}
              showLegend={false}
              yAxisWidth={65}
              curveType="monotone"
            />
          </ScrollableChartContainer>
        </Card>
      </motion.div>

      {isLoading && (
        <div className="text-center py-10 text-vgsgray animate-pulse">
          Fetching your records...
        </div>
      )}

      {!isLoading && chartData.length === 0 && (
        <Card className="bg-gray-50 border-dashed border-2 border-vgsgray flex flex-col items-center justify-center py-12">
          <p className="text-vgsgray font-medium">
            No records found for this period.
          </p>
        </Card>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </motion.div>
  );
};

export default MyAttendance;