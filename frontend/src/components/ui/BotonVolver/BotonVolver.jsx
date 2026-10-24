import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./BotonVolver.css";

export default function BotonVolver({ to = "/", label = "Volver" }) {
    const navigate = useNavigate();

    return (
    <button type="button" className="boton-volver" onClick={() => navigate(to)} aria-label={label}>
        <ArrowLeft size={16} />
        <span>{label}</span>
    </button>
    );
}