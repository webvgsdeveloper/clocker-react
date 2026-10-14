// src/components/layout/statusConfig.js
import {
  faLaptop,
  faMugSaucer,
  faPersonRunning,
  faPlugCircleXmark,
  faQuestionCircle,
  faVideo,
  faArrowsDownToPeople,
  faDumbbell,
  faUserSlash,
} from "@fortawesome/free-solid-svg-icons";

export const STATUS_CONFIG = {
  online: {
    classes: "bg-green-500 text-vgswhite border-green-600",
    label: "Online",
    icon: faLaptop,
    description: "You are available and active.",
  },
  break: {
    classes: "bg-yellow-500 text-vgswhite border-yellow-600",
    label: "Break",
    icon: faMugSaucer,
    description: "You are on a short break.",
  },
  lunch: {
    classes: "bg-orange-500 text-vgswhite border-orange-600",
    label: "Lunch",
    icon: faMugSaucer,
    description: "You are on your lunch break.",
  },
  brb: {
    classes: "bg-purple-500 text-vgswhite border-purple-600",
    label: "BRB",
    icon: faPersonRunning,
    description: "You will be back soon.",
  },
  /*bathroom: {
    classes: "bg-indigo-400 text-white border-indigo-500",
    label: "Bathroom",
    icon: faToilet,
    description: "You are in the bathroom.",
  },*/
  rec: {
    classes: "bg-vgsred text-vgswhite border-vgsred",
    label: "Recording",
    icon: faVideo,
    description: "You are recording content.",
  },
  coaching: {
    classes: "bg-pink-500 text-vgswhite border-pink-600",
    label: "Coaching",
    icon: faDumbbell,
    description: "You are in a coaching session.",
  },
  team_meeting: {
    classes: "bg-cyan-600 text-vgswhite border-cyan-700",
    label: "Meeting",
    icon: faArrowsDownToPeople,
    description: "You are in a team meeting.",
  },
  offline: {
    classes: "bg-vgsgray text-vgswhite border-vgsgray",
    label: "Offline",
    icon: faPlugCircleXmark,
    description: "You are disconnected.",
  },
  away: {
    classes: "bg-vgsblack text-vgswhite border-vgsblack",
    label: "Away",
    icon: faUserSlash,
    description: "You are away from your desk.",
  },
  default: {
    classes: "bg-blue-500 text-vgswhite border-blue-600",
    label: "Disconnected",
    icon: faQuestionCircle,
    description: "Status not recognized.",
  },
};
