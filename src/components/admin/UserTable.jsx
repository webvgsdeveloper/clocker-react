// src/components/admin/UserTable.jsx
import React, { memo, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../common/Button";
import Badge from "../common/Badge";
import ConfirmationBox from "../common/ConfirmationBox";
import { useAuth } from "../../contexts/AuthContext";
import { tableRowVariants } from "../common/animations/lists";
import {
  faEdit,
  faTrash,
  faExclamationTriangle,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Headers
const SortableHeader = ({ 
  label, 
  column, 
  currentSort, 
  onSort,
  className = ""
}) => {
  const isActive = currentSort.sortBy === column;
  const isAsc = currentSort.sortOrder === "ASC";

  return (
    <th
      scope="col"
      className={`w-100 py-4 bg-vgsred text-vgswhite cursor-pointer group select-none transition-colors hover:bg-vgsred/80 ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex justify-center items-center gap-2">
        <span className="uppercase tracking-wider text-[11px] font-bold group-hover:underline">
          {label}
        </span>

        <motion.div
          animate={{ 
            opacity: isActive ? 1 : 0.4, 
            scale: isActive ? 1.1 : 1 
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

const UserRow = memo(
  forwardRef(({ user, canEdit, canDelete, onDelete, onEdit }, ref) => {
    return (
      <motion.tr
        ref={ref}
        variants={tableRowVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="hover:bg-vgsgray/10 transition-colors border-b border-vgsgray/50 bg-vgswhite"
      >
        <td className="text-sm text-vgsblack px-6 py-4 font-mono">{user.cedula}</td>
        <td className="text-sm text-vgsblack font-medium capitalize px-6 py-4">
          {user.nombre}
        </td>
        <td className="text-center px-4 py-4">
          <Badge variant="gray" size="sm">
            {user.rol}
          </Badge>
        </td>
        <td className="text-center px-4 py-4">
          <Badge
            variant={user.is_active ? "red" : "gray"}
            size="sm"
            className="italic"
          >
            {user.is_active ? "Active" : "Inactive"}
          </Badge>
        </td>
        <td className="text-center px-6 py-4 whitespace-nowrap">
          <div className="flex justify-center gap-2">
            {canDelete && (
              <Button
                onClick={() => onDelete(user)}
                icon={faTrash}
                title="Delete user"
                variant="red"
                animation="grow"
                className="text-xs py-1"
              />
            )}
            {canEdit && (
              <Button
                onClick={() => onEdit(user)}
                icon={faEdit}
                title="Edit user"
                variant="blue"
                animation="grow"
                className="text-xs py-1"
              />
            )}
            {!canDelete && !canEdit && (
              <span className="text-[10px] text-vgsgray italic">
                No permissions
              </span>
            )}
          </div>
        </td>
      </motion.tr>
    );
  }),
);

UserRow.displayName = "UserRow";

const UserTable = memo(({ users, onDelete, onEdit, sorting, onSort }) => {
  const { can } = useAuth();
  const canEdit = can("Edit Users");
  const canDelete = can("Delete users");
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    user: null,
  });

  const handleDeleteClick = (user) => {
    setConfirmConfig({
      isOpen: true,
      user: user,
    });
  };

  const handleConfirmDelete = () => {
    const userId = confirmConfig.user.user_id || confirmConfig.user.ROWID;
    onDelete(userId);
    setConfirmConfig({ isOpen: false, user: null });
  };

  return (
    <div className="overflow-x-auto md:scrollbar-none shadow-sm rounded-lg border border-vgsgray/30 bg-vgswhite">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className=" text-vgswhite">
            <SortableHeader 
              label="Identification" 
              column="cedula" 
              currentSort={sorting} 
              onSort={onSort} 
            />
            <SortableHeader 
              label="Full Name" 
              column="nombre" 
              currentSort={sorting} 
              onSort={onSort} 
            />
            <SortableHeader 
              label="Role" 
              column="rol" 
              currentSort={sorting} 
              onSort={onSort}
            />
            <SortableHeader 
              label="Status" 
              column="is_active" 
              currentSort={sorting} 
              onSort={onSort}
            />
            <th scope="col" className="w-5 bg-vgsred text-center uppercase tracking-wider text-[11px] font-bold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-vgsgray/50">
          <AnimatePresence initial={false} mode="sync">
            {users.length > 0 ? (
              users.map((user) => (
                <UserRow
                  key={user.user_id || user.ROWID}
                  user={user}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onDelete={handleDeleteClick}
                  onEdit={onEdit}
                />
              ))
            ) : (
              <motion.tr
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-vgswhite"
              >
                <td
                  colSpan="5"
                  className="py-10 text-center text-vgsgray text-sm italic"
                >
                  No users available to display.
                </td>
              </motion.tr>
            )}
          </AnimatePresence>
        </tbody>
      </table>

      <ConfirmationBox
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        description={
          <>
            Are you sure you want to delete {confirmConfig.user?.nombre}?
            <br />
            This action cannot be undone.
          </>
        }
        confirmText="Delete User"
        variant="rec"
        icon={faExclamationTriangle}
      />
    </div>
  );
});

UserTable.displayName = "UserTable";

export default UserTable;