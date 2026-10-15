// src/components/common/SortableHeader.jsx
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";

const SortableHeader = ({
  label,
  column,
  currentSort,
  onSort,
  className = "",
}) => {
  const isActive = currentSort?.sortBy === column;
  const isAsc = currentSort?.sortOrder === "ASC";

  return (
    <th
      scope="col"
      className={`py-3 bg-vgsred text-vgswhite cursor-pointer group select-none transition-colors hover:bg-vgsred/80 ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="uppercase tracking-wider text-[11px] font-bold group-hover:underline">
          {label}
        </span>
        <motion.div
          animate={{
            opacity: isActive ? 1 : 0.4,
            scale: isActive ? 1.1 : 1,
          }}
          className="text-[10px]"
        >
          <FontAwesomeIcon
            icon={!isActive ? faSort : isAsc ? faSortUp : faSortDown}
          />
        </motion.div>
      </div>
    </th>
  );
};

export default SortableHeader;
