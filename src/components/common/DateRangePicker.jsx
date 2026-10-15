// src/components/common/DateRangePicker.jsx
import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, startOfDay, endOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Input from "./Input";
import Button from "./Button";
import "react-day-picker/dist/style.css";

const DateRangePicker = ({
  label,
  icon,
  startDate,
  endDate,
  onChange,
  animate = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [tempRange, setTempRange] = useState({
    from: startDate,
    to: endDate,
  });

  useEffect(() => {
    setTempRange({ from: startDate, to: endDate });
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setTempRange({ from: startDate, to: endDate });
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [startDate, endDate]);

  const handleSelect = (range) => {
    setTempRange(range || { from: null, to: null });
  };

  const handleApply = () => {
    let finalStart = tempRange?.from;
    let finalEnd = tempRange?.to;

    if (finalStart) {
      finalStart = startOfDay(finalStart);
      if (!finalEnd) {
        finalEnd = endOfDay(finalStart);
      } else {
        finalEnd = endOfDay(finalEnd);
      }
    }

    onChange([finalStart, finalEnd]);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyRange = [null, null];
    setTempRange({ from: null, to: null });
    onChange(emptyRange);
    setIsOpen(false);
  };

  const getInputValue = () => {
    if (!startDate) return "";
    const startStr = format(startDate, "MM/dd/yyyy");
    if (!endDate) return `${startStr} - ...`;
    return `${startStr} - ${format(endDate, "MM/dd/yyyy")}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        label={label}
        icon={icon}
        animate={animate}
        value={getInputValue()}
        readOnly
        onFocus={() => setIsOpen(true)}
        isFocused={isOpen}
        autoComplete="off"
        className="cursor-pointer text-md"
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-100 bg-vgswhite shadow-md border border-vgsgray rounded-md origin-top-left left-0"
          >
            <DayPicker
              animate
              showOutsideDays
              mode="range"
              selected={tempRange}
              onSelect={handleSelect}
              locale={enUS}
              numberOfMonths={1}
              disabled={{ dayOfWeek: [0, 6] }}
              className="m-0! w-full"
              classNames={{
                month: "space-y-4 w-full",
                month_caption:
                  "relative flex justify-center items-center h-10 mb-4 w-full pt-2",
                caption_label: "text-sm font-bold text-vgswhite z-50",
                nav: "p-2 bg-vgsdarkblue absolute inset-x-0 flex items-center justify-between w-full z-20 pointer-events-none rounded-t-md",
                button_previous:
                  "pointer-events-auto h-8 w-8 flex items-center justify-center",
                button_next:
                  "pointer-events-auto h-8 w-8 flex items-center justify-center",
                month_grid: "w-full border-collapse",
                weekdays: "flex items-center justify-center",
                weekday:
                  "text-vgsred w-9 font-bold text-xs uppercase tracking-wider text-center border-b-1 border-dashed border-vgsgray/50 pb-1",
                weeks: "w-full",
                week: "flex w-full mt-2 mx-5",
                cell: "h-5 w-5 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-5 w-9 flex items-center justify-center p-0 rounded-xs transition-all",
                selected:
                  "bg-vgsdarkblue text-vgswhite hover:bg-vgsdarkblue hover:text-vgswhite focus:bg-vgsdarkblue focus:text-vgswhite",
                range_start: "bg-vgsdarkblue text-vgswhite rounded-l-full",
                range_end: "bg-vgsdarkblue text-vgswhite rounded-r-full",
                range_middle: "bg-vgsdarkblue/40 text-vgsdarkblue rounded-none",
                today: "text-vgsred font-bold border-1 border-dotted",
                day_outside: "text-vgsgray/30 opacity-30",
                day_hidden: "invisible",
                chevron: "fill-vgswhite border-none",
              }}
            />
            <div className="flex justify-end mt-4 border-t py-2 px-3 gap-2 border-dashed border-vgsgray">
              <Button
                variant="gray"
                animation="translate"
                onClick={handleClear}
                className="text-xs"
              >
                Clear
              </Button>
              <Button
                variant="red"
                animation="translate"
                onClick={handleApply}
                className="text-xs"
              >
                Apply
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateRangePicker;
