// src/components/examples/ComponentTemplate.jsx
import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faRefresh } from "@fortawesome/free-solid-svg-icons";
import Card from "../common/Card";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import { formatDuration, formatDateTime } from "../../utils/formatters";

/**
 * ComponentTemplate demonstrates standard Clocker React conventions:
 * 1. Purposeful English comments only (no trivial commentary).
 * 2. Composition of common atomic components (Card, Button, StatusBadge).
 * 3. Use of corporate Tailwind v4 tokens (vgsdarkblue, vgsgray, vgswhite).
 * 4. Reuse of existing utilities (formatDuration, formatDateTime).
 * 5. Clean lifecycle management and derived state calculation.
 */
const ComponentTemplate = ({
  title,
  userStatus = "online",
  totalMinutes = 0,
  lastUpdated,
  onRefresh,
  isLoading = false,
}) => {
  // Grace period timer: 30 seconds before allowing another manual sync
  const [cooldown, setCooldown] = useState(0);

  // Derive human-readable metrics without duplicating state
  const formattedDuration = useMemo(
    () => formatDuration(totalMinutes),
    [totalMinutes]
  );
  const formattedTimestamp = useMemo(
    () => formatDateTime(lastUpdated),
    [lastUpdated]
  );

  // Decrement cooldown every second until zero
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRefreshClick = () => {
    if (cooldown > 0 || isLoading) return;
    setCooldown(30);
    if (onRefresh) onRefresh();
  };

  return (
    <Card className="flex flex-col gap-4 border border-vgsgray/20">
      {/* Header section with status indicator */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-vgsdarkblue tracking-tight">
          {title}
        </h3>
        <StatusBadge status={userStatus} />
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-2 gap-4 py-2 border-y border-vgsgray/15">
        <div className="flex items-center gap-2 text-sm text-vgsgray">
          <FontAwesomeIcon icon={faClock} className="text-vgsdarkblue" />
          <span className="font-medium text-vgsblack">{formattedDuration}</span>
        </div>
        <div className="text-right text-xs text-vgsgray self-center">
          {formattedTimestamp || "No updates yet"}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex justify-end items-center gap-3">
        <Button
          variant="blue"
          icon={faRefresh}
          animation="grow"
          disabled={cooldown > 0 || isLoading}
          onClick={handleRefreshClick}
        >
          {cooldown > 0 ? `Wait ${cooldown}s` : "Refresh"}
        </Button>
      </div>
    </Card>
  );
};

ComponentTemplate.propTypes = {
  title: PropTypes.string.isRequired,
  userStatus: PropTypes.string,
  totalMinutes: PropTypes.number,
  lastUpdated: PropTypes.string,
  onRefresh: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default ComponentTemplate;
