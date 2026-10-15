// src/components/reports/KPICards.jsx
import { useMemo } from "react";
import { Grid, Card, Flex, Metric, Text } from "@tremor/react";
import {
  faClock,
  faAlarmClock,
  faCalendarDays,
  faUsers,
  faExclamationTriangle,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import Badge from "../common/Badge";
import { formatAxisValue, KPI_COLOR_MAP } from "./analyticsConfig";

const KPICards = ({ chartData, data, isSingleUser = false }) => {
  const effectiveData = useMemo(
    () => chartData || data || [],
    [chartData, data],
  );
  const effectiveSingleUser = isSingleUser || Boolean(data);

  const stats = useMemo(() => {
    if (!effectiveData || effectiveData.length === 0) return null;

    if (effectiveSingleUser) {
      const totalHours = effectiveData.reduce(
        (acc, curr) => acc + (curr["Worked Hours"] || 0),
        0,
      );
      const totalOver = effectiveData.reduce(
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
          val: effectiveData.length,
          icon: faCalendarDays,
          color: "teal",
        },
      };
    }

    const totalOver = effectiveData.reduce(
      (acc, curr) => acc + (curr["Total Overrate"] || 0),
      0,
    );
    const avgOver = totalOver / effectiveData.length;
    const topOffender = [...effectiveData].sort(
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
        val: topOffender ? formatAxisValue(topOffender["Total Overrate"]) : "0m",
        sub: topOffender?.name || "",
        icon: faExclamationTriangle,
        color: "red",
      },
      tertiary: {
        label: "Staff members",
        val: effectiveData.length,
        icon: faUser,
        color: "teal",
      },
    };
  }, [effectiveData, effectiveSingleUser]);


  if (!stats) return null;

  const items = [stats.main, stats.secondary, stats.tertiary];

  return (
    <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mb-6">
      {items.map((item, i) => {
        const colorStyle = KPI_COLOR_MAP[item.color] || KPI_COLOR_MAP.blue;
        return (
          <Card
            key={i}
            className={`bg-vgswhite border border-vgsgray border-t-4 ${colorStyle.border} rounded-lg`}
          >
            <Flex justifyContent="start" className="gap-4">
              <Badge
                icon={item.icon}
                variant={item.color}
                size="lg"
                outline="true"
              />
              <div className="flex flex-wrap font-bold gap-x-2 items-center">
                <span
                  className={`${colorStyle.text} uppercase text-[10px] w-full font-bold`}
                >
                  {item.label}
                </span>
                {item.sub && (
                  <Text className="text-vgsblack text-md mt-1">{item.sub}</Text>
                )}
                <Metric className="text-vgsblack text-xl leading-none">
                  {item.val}
                </Metric>
              </div>
            </Flex>
          </Card>
        );
      })}
    </Grid>
  );
};

export default KPICards;
