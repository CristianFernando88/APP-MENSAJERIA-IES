import "./Input.css";

export default function Input({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
  error = "",
}) {
  return (
    <div className="input">
      {label && <label className="input__label" htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input__field${error ? " input__field--error" : ""}`}
      />
      {error && <span className="input__error">{error}</span>}
    </div>
  );
}