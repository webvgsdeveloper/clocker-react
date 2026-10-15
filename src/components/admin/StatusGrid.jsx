// components/admin/StatusGrid.jsx
import { memo, useState } from "react";
import {
  faThLarge,
  faList
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import Image from "../common/Image";
import api from "../../services/api";
import UserTimelineModal from "../dashboard/UserTimelineModal";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { pageVariants } from "../common/animations";

import SortableHeader from "../common/SortableHeader";
import UserStatusCard from "./UserStatusCard";

const StatusGrid = memo(({ users, lastUpdate, currentPage = 1, sorting, onSort }) => {
  const { token } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  const formattedSync = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    : "Never";

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-vgsred">
            Users Real-Time Status
          </h2>

          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 relative">
            <Button
              onClick={() => setViewMode("grid")}
              variant="transparent"
              className={`relative px-3 py-1 rounded-md transition-colors flex items-center gap-2 text-xs font-bold z-10 ${viewMode === "grid"
                  ? "text-vgsred"
                  : "text-vgsgray hover:text-vgsblack"
                }`}
              title="Grid View"
            >
              {viewMode === "grid" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-vgswhite rounded-md shadow-sm"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <span className="relative z-20">
                <FontAwesomeIcon icon={faThLarge} />
              </span>
            </Button>

            <Button
              onClick={() => setViewMode("table")}
              variant="transparent"
              className={`relative px-3 py-1 rounded-md transition-colors flex items-center gap-2 text-xs font-bold z-10 ${viewMode === "table"
                  ? "text-vgsred"
                  : "text-vgsgray hover:text-vgsblack"
                }`}
              title="Table View"
            >
              {viewMode === "table" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-vgswhite rounded-md shadow-sm"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
              <span className="relative z-20">
                <FontAwesomeIcon icon={faList} />
              </span>
            </Button>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-vgsgray italic font-medium">
            Last sync: <time className="not-italic">{formattedSync}</time>
          </p>
        </div>
      </header>

      <div className="relative min-h-100">
        <AnimatePresence mode="wait">
          {users.length > 0 ? (
            viewMode === "grid" ? (
              <motion.ul
                key={`grid-${currentPage}`}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {users.map((user) => (
                  <UserStatusCard
                    key={user.user_id}
                    user={user}
                    onClick={(u) => setSelectedUser(u)}
                  />
                ))}
              </motion.ul>
            ) : (
              <motion.div
                key={`table-${currentPage}`}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-vgswhite rounded-lg shadow-xs border border-vgsgray/30 overflow-hidden"
              >
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <SortableHeader
                          label="User"
                          column="nombre"
                          currentSort={sorting}
                          onSort={onSort}
                          className="px-6 text-left"
                        />
                        <SortableHeader
                          label="Status"
                          column="estado"
                          currentSort={sorting}
                          onSort={onSort}
                        />
                        <SortableHeader
                          label="Last Activity"
                          column="last_update"
                          currentSort={sorting}
                          onSort={onSort}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.user_id}
                          onClick={() => setSelectedUser(user)}
                          className="hover:bg-vgsgray/5 cursor-pointer transition-colors border-b border-vgsgray/20 group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={api.getFileUrl(
                                  user.profile_picture,
                                  user.nombre,
                                )}
                                alt={user.nombre}
                                className="w-10 h-10 rounded-full border border-vgsgray/20 object-cover"
                              />
                              <span className="text-xs font-bold text-vgsblack capitalize group-hover:text-vgsred transition-colors">
                                {user.nombre}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="flex justify-center">
                              <StatusBadge status={user.current_status} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs text-vgsgray font-bold">
                              {user.last_update
                                ? new Date(user.last_update).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                                : "No activity"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-vgsblack bg-vgsgray/20 rounded-xl border-2 border-dashed"
            >
              <p className="font-medium">No users found.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserTimelineModal
            key="user-timeline"
            user={selectedUser}
            token={token}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
});

StatusGrid.displayName = "StatusGrid";
export default StatusGrid;