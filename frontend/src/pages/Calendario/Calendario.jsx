import Card from "../../components/ui/Card/Card";
import { Calendar as CalendarIcon } from "lucide-react";
import "./Calendario.css";

const eventos = [
    { id: 1, fecha: "18 sep", titulo: "Entrega de tarea de Matemáticas" },
    { id: 2, fecha: "25 sep", titulo: "Acto escolar" },
    { id: 3, fecha: "30 sep", titulo: "Reunión de familias" },
];
export default function Calendario() {
    return (
    <section className="calendario">
        <h1 className="calendario__title">Calendario</h1>
        <div className="calendario__list">
        {eventos.map((e) => (
            <Card key={e.id} icon={CalendarIcon}><strong>{e.fecha}</strong> — {e.titulo}</Card>
        ))}
        </div>
    </section>
    );
}