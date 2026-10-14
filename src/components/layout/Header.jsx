// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  faRightFromBracket,
  faPeopleGroup,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../common/Button";
import Image from "../common/Image";
import { useAuth } from "../../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import { useNotification } from "../../contexts/NotificationContext";
import EditProfileModal from "../profile/EditProfileModal";
import api from "../../services/api";
import Badge from "../common/Badge";
import Pin from "../common/Pin";

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scaleY: 0.9,
    transformOrigin: "top",
  },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scaleY: 0.9,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

const Header = ({ title }) => {
  const { user, activeGroup, logout, updateUser, switchGroup } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateProfile = async (formData) => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.updateProfile(token, formData);

      if (res.success) {
        updateUser({
          nombre: res.data.nombre,
          profile_picture: res.data.profile_picture || user.profile_picture,
        });
        setIsModalOpen(false);
        addNotification(
          "Clocker IA",
          "Profile updated successfully",
          "success",
          true,
          true,
        );
      } else {
        addNotification("Clocker IA", "Error", "error", true, true);
      }
    } catch (err) {
      console.error(err);
      addNotification(
        "Clocker IA",
        "Error updating profile",
        "error",
        true,
        true,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <header className="bg-vgswhite sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center gap-4">
          <section
            className="flex items-center shrink-0"
            aria-label="Brand"
          >
            <div className="flex items-center gap-4">
              <Image
                src="images/logo.svg"
                alt="Clocker Logo"
                className="w-16 sm:w-20 h-auto"
              />
              <div
                className="h-8 w-px bg-vgsgray/40 hidden sm:block"
                aria-hidden="true"
              ></div>
              <h1 className="text-xs text-vgsred font-bold uppercase tracking-wider hidden md:block xs:block">
                {title}
              </h1>
            </div>
          </section>
          <nav
            className="flex items-center gap-2 sm:gap-4 md:gap-6"
            aria-label="User Navigation"
          >
            {user?.workgroups?.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                  variant="red"
                  animation="translate"
                  icon={faPeopleGroup}
                  className="text-sm shadow-sm"
                  aria-expanded={isGroupDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="hidden lg:inline mr-1">Workgroup - </span>
                  {activeGroup?.name || "Select Group"}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`ml-2 transition-transform duration-200 ${isGroupDropdownOpen ? "rotate-180" : ""}`}
                  />
                </Button>

                <AnimatePresence>
                  {isGroupDropdownOpen && (
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-64 bg-vgswhite rounded-lg border border-vgsgray/30 z-50 shadow-xl overflow-hidden origin-top"
                    >
                      <header className="px-4 py-2 bg-vgsgray rounded-t-lg">
                        <p className="text-[10px] font-bold text-vgswhite text-center uppercase tracking-[0.2em]">
                          Your Workspaces
                        </p>
                      </header>

                      <ul className="max-h-60 overflow-y-auto" role="listbox">
                        {user.workgroups.map((group) => (
                          <li key={group.id}>
                            <Button
                              onClick={() => {
                                switchGroup(group.id);
                                setIsGroupDropdownOpen(false);
                              }}
                              className="w-full transition-all duration-200 rounded-none border-none justify-start"
                              variant={
                                activeGroup?.id === group.id
                                  ? "transparent"
                                  : "gray"
                              }
                              role="option"
                              aria-selected={activeGroup?.id === group.id}
                            >
                              <Badge
                                variant="none"
                                size="md"
                                className={`text-xs relative w-full text-left ${
                                  activeGroup?.id === group.id
                                    ? "text-vgsred"
                                    : "text-vgsgray"
                                } font-medium capitalize`}
                              >
                                {activeGroup?.id === group.id && (
                                  <Pin
                                    color="red"
                                    size="xs"
                                    position="top-right"
                                    ping={true}
                                  />
                                )}
                                <span className="truncate block">
                                  {group.name}{" "}
                                  <span className="opacity-60">
                                    - {group.role}
                                  </span>
                                </span>
                              </Badge>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Separator />
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="transparent"
              className="p-1 group"
              animation="shrink"
              aria-label="View or edit profile"
            >
              <figure className="relative w-10 h-10">
                <Image
                  src={api.getFileUrl(user?.profile_picture)}
                  alt={`Profile of ${user?.nombre}`}
                  className="w-full h-full rounded-full object-cover border-2 border-vgsgray/30 group-hover:border-vgsred transition-colors"
                />
              </figure>
              <div className="text-left hidden md:block">
                <p className="text-[10px] text-vgsgray group-hover:text-vgsred transition-colors font-medium uppercase tracking-tighter">
                  My Account
                </p>
                <p className="text-sm font-bold text-vgsblack leading-tight group-hover:text-vgsred group-hover:underline transition-colors capitalize">
                  {user?.nombre}
                </p>
              </div>
            </Button>

            <Separator />

            <div className="flex items-center gap-2">
              <Button
                onClick={logout}
                variant="gray"
                title="Log Out"
                icon={faRightFromBracket}
                className="hover:text-vgsred"
                animation="grow"
              >
                <span className="hidden sm:inline">Log Out</span>
              </Button>

              <NotificationBell />
            </div>
          </nav>
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <EditProfileModal
            key="profile-modal"
            user={user}
            onClose={() => setIsModalOpen(false)}
            onUpdate={handleUpdateProfile}
            isUploading={isUploading}
          />
        )}
      </AnimatePresence>
    </header>
  );
};

const Separator = () => (
  <div
    className="h-8 w-px bg-vgsgray/30 hidden sm:block"
    aria-hidden="true"
  />
);

export default Header;
