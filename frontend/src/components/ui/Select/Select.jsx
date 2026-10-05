import "./Select.css";

export default function Select({ label, name, value, onChange, options, placeholder = "Seleccionar..." }) {
  return (
    <div className="select">
      {label && <label className="select__label" htmlFor={name}>{label}</label>}
      <select id={name} name={name} value={value} onChange={onChange} className="select__field">
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}