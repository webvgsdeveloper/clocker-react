// src/components/admin/ReportPanel.jsx
import {
  useState,
  useMemo,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Title,
  BarChart,
  AreaChart,
  Subtitle,
} from "@tremor/react";
import {
  faFileExcel,
  faDownload,
  faUser,
  faFilter,
  faBroom,
  faCalendarDays,
  faHourglassHalf,
  faAlarmClock,
  faBorderNone,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
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
  staggerContainer,
} from "../common/animations";

import {
  RELEVANT_STATUSES,
  STATUS_TO_TREMOR_COLOR,
  formatAxisValue,
  getFirstName,
} from "../reports/analyticsConfig";
import ScrollableChartContainer from "../reports/ScrollableChartContainer";
import EmptyChartState from "../reports/EmptyChartState";
import CustomTooltip from "../reports/AnalyticsTooltip";
import KPICards from "../reports/KPICards";
import StatusLegend from "../reports/StatusLegend";


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