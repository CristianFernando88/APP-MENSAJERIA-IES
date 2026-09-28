import Card from "../../components/ui/Card/Card";
import Badge from "../../components/ui/Badge/Badge";
import "./Canales.css";

const canales = [
    { id_canal: 1, nombre: "General", servidor_id: 1, categoria_id: 1 },
    { id_canal: 2, nombre: "Consultas", servidor_id: 1, categoria_id: 2 },
];

export default function Canales() {
    return (
    <section className="canales">
        <h1 className="canales__title">Canales</h1>
        <div className="canales__list">
        {canales.map((c) => (
            <Card key={c.id_canal} className="canales__item">
            <div>
                <p className="canales__item-name"># {c.nombre}</p>
                <Badge variant="default">Categoría {c.categoria_id}</Badge>
            </div>
            </Card>
        ))}
        </div>
    </section>
    );
}