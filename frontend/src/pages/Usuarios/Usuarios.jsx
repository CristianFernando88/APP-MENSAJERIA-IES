import Card from "../../components/ui/Card/Card";
import Badge from "../../components/ui/Badge/Badge";
import "./Usuarios.css";

const usuarios = [
    { id: 1, nombre: "Roberto Pérez", email: "roberto.perez@email.com", activo: true },
    { id: 2, nombre: "María Gómez", email: "maria.gomez@email.com", activo: false },
];

export default function Usuarios() {
    return (
    <section className="usuarios">
        <h1 className="usuarios__title">Usuarios</h1>
        <Card padding="sm">
        <ul className="usuarios__list">
            {usuarios.map((u) => (
            <li key={u.id} className="usuarios__item">
                <div>
                <span className="usuarios__name">{u.nombre}</span>
                <span className="usuarios__email">{u.email}</span>
                </div>
                <Badge variant={u.activo ? "success" : "danger"}>
                {u.activo ? "Activo" : "Inactivo"}
                </Badge>
            </li>
            ))}
        </ul>
        </Card>
    </section>
    );
}