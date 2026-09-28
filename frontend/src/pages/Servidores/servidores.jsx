import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card/Card";
import Button from "../../components/ui/Button/Button";
import "./Servidores.css";

const servidores = [
    { id_servidor: 1, nombre: "IES Belgrano", descripcion: "Espacio institucional del instituto", fecha_creacion: "2026-03-01", creador_id: 1 },
];

export default function Servidores() {
    const navigate = useNavigate();

    return (
    <section className="servidores">
        <h1 className="servidores__title">Servidores</h1>
        <div className="servidores__list">
        {servidores.map((s) => (
            <Card key={s.id_servidor} className="servidores__item">
            <p className="servidores__item-name">{s.nombre}</p>
            <p className="servidores__item-desc">{s.descripcion}</p>
            <p className="servidores__item-meta">Creado el {s.fecha_creacion}</p>
            <div className="servidores__item-actions">
                <Button size="sm" onClick={() => navigate("/canales")}>Ver canales</Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/miembros")}>Ver miembros</Button>
            </div>
            </Card>
        ))}
        </div>
    </section>
    );
}