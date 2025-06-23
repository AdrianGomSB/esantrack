import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";
import clsx from "clsx";

const Auditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;
  const [usuarios, setUsuarios] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroTabla, setFiltroTabla] = useState("");
  const [filtroEquipo, setFiltroEquipo] = useState("");

  const obtenerAuditoria = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/auditoria", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener auditoría:", err);
      setRegistros([]);
    }
  };

  const obtenerUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(data);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    }
  };

  useEffect(() => {
    obtenerAuditoria();
    obtenerUsuarios();
  }, []);

  const registrosFiltrados = registros.filter((log) => {
    const usuario = usuarios.find((u) => u.nombre === log.nombre);
    const coincideUsuario = filtroUsuario ? log.nombre === filtroUsuario : true;
    const coincideTabla = filtroTabla ? log.tabla === filtroTabla : true;
    const coincideEquipo = filtroEquipo
      ? usuario?.equipo === filtroEquipo
      : true;
    return coincideUsuario && coincideTabla && coincideEquipo;
  });

  const totalPaginas = Math.ceil(
    registrosFiltrados.length / registrosPorPagina
  );

  const registrosPagina = registrosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  const cambiarPagina = (nueva) => {
    if (nueva >= 1 && nueva <= totalPaginas) {
      setPaginaActual(nueva);
    }
  };

  const colores = {
    registro: "bg-green-50",
    actualización: "bg-yellow-50",
    eliminacion: "bg-red-50",
  };

  const iconos = {
    registro: { emoji: "🟢", tooltip: "Registro creado" },
    actualización: { emoji: "🟡", tooltip: "Campo actualizado" },
    eliminacion: { emoji: "🔴", tooltip: "Registro eliminado" },
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Auditoría</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          className="select select-bordered"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
        >
          <option value="">Todos los usuarios</option>
          {[...new Set(registros.map((r) => r.nombre))].map((nombre, i) => (
            <option key={i} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={filtroTabla}
          onChange={(e) => setFiltroTabla(e.target.value)}
        >
          <option value="">Todas las tablas</option>
          {[...new Set(registros.map((r) => r.tabla))].map((tabla, i) => (
            <option key={i} value={tabla}>
              {tabla}
            </option>
          ))}
        </select>

        <select
          className="select select-bordered"
          value={filtroEquipo}
          onChange={(e) => setFiltroEquipo(e.target.value)}
        >
          <option value="">Todos los equipos</option>
          {[...new Set(usuarios.map((u) => u.equipo))].map((equipo, i) => (
            <option key={i} value={equipo}>
              {equipo}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Tabla</th>
              <th className="px-4 py-2 text-left">Registro</th>
              <th className="px-4 py-2 text-left">Campo</th>
              <th className="px-4 py-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {registrosPagina.map((log) => {
              const tipo = log.campo?.toLowerCase();
              const color = colores[tipo] || "";
              const icono = iconos[tipo] || { emoji: "⚪", tooltip: log.campo };

              return (
                <tr key={log.id} className={clsx(color, "hover:bg-gray-100")}>
                  <td className="px-4 py-2">{log.nombre}</td>
                  <td className="px-4 py-2">{log.tabla}</td>
                  <td className="px-4 py-2">{log.registro_id}</td>
                  <td
                    className="px-4 py-2 whitespace-nowrap"
                    title={`Antes: ${log.valor_anterior || "-"}\nAhora: ${
                      log.valor_nuevo || "-"
                    }`}
                  >
                    {icono.emoji} {log.campo}
                  </td>

                  <td className="px-4 py-2">
                    {new Intl.DateTimeFormat("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }).format(new Date(log.fecha))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>
        <span className="text-sm">
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => cambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
        >
          Siguiente
        </button>
      </div>
    </Layout>
  );
};

export default Auditoria;
