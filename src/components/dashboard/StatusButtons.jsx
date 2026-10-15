// components/dashboard/StatusButtons.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { STATUS_CONFIG } from "../layout/statusConfig";
import Button from "../common/Button";

const StatusButtons = ({ currentStatus, onStatusChange, loading }) => {
  return (
    <div className="p-1">
      <h3 className="text-sm font-bold text-vgsdarkblue uppercase tracking-widest mb-4">
        Select New Status
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(STATUS_CONFIG).map(([id, config]) => {
          if (id === "default" || id === "offline") return null;

          const isActive = currentStatus === id;

          return (
            <Button
              key={id}
              onClick={() => onStatusChange(id)}
              disabled={loading || isActive}
              variant={isActive ? "blue" : "gray"}
              className={`
                relative flex items-center justify-start px-4 py-3 transition-all duration-200 group
                ${isActive ? "ring-2 ring-vgsdarkblue ring-offset-2 text-vgswhite" : ""}
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              animation={isActive ? null : "shrink"}
            >
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center mr-3
                ${isActive ? "bg-vgswhite/20" : config.classes}
              `}
              >
                <FontAwesomeIcon icon={config.icon} className="text-xs" />
              </div>

              <div className="flex flex-col items-start">
                <span
                  className={`text-sm font-bold ${isActive ? "" : "text-vgsblack"}`}
                >
                  {config.label}
                </span>
                {isActive && (
                  <span className="text-xs text-vgswhite/70 font-medium">
                    Current Status
                  </span>
                )}
              </div>
            </Button>
          );
        })}
      </div>
      <p className=" text-md font-bold text-vgsblack mt-10 text-center border-t border-dashed pt-3 border-vgsblack">
        Looking to go offline? Simply Log Out to end your session
      </p>
    </div>
  );
};

export default StatusButtons;
