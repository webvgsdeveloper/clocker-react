import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons"; // Icono por defecto

const List = ({
  title,
  titleIcon,
  items = [],
  children,
  icon = faCircle,
  colorScheme = "red",
  containerClassName = "",
  titleClassName = "",
  listClassName = "",
  itemClassName = "",
  iconClassName = "",
}) => {
  const defaultColors = {
    red: {
      title: "text-vgsred",
      list: "text-vgsblack",
      icon: "text-vgsred",
    },
    black: {
      title: "text-vgsdarkblue",
      list: "text-vgsblack",
      icon: "text-vgsdarkblue",
    },
  };

  const colors = defaultColors[colorScheme] || defaultColors.blue;

  return (
    <div className={`flex flex-col ${containerClassName}`}>
      {title && (
        <h4
          className={`font-semibold mb-2 flex items-center gap-2 ${colors.title} ${titleClassName}`}
        >
          {titleIcon && <FontAwesomeIcon icon={titleIcon} />}
          <span>{title}</span>
        </h4>
      )}

      {/* Lista */}
      <ul className={`text-sm space-y-1 ${colors.list} ${listClassName}`}>
        {/* Renderizado por Array (si existe) */}
        {items.length > 0
          ? items.map((item, index) => (
              <li
                key={index}
                className={`flex items-start gap-2 ${itemClassName}`}
              >
                {icon && (
                  <FontAwesomeIcon
                    icon={icon}
                    className={`mt-1 shrink-0 text-[10px] ${colors.icon} ${iconClassName}`}
                  />
                )}
                <span className="font-medium">{item}</span>
              </li>
            ))
          : children}
      </ul>
    </div>
  );
};

export default List;
