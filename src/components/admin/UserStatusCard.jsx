// src/components/admin/UserStatusCard.jsx
import React, { memo } from "react";
import { motion } from "framer-motion";
import Card from "../common/Card";
import StatusBadge from "../common/StatusBadge";
import Image from "../common/Image";
import api from "../../services/api";
import { gridItemVariants } from "../common/animations";

const UserStatusCard = memo(({ user, onClick }) => {
  const formattedActivity = user.last_update
    ? new Date(user.last_update).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <motion.li
      variants={gridItemVariants}
      onClick={() => onClick(user)}
      className="cursor-pointer group list-none h-full"
    >
      <Card className="transition-all transform hover:-translate-y-1 h-full">
        <article className="flex flex-col h-full justify-center">
          <header className="flex justify-between items-start">
            <div className="flex items-center gap-3 w-full">
              <Image
                src={api.getFileUrl(user.profile_picture, user.nombre)}
                alt={`Avatar de ${user.nombre}`}
                className="w-12 h-12 rounded-full border-2 border-vgsgray/30 shadow-sm object-cover group-hover:border-vgsred transition-colors"
              />
              <div>
                <p className="font-bold text-vgsblack leading-none text-wrap capitalize group-hover:text-vgsred transition-colors">
                  {user.nombre}
                </p>
                {formattedActivity && (
                  <p className="text-[10px] text-vgsgray font-medium">
                    Last activity: <time>{formattedActivity}</time>
                  </p>
                )}
              </div>
              <StatusBadge status={user.current_status} className="ml-auto" />
            </div>
          </header>
        </article>
      </Card>
    </motion.li>
  );
});

UserStatusCard.displayName = "UserStatusCard";

export default UserStatusCard;
