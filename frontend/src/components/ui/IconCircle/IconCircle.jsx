import "./IconCircle.css";

export default function IconCircle({ icon: Icon, size = 22 }) {
  return (
    <span className="icon-circle">
      <Icon size={size} />
    </span>
  );
}