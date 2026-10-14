//components/admin/FilterBar.jsx
import React, { memo } from "react";
import { STATUS_CONFIG } from "../layout/statusConfig";
import Input from "../common/Input";
import Button from "../common/Button";
import DateRangePicker from "../common/DateRangePicker";
import {
  faBroom,
  faMagnifyingGlass,
  faIdBadge,
  faCalendarDays,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

/**
 * FilterBar Component
 */
const FilterBar = memo(
  ({
    filters,
    onFilterChange,
    onClear,
    showStatusFilter = true,
    showDateFilter = false,
  }) => {
    const handleDateChange = (dates) => {
      const [start, end] = dates;
      onFilterChange("fechaInicio", start);
      onFilterChange("fechaFin", end);
    };

    return (
      <section
        className="bg-white p-4 rounded-lg shadow-sm border border-vgsgray/50 mb-6 flex flex-wrap gap-4 items-end"
        aria-label="Table filters"
      >
        <div className="flex-1 min-w-37.5">
          <Input
            label="Name"
            value={filters.nombre || ""}
            onChange={(e) => onFilterChange("nombre", e.target.value)}
            placeholder="Type a name"
            icon={faMagnifyingGlass}
            animate={true}
          />
        </div>
        <div className="w-40">
          <Input
            label="Identification"
            value={filters.cedula || ""}
            onChange={(e) => onFilterChange("cedula", e.target.value)}
            placeholder="12345..."
            icon={faIdBadge}
            animate={true}
          />
        </div>
        {showDateFilter && (
          <div className="w-72">
            <DateRangePicker
              label="Date Range"
              icon={faCalendarDays}
              startDate={filters.fechaInicio}
              endDate={filters.fechaFin}
              onChange={handleDateChange}
              animate={true}
            />
          </div>
        )}
        {showStatusFilter && (
          <div className="w-44">
            <Input
              type="select"
              label="Status"
              icon={faFilter}
              value={filters.estado || ""}
              onChange={(e) => onFilterChange("estado", e.target.value)}
              animate={true}
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(
                ([key, value]) =>
                  key !== "default" && (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ),
              )}
            </Input>
          </div>
        )}
        <Button
          onClick={onClear}
          variant="gray"
          animation="shrink"
          className="px-4 py-5.5 text-sm font-medium"
          icon={faBroom}
          title="Clear all filters"
        />
      </section>
    );
  },
);

FilterBar.displayName = "FilterBar";

export default FilterBar;
