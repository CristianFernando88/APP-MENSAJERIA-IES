import { ChevronRight } from "lucide-react";
import IconCircle from "../IconCircle/IconCircle";
import "./Card.css";

export default function Card({
  children,
  padding = "md",
  className = "",
  icon,
  chevron = false,
  onClick,
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`card card--padding-${padding} ${isClickable ? "card--clickable" : ""} ${className}`.trim()}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {icon && <IconCircle icon={icon} />}
      <div className="card__content">{children}</div>
      {chevron && <ChevronRight className="card__chevron" size={22} />}
    </div>
  ); 
}