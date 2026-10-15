// src/components/reports/StatusLegend.jsx
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "../common/StatusBadge";

const StatusLegend = ({
  visibleStatuses,
  hiddenCats,
  onToggle,
  appliedFilter = "",
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
    return visibleStatuses.filter((s) => s === appliedFilter);
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
          {filteredList.map((status) => (
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

export default StatusLegend;
