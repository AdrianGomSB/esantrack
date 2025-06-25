import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";
import {
  User,
  Calendar,
  Map,
  FileText,
  Folder,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

// Constante global de bloques (mejor rendimiento)
const BLOQUES_INICIO = [
  {
    titulo: "Auditoría",
    ruta: "/auditoria",
    icono: <ShieldCheck className="h-6 w-6" />,
    roles: ["supervisor", "admin"],
  },
  {
    titulo: "Calendario",
    ruta: "/calendario",
    icono: <Calendar className="h-6 w-6" />,
    roles: ["user", "supervisor", "admin"],
  },
  {
    titulo: "Cartera",
    ruta: "/organizacion",
    icono: <Folder className="h-6 w-6" />,
    roles: ["user", "supervisor", "admin"],
  },
  {
    titulo: "Resumen",
    ruta: "/kpi",
    icono: <FileText className="h-6 w-6" />,
    roles: ["supervisor", "admin"],
  },
  {
    titulo: "Rutas",
    ruta: "/rutas",
    icono: <Map className="h-6 w-6" />,
    roles: ["user", "supervisor", "admin"],
  },
  {
    titulo: "Visitas",
    ruta: "/visitas",
    icono: <User className="h-6 w-6" />,
    roles: ["user", "supervisor", "admin"],
  },
];

// Componente separado para mostrar alerta de puntos de hoy

const AlertaPuntosHoy = ({ puntos }) => {
  const fechaHoy = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (puntos.length === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-md shadow mb-6">
        <p className="font-semibold">
          No tienes puntos de ruta programados para hoy ({fechaHoy}).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md shadow mb-6">
      <p className="font-semibold">
        Tienes {puntos.length} punto(s) de ruta programado(s) para hoy (
        {fechaHoy}).
      </p>
      <ul className="list-disc ml-5 mt-2 text-sm">
        {puntos.slice(0, 5).map((p) => (
          <li key={p.id}>
            <strong>{p.nombre || "Sin nombre"}</strong>
            {p.direccion ? ` en ${p.direccion}` : ""} (
            {p.hora_inicio || "--:--"} - {p.hora_fin || "--:--"})
          </li>
        ))}
      </ul>
      {puntos.length > 5 && (
        <Link
          to="/calendario"
          className="text-sm text-blue-600 underline mt-2 block"
        >
          Ver todos los puntos
        </Link>
      )}
    </div>
  );
};

const Inicio = () => {
  const [usuario] = useState(() => JSON.parse(localStorage.getItem("usuario")));
  const [puntosHoy, setPuntosHoy] = useState([]);

  useEffect(() => {
    const obtenerPuntosHoy = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("/puntos_ruta", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const hoy = new Date().toISOString().slice(0, 10);
        const puntos = Array.isArray(data) ? data : [];
        const puntosFiltrados = puntos.filter((p) => p.fecha?.startsWith(hoy));

        setPuntosHoy(puntosFiltrados);
      } catch (err) {
        console.error("Error al cargar puntos de hoy:", err);
        setPuntosHoy([]);
      }
    };

    obtenerPuntosHoy();
  }, []);

  return (
    <Layout titulo="Inicio">
      <h1 className="text-3xl font-bold mb-1">
        Hola, {usuario?.nombre || "Usuario"}
      </h1>
      <p className="text-gray-500 mb-1">Equipo: {usuario?.equipo || "N/A"}</p>
      <p className="text-gray-500 mb-6">Bienvenido al sistema de gestión</p>

      <AlertaPuntosHoy puntos={puntosHoy} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {BLOQUES_INICIO.filter((b) => b.roles.includes(usuario?.role)).map(
          (bloque, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={bloque.ruta}
                role="button"
                aria-label={`Ir a la sección de ${bloque.titulo}`}
                className="flex flex-col items-center justify-center space-y-2 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-100 hover:border-blue-500"
              >
                <div className="bg-blue-50 text-blue-600 rounded-full p-3">
                  {bloque.icono}
                </div>
                <h2 className="text-sm font-medium text-center text-gray-800 group-hover:text-blue-600">
                  {bloque.titulo}
                </h2>
              </Link>
            </motion.div>
          )
        )}
      </div>
    </Layout>
  );
};

export default Inicio;
