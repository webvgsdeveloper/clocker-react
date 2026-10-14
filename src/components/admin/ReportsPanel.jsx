// src/components/admin/ReportPanel.jsx
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
  Flex,
  Grid,
  Metric,
  Text,
} from "@tremor/react";
import {
  faFileExcel,
  faDownload,
  faUser,
  faFilter,
  faBroom,
  faCalendarDays,
  faClock,
  faExclamationTriangle,
  faHourglassHalf,
  faAlarmClock,
  faUsers,
  faChevronLeft,
  faChevronRight,
  faInbox,
  faBorderNone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { formatDuration } from "../../utils/formatters.js";
import api from "../../services/api";
import { STATUS_CONFIG } from "../layout/statusConfig";
import DateRangePicker from "../common/DateRangePicker";
import Button from "../common/Button";
import Input from "../common/Input";
import StatusBadge from "../common/StatusBadge";
import Badge from "../common/Badge";
import ConfirmationBox from "../common/ConfirmationBox";
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
  if (!value || value === 0) return "";
  if (isPayroll) return `${Math.round(value)}h`;
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const mins = Math.round(value % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.round(value)}m`;
};

const getFirstName = (name) => (name ? name.trim().split(" ")[0] : "User");

const ScrollableChartContainer = ({ children, minWidth }) => (
  <div className="mt-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#f1f1f1] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
    <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
  </div>
);

const EmptyChartState = ({ message = "No data available for this period" }) => (
  <div className="h-80 flex flex-col items-center justify-center text-vgsgray/50 gap-3 border-2 border-dashed border-vgsgray/10 rounded-xl mt-6">
    <FontAwesomeIcon icon={faInbox} size="2xl" />
    <p className="text-sm font-medium uppercase tracking-wider">{message}</p>
  </div>
);

const CustomTooltip = ({ payload, active, label, isPayroll = false }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <motion.div
      variants={tooltipVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-y-1 min-w-50 p-3 rounded-md border border-vgsgray border-dashed bg-vgswhite shadow-lg z-50"
    >
      <div className="border-b border-vgsgray/20 pb-1 mb-1">
        <p className="text-[10px] font-bold text-vgsblack uppercase tracking-tight">
          {data.fullName || label}
        </p>
        {data.dateLabel && (
          <p className="text-[9px] text-vgsgray">{data.dateLabel}</p>
        )}
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

const KPICards = ({ chartData, isSingleUser }) => {
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    if (isSingleUser) {
      const totalHours = chartData.reduce(
        (acc, curr) => acc + (curr["Worked Hours"] || 0),
        0,
      );
      const totalOver = chartData.reduce(
        (acc, curr) => acc + (curr["Total Overrate"] || 0),
        0,
      );
      return {
        main: {
          label: "Total Worked Hours",
          val: `${totalHours.toFixed(1)}h`,
          icon: faClock,
          color: "green",
        },
        secondary: {
          label: "Total Overrate",
          val: formatAxisValue(totalOver) || "No overrate",
          icon: faAlarmClock,
          color: "red",
        },
        tertiary: {
          label: "Days Analyzed",
          val: chartData.length,
          icon: faCalendarDays,
          color: "teal",
        },
      };
    } else {
      const totalOver = chartData.reduce(
        (acc, curr) => acc + (curr["Total Overrate"] || 0),
        0,
      );
      const avgOver = totalOver / chartData.length;
      const topOffender = [...chartData].sort(
        (a, b) => b["Total Overrate"] - a["Total Overrate"],
      )[0];
      return {
        main: {
          label: "Avg Overrate",
          val: formatAxisValue(avgOver) || "No overrate",
          icon: faUsers,
          color: "blue",
        },
        secondary: {
          label: "Top Overrate",
          val: formatAxisValue(topOffender["Total Overrate"]),
          sub: topOffender.name,
          icon: faExclamationTriangle,
          color: "red",
        },
        tertiary: {
          label: "Staff members",
          val: chartData.length,
          icon: faUser,
          color: "teal",
        },
      };
    }
  }, [chartData, isSingleUser]);

  if (!stats) return null;

  return (
    <Grid numItemsSm={1} numItemsLg={3} className="gap-6">
      {[stats.main, stats.secondary, stats.tertiary].map((item, i) => (
        <Card
          key={i}
          className={`bg-vgswhite border border-vgsgray border-t-4 border-t-${item.color}-500 rounded-lg`}
        >
          <Flex justifyContent="start" className="gap-4">
            <Badge
              icon={item.icon}
              variant={item.color}
              size="lg"
              outline="true"
            />
            <div className="flex flex-wrap font-bold gap-x-2 items-center">
              <span className={`text-${item.color}-600 uppercase text-[10px] w-full font-bold`}>
                {item.label}
              </span>
              {item.sub && (
                <Text className=" text-vgsblack text-md mt-1">{item.sub}</Text>
              )}
              <Metric className="text-vgsblack text-xl leading-none">
                {item.val}
              </Metric>
            </div>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
};

const StatusLegend = ({
  visibleStatuses,
  hiddenCats,
  onToggle,
  isOverrate = false,
}) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [moved, setMoved] = useState(false);

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
  }, [checkScroll, visibleStatuses]);

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
    const x = e.pageX - startX;
    const walk = x * 1.5;
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
      <AnimatePresence>
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            onClick={() => scrollBy(-120)}
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
        className="flex p-1 gap-2 flex-1 overflow-x-auto items-center cursor-grab active:cursor-grabbing select-none scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:display-none"
      >
        <AnimatePresence mode="popLayout">
          {visibleStatuses.map((status) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!moved) onToggle(status);
              }}
            >
              <StatusBadge
                status={status}
                icon={isOverrate ? faExclamationTriangle : null}
                className={`transition-all ${hiddenCats.has(status) ? "grayscale opacity-30" : "opacity-100"}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            onClick={() => scrollBy(120)}
            className="absolute right-0 z-10 bg-linear-to-l from-vgswhite via-vgswhite to-transparent pl-4 pr-1 text-vgsgray hover:text-vgsblack transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} size="xs" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReportsPanel = ({ token }) => {
  const [dates, setDates] = useState([
    new Date(new Date().setDate(new Date().getDate() - 7)),
    new Date(),
  ]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [hiddenCats, setHiddenCats] = useState(new Set());
  const [appliedFilters, setAppliedFilters] = useState({
    dates: [new Date(new Date().setDate(new Date().getDate() - 7)), new Date()],
    user: "",
    status: "",
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmExport, setShowConfirmExport] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ["workgroup-users"],
    queryFn: () => api.getUsers(token, { limit: 1000 }),
    enabled: !!token,
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["metrics", appliedFilters.dates, appliedFilters.user],
    queryFn: () =>
      api.getMetrics(token, {
        startDate: appliedFilters.dates[0],
        endDate: appliedFilters.dates[1],
        userId: appliedFilters.user || null,
      }),
    enabled: !!token,
  });

  const handleSync = () =>
    setAppliedFilters({ dates, user: selectedUser, status: selectedStatus });

  const handleClearFilters = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const lastweek = new Date();
    lastweek.setDate(lastweek.getDate() - 7);
    lastweek.setHours(0, 0, 0, 0);
    const defaultDates = [lastweek, now];
    setDates(defaultDates);
    setSelectedUser("");
    setSelectedStatus("");
    setAppliedFilters({
      dates: defaultDates,
      user: "",
      status: "",
    });
    setHiddenCats(new Set());
  };

  const toggleCategory = useCallback((status) => {
    setHiddenCats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) newSet.delete(status);
      else newSet.add(status);
      return newSet;
    });
  }, []);

  const {
    chartData,
    usageConfig,
    overrateConfig,
    usageVisibleStatuses,
    overrateVisibleStatuses,
    isSingleUser,
    hasWorkedHours,
  } = useMemo(() => {
    const rawData = metrics?.data || [];
    const isSingle = !!appliedFilters.user;
    const dataMap = {};

    rawData.forEach((curr) => {
      if (
        appliedFilters.status &&
        curr.status.toLowerCase() !== appliedFilters.status.toLowerCase()
      )
        return;
      const groupKey = isSingle
        ? new Date(curr.date).toISOString().split("T")[0]
        : curr.user_name;

      if (!dataMap[groupKey]) {
        dataMap[groupKey] = {
          index: isSingle
            ? new Date(curr.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
            : getFirstName(curr.user_name),
          fullName: curr.user_name,
          dateLabel: isSingle
            ? new Date(curr.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            : null,
          name: getFirstName(curr.user_name),
          "Worked Hours": 0,
          "Total Overrate": 0,
          online_count: 0,
        };
        RELEVANT_STATUSES.forEach((st) => {
          dataMap[groupKey][`${st}_usage`] = 0;
          dataMap[groupKey][`${st}_overrate`] = 0;
          dataMap[groupKey][`${st}_count`] = 0;
        });
      }

      const rawStatus = curr.status.toLowerCase();
      let statusKey =
        rawStatus === "meeting" || rawStatus === "team"
          ? "team_meeting"
          : rawStatus;

      if (RELEVANT_STATUSES.includes(statusKey)) {
        dataMap[groupKey][`${statusKey}_usage`] += parseFloat(
          curr.total_minutes || 0,
        );
        const overVal = parseFloat(curr.overrate_minutes || 0);
        dataMap[groupKey][`${statusKey}_overrate`] += overVal;
        dataMap[groupKey]["Total Overrate"] += overVal;
        dataMap[groupKey][`${statusKey}_count`] += curr.occurrences || 0;
      } else if (statusKey === "online") {
        dataMap[groupKey]["online_count"] += curr.occurrences || 0;
      }

      dataMap[groupKey]["Worked Hours"] = isSingle
        ? curr.worked_hours || 0
        : dataMap[groupKey]["Worked Hours"] + (curr.worked_hours || 0);
    });

    const initialData = Object.values(dataMap);

    const getAvailableStatuses = (suffix) => {
      return RELEVANT_STATUSES.filter((st) =>
        initialData.some((d) => d[`${st}_${suffix}`] > 0),
      );
    };

    const usageVisible = getAvailableStatuses("usage");
    const overrateVisible = getAvailableStatuses("overrate");
    const hasWorked = initialData.some((d) => d["Worked Hours"] > 0);

    const finalChartData = initialData.map((item) => {
      const newItem = { ...item };
      RELEVANT_STATUSES.forEach((st) => {
        if (hiddenCats.has(st)) {
          newItem[`${st}_usage`] = 0;
          newItem[`${st}_overrate`] = 0;
        }
      });
      return newItem;
    });

    const getChartConfig = (availableList, suffix) => ({
      cats: availableList.map((st) => `${st}_${suffix}`),
      cols: availableList.map((st) => STATUS_TO_TREMOR_COLOR[st] || "blue"),
    });

    return {
      chartData: finalChartData,
      usageConfig: getChartConfig(usageVisible, "usage"),
      overrateConfig: getChartConfig(overrateVisible, "overrate"),
      usageVisibleStatuses: usageVisible,
      overrateVisibleStatuses: overrateVisible,
      isSingleUser: isSingle,
      hasWorkedHours: hasWorked,
    };
  }, [metrics, appliedFilters.user, appliedFilters.status, hiddenCats]);

  const chartMinWidth = useMemo(() => {
    const minPixelPerBar = isSingleUser ? 80 : 120;
    return Math.max(chartData.length * minPixelPerBar, 600);
  }, [chartData.length, isSingleUser]);

  const reportsContainerVariants = staggerContainer(0.1);

  return (
    <motion.div
      variants={reportsContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <Card className="border border-vgsgray/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <DateRangePicker
              label="Date Range"
              icon={faCalendarDays}
              startDate={dates[0]}
              endDate={dates[1]}
              onChange={setDates}
            />
            <Input
              type="select"
              label="Filter by User"
              icon={faUser}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">All Users</option>
              {usersData?.users?.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.nombre}
                </option>
              ))}
            </Input>
            <Input
              type="select"
              label="Filter by Status"
              icon={faFilter}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
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
                onClick={handleSync}
                disabled={isLoading}
                className="flex-1"
                tittle="Apply filters"
                animation="pop"
              >
                Filter
              </Button>
              <Button
                variant="green"
                icon={faFileExcel}
                onClick={() => setShowConfirmExport(true)}
                className="px-4"
                tittle="Export Excel"
                animation="shrink"
              >
                Export
              </Button>
              <Button
                variant="gray"
                icon={faBroom}
                onClick={handleClearFilters}
                className="px-4"
                tittle="Clear filters"
                animation="translate"
              />
            </div>
          </div>
        </Card>
      </motion.div>
      <AnimatePresence mode="wait">
        {!isLoading && chartData.length > 0 && (
          <motion.div
            key="kpi-section"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            layout
          >
            <KPICards chartData={chartData} isSingleUser={isSingleUser} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!isLoading && chartData.length > 0 ? (
          <motion.div
            key="charts-section"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col gap-6"
          >
            <div
              className={`grid grid-cols-1 ${isSingleUser ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6`}
            >
              {isSingleUser && (
                <Card className="border border-vgsgray overflow-hidden h-full">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 w-full overflow-hidden">
                        <div className="shrink-0 flex items-center gap-2">
                          <Badge
                            icon={faHourglassHalf}
                            variant="blue"
                            outline="true"
                            size="md"
                          />
                          <Title className="text-vgsblack font-bold">
                            Time Usage
                          </Title>
                        </div>
                        {usageVisibleStatuses.length > 0 && (
                          <StatusLegend
                            visibleStatuses={usageVisibleStatuses}
                            hiddenCats={hiddenCats}
                            onToggle={toggleCategory}
                          />
                        )}
                      </div>
                      <Subtitle>Distribution per status</Subtitle>
                    </div>
                  </div>
                  {usageVisibleStatuses.length > 0 ? (
                    <ScrollableChartContainer minWidth={chartMinWidth}>
                      <BarChart
                        className="h-80"
                        data={chartData}
                        index="index"
                        categories={usageConfig.cats}
                        colors={usageConfig.cols}
                        stack={true}
                        valueFormatter={(num) => formatAxisValue(num, false)}
                        customTooltip={CustomTooltip}
                        showAnimation={true}
                        showLegend={false}
                        yAxisWidth={75}
                      />
                    </ScrollableChartContainer>
                  ) : (
                    <EmptyChartState message="No auxiliary status usage recorded" />
                  )}
                </Card>
              )}

              <Card className="border border-vgsgray overflow-hidden h-full">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <div className="shrink-0 flex items-center gap-2">
                        <Badge
                          icon={faAlarmClock}
                          variant="red"
                          outline="true"
                          size="md"
                        />
                        <Title className="text-vgsblack font-bold">
                          Overrate
                        </Title>
                      </div>
                      {overrateVisibleStatuses.length > 0 && (
                        <StatusLegend
                          visibleStatuses={overrateVisibleStatuses}
                          hiddenCats={hiddenCats}
                          onToggle={toggleCategory}
                          isOverrate
                        />
                      )}
                    </div>
                    <Subtitle>
                      {isSingleUser
                        ? `Excess time taken for ${chartData[0]?.fullName || "User"}`
                        : `Excess time taken per user`}
                    </Subtitle>
                  </div>
                </div>
                {overrateVisibleStatuses.length > 0 ? (
                  <ScrollableChartContainer minWidth={chartMinWidth}>
                    <BarChart
                      className="h-80"
                      data={chartData}
                      index="index"
                      categories={overrateConfig.cats}
                      colors={overrateConfig.cols}
                      stack={true}
                      valueFormatter={(num) => formatAxisValue(num, false)}
                      customTooltip={CustomTooltip}
                      showAnimation={true}
                      showLegend={false}
                      yAxisWidth={75}
                    />
                  </ScrollableChartContainer>
                ) : (
                  <EmptyChartState message="No overrate found" />
                )}
              </Card>
            </div>
            <Card className="border border-vgsgray overflow-hidden px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status="online" />
                <Title className="text-vgsblack font-bold">
                  Worked Hours (Payroll)
                </Title>
              </div>
              <Subtitle>
                {isSingleUser
                  ? `Work time for ${chartData[0]?.fullName || "User"}`
                  : `Work time per user`}
              </Subtitle>
              {hasWorkedHours ? (
                <ScrollableChartContainer minWidth={chartMinWidth}>
                  {isSingleUser ? (
                    <AreaChart
                      className="h-80 mt-6"
                      data={chartData}
                      index="index"
                      categories={["Worked Hours"]}
                      colors={["green"]}
                      valueFormatter={(num) => formatAxisValue(num, true)}
                      customTooltip={(props) => (
                        <CustomTooltip {...props} isPayroll />
                      )}
                      showAnimation={true}
                      showLegend={false}
                      yAxisWidth={75}
                      curveType="monotone"
                    />
                  ) : (
                    <BarChart
                      className="h-80 mt-6"
                      data={chartData}
                      index="index"
                      categories={["Worked Hours"]}
                      colors={["green"]}
                      valueFormatter={(num) => formatAxisValue(num, true)}
                      customTooltip={(props) => (
                        <CustomTooltip {...props} isPayroll />
                      )}
                      showAnimation={true}
                      showLegend={false}
                      yAxisWidth={75}
                    />
                  )}
                </ScrollableChartContainer>
              ) : (
                <EmptyChartState message="No worked hours recorded for this selection" />
              )}
            </Card>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 text-vgsgray animate-pulse font-bold text-lg"
          >
            Fetching report data...
          </motion.div>
        ) : !isLoading && metrics?.data?.length === 0 ? (
          <motion.div
            key="no-data-global"
            variants={fadeInUp}
            className="flex items-center justify-center py-20 border-2 rounded-lg border-dashed border-vgsgray gap-x-4 text-vgsgray"
          >
            <FontAwesomeIcon icon={faBorderNone} />
            <span className="font-bold uppercase">No results found</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ConfirmationBox
        isOpen={showConfirmExport}
        onClose={() => setShowConfirmExport(false)}
        onConfirm={async () => {
          setIsExporting(true);
          try {
            const blob = await api.exportExcel(token, {
              startDate: appliedFilters.dates[0],
              endDate: appliedFilters.dates[1],
              userId: appliedFilters.user,
            });
            saveAs(
              blob,
              `Team_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
            );
            setShowConfirmExport(false);
          } catch (e) {
            console.error(e);
          } finally {
            setIsExporting(false);
          }
        }}
        loading={isExporting}
        icon={faFileExcel}
        title="Export Detailed Report"
        description="This will generate an Excel file with detailed logs for the selected date range."
        confirmText="Download"
        variant="online"
        confirmIcon={faDownload}
      />
    </motion.div>
  );
};

export default ReportsPanel;