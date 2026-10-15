// components/admin/HistoryPanel.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import api from "../../services/api";
import Card from "../common/Card";
import { formatDuration, formatDateTime } from "../../utils/formatters";
import FilterBar from "./FilterBar";
import StatusBadge from "../common/StatusBadge";
import Pagination from "../common/Pagination";
import { useNotification } from "../../contexts/NotificationContext";
import {
  staggerContainer,
  historyRowVariants
} from "../common/animations";

const containerVariants = staggerContainer(0.08);

const HistoryItem = memo(({ record }) => (
  <motion.div
    variants={historyRowVariants}
    layout
    className="w-full"
  >
    <Card className="hover:shadow-md border-l-4 border-gray-200 transition-shadow">
      <header className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-900 underline">{record.nombre}</p>
        </div>
        <StatusBadge status={record.status} />
      </header>

      <section className="mt-3 text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-100 font-medium">
        <div>
          <span className="text-gray-400 uppercase mr-1 font-bold">Start:</span>
          {formatDateTime(record.started_at)}
        </div>
        <div>
          <span className="text-gray-400 uppercase mr-1 font-bold">End:</span>
          {record.ended_at ? (
            formatDateTime(record.ended_at)
          ) : (
            <span className="text-green-600 italic">In progress...</span>
          )}
        </div>
        {record.duration_minutes !== null && (
          <div className="col-span-full pt-2 text-gray-500">
            <span className="text-gray-400 uppercase mr-1 font-bold">
              DURATION:
            </span>
            {formatDuration(record.duration_minutes)}
          </div>
        )}
      </section>
    </Card>
  </motion.div>
));

HistoryItem.displayName = "HistoryItem";

const EmptyHistoryState = () => (
  <motion.div
    variants={historyRowVariants}
    className="text-center py-16 bg-white rounded-xl border-2 border-dashed text-gray-400"
  >
    No records found.
  </motion.div>
);

const HistoryPanel = ({ token }) => {
  const { showLoading, hideLoading } = useNotification();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total_records: 0, total_pages: 0 });
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    estado: "",
    fechaInicio: null,
    fechaFin: null,
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const cache = useRef({});
  const ITEMS_PER_PAGE = 10;

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      nombre: "",
      cedula: "",
      estado: "",
      fechaInicio: null,
      fechaFin: null,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const loadHistory = async () => {
      const filterKey = JSON.stringify(debouncedFilters);

      if (cache.current[filterKey]?.[currentPage]) {
        const cachedResponse = cache.current[filterKey][currentPage];
        setHistory(cachedResponse.history);
        setMeta(cachedResponse.meta);
        setLoading(false);
        return;
      }

      const loaderId = "fetch-history";
      showLoading(loaderId, "History", "Searching records...");
      setLoading(true);

      try {
        const params = {
          nombre: debouncedFilters.nombre || null,
          cedula: debouncedFilters.cedula || null,
          estado: debouncedFilters.estado || null,
          start_date: debouncedFilters.fechaInicio?.toISOString() || null,
          end_date: debouncedFilters.fechaFin?.toISOString() || null,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        };

        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== null && v !== "" && v !== undefined)
        );

        const response = await api.getHistory(token, cleanParams);

        if (response.success) {
          const historyList = response.history || response.data || [];
          const rawMeta = response.meta || response.pagination || {};
          const totalRecords =
            rawMeta.total_records ??
            rawMeta.totalRecords ??
            rawMeta.total ??
            rawMeta.count ??
            historyList.length;

          const totalPages =
            rawMeta.total_pages ??
            rawMeta.totalPages ??
            rawMeta.pages ??
            (totalRecords > 0 ? Math.ceil(totalRecords / ITEMS_PER_PAGE) : 1);

          const data = {
            history: historyList,
            meta: {
              total_records: Number(totalRecords) || historyList.length,
              total_pages: Number(totalPages) || 1,
            },
          };
          setHistory(data.history);
          setMeta(data.meta);
          if (!cache.current[filterKey]) cache.current[filterKey] = {};
          cache.current[filterKey][currentPage] = data;
        }
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
        hideLoading(loaderId);
      }
    };
    loadHistory();
  }, [debouncedFilters, currentPage, token, showLoading, hideLoading]);

  return (
    <section className="space-y-6">
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        showStatusFilter={true}
        showDateFilter={true}
      />
      
      <main className="min-h-125">
        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse font-medium">
            Fetching history records...
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${JSON.stringify(debouncedFilters)}-${currentPage}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-3"
              >
                {history.length > 0 ? (
                  history.map((record) => (
                    <HistoryItem key={record.history_id} record={record} />
                  ))
                ) : (
                  <EmptyHistoryState key="empty" />
                )}
              </motion.div>
            </AnimatePresence>

            {history.length > 0 && (
              <footer className="pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={meta.total_pages || 1}
                  onPageChange={setCurrentPage}
                  totalRecords={meta.total_records}
                  currentCount={history.length}
                  unit="records"
                />
              </footer>
            )}
          </div>
        )}
      </main>
    </section>
  );
};

export default HistoryPanel;