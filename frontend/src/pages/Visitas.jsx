import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";

const Visitas = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};

  const [puntosRuta, setPuntosRuta] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  const [mostrarJustificacion, setMostrarJustificacion] = useState(false);
  const [justificacionActual, setJustificacionActual] = useState("");
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [filtroProgreso, setFiltroProgreso] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroEquipo, setFiltroEquipo] = useState("");

  useEffect(() => {
    const cargarUsuarios = async () => {
      if (usuario.role === "admin" || usuario.role === "supervisor") {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsuarios(data);
      }
    };
    cargarUsuarios();
  }, []);

  useEffect(() => {
    const obtenerPuntosRuta = async () => {
      try {
        setCargando(true);
        const token = localStorage.getItem("token");
        const { data } = await axios.get("/puntos_ruta", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPuntosRuta(data);
      } catch (error) {
        console.error("Error al obtener puntos de ruta:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerPuntosRuta();
  }, []);

  const guardarJustificacion = async () => {
    try {
      await axios.put(`/puntos_ruta/${puntoSeleccionado.id}`, {
        justificacion: justificacionActual,
      });

      setMostrarJustificacion(false);
      setJustificacionActual("");
      setPuntoSeleccionado(null);

      const token = localStorage.getItem("token");
      const { data } = await axios.get("/puntos_ruta", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPuntosRuta(data);
    } catch (error) {
      console.error("Error al guardar justificación:", error);
    }
  };

  const obtenerClaseEstado = (estado) => {
    switch (estado.toLowerCase()) {
      case "completado":
        return "badge-success";
      case "pendiente":
        return "badge-warning";
      case "cancelado":
        return "badge-error";
      case "reprogramado":
        return "badge-info";
      default:
        return "badge-neutral";
    }
  };

  const obtenerClaseProgreso = (logradas, meta) => {
    if (logradas > meta) return "bg-green-500 text-white";
    if (logradas < meta) return "bg-red-500 text-white";
    return "bg-yellow-500 text-black";
  };

  const filtrarDatos = () => {
    return puntosRuta.filter((p) => {
      const meta = p.metas_fichas ?? 0;
      const logradas = p.fichas_logradas ?? 0;
      const fecha = new Date(p.fecha_visita);

      return (
        (!filtroTipo || p.tipo === filtroTipo) &&
        (!filtroFechaInicio || fecha >= new Date(filtroFechaInicio)) &&
        (!filtroFechaFin || fecha <= new Date(filtroFechaFin)) &&
        (!filtroNombre ||
          p.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())) &&
        (!filtroMotivo ||
          (filtroMotivo === "Sin motivo" && !p.motivo_visita) ||
          p.motivo_visita === filtroMotivo) &&
        (!filtroProgreso ||
          (filtroProgreso === ">" && logradas > meta) ||
          (filtroProgreso === "<" && logradas < meta) ||
          (filtroProgreso === "=" && logradas === meta)) &&
        (!filtroEstado || p.estado === filtroEstado) &&
        (!filtroUsuario || p.user_id === parseInt(filtroUsuario)) &&
        (!filtroEquipo || p.equipo === filtroEquipo)
      );
    });
  };

  const datosFiltrados = filtrarDatos();
  const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina);
  const datosPaginados = datosFiltrados.slice(
    (paginaActual - 1) * filasPorPagina,
    paginaActual * filasPorPagina
  );

  return (
    <Layout titulo="Visitas">
      <h1 className="text-2xl font-bold mb-4">Visitas</h1>
      {/* Filtros */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm items-end">
        <select
          className="select select-bordered"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="Empresas">Empresas</option>
          <option value="Ferias">Ferias</option>
          <option value="Charlas">Charlas</option>
          <option value="Institutos">Institutos</option>
          <option value="Activaciones">Activaciones</option>
        </select>

        <input
          type="text"
          className="input input-bordered"
          placeholder="Buscar por nombre"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />

        <select
          className="select select-bordered"
          value={filtroMotivo}
          onChange={(e) => setFiltroMotivo(e.target.value)}
        >
          <option value="">Todos los motivos</option>
          <option value="Visita">Visita</option>
          <option value="Charla">Charla</option>
          <option value="Sin motivo">Sin motivo</option>
        </select>

        <select
          className="select select-bordered"
          value={filtroProgreso}
          onChange={(e) => setFiltroProgreso(e.target.value)}
        >
          <option value="">Todos los progresos</option>
          <option value=">">Logro mayor que meta</option>
          <option value="<">Logro menor que meta</option>
          <option value="=">Logro igual a meta</option>
        </select>

        {usuario.role?.toLowerCase() === "admin" && (
          <>
            <select
              className="select select-bordered"
              value={filtroEquipo}
              onChange={(e) => {
                setFiltroEquipo(e.target.value);
                setFiltroUsuario("");
              }}
            >
              <option value="">Todos los equipos</option>
              {[...new Set(usuarios.map((u) => u.equipo))].map((equipo) => (
                <option key={equipo} value={equipo}>
                  {equipo}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              disabled={!filtroEquipo}
            >
              <option value="">Todos los usuarios del equipo</option>
              {usuarios
                .filter((u) => !filtroEquipo || u.equipo === filtroEquipo)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
            </select>
          </>
        )}

        {usuario.role?.toLowerCase() === "supervisor" && (
          <select
            className="select select-bordered"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          >
            <option value="">Todos los usuarios de mi equipo</option>
            {usuarios
              .filter((u) => u.equipo === usuario.equipo)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
          </select>
        )}

        <input
          type="date"
          className="input input-bordered"
          value={filtroFechaInicio}
          onChange={(e) => setFiltroFechaInicio(e.target.value)}
        />
        <input
          type="date"
          className="input input-bordered"
          value={filtroFechaFin}
          onChange={(e) => setFiltroFechaFin(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            setFiltroTipo("");
            setFiltroNombre("");
            setFiltroMotivo("");
            setFiltroProgreso("");
            setFiltroFechaInicio("");
            setFiltroFechaFin("");
            setFiltroEstado("");
            setFiltroUsuario("");
            setFiltroEquipo("");
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {cargando ? (
        <p>Cargando puntos de ruta...</p>
      ) : datosFiltrados.length === 0 ? (
        <p>No hay puntos que coincidan con los filtros.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {datosPaginados.map((punto) => {
                  const meta = punto.metas_fichas ?? 0;
                  const logradas = punto.fichas_logradas ?? 0;
                  const fichaClass = obtenerClaseProgreso(logradas, meta);

                  return (
                    <tr key={punto.id} className="hover:bg-gray-50">
                      <td>{punto.tipo}</td>
                      <td>{punto.nombre}</td>

                      <td
                        className={
                          punto.motivo_visita ? "" : "italic text-gray-500"
                        }
                      >
                        {punto.motivo_visita || "Sin motivo"}
                      </td>
                      <td>
                        <span
                          className={`badge ${obtenerClaseEstado(
                            punto.estado
                          )} capitalize`}
                        >
                          {punto.estado}
                        </span>
                      </td>
                      {/* <td>
                        <span className={`badge ${fichaClass}`}>
                          {`${logradas} / ${meta}`}
                        </span>
                      </td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mt-4 gap-2">
            <button
              className="btn btn-sm"
              onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
            >
              ← Anterior
            </button>
            <span className="px-2 py-1 text-sm font-medium">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              className="btn btn-sm"
              onClick={() =>
                setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
              }
              disabled={paginaActual === totalPaginas}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
      {mostrarJustificacion && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-center">
              Justificación del punto
            </h2>

            <textarea
              className="w-full h-32 border rounded px-3 py-2 mb-4"
              value={justificacionActual}
              onChange={(e) => setJustificacionActual(e.target.value)}
              placeholder="Escribe aquí la justificación..."
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMostrarJustificacion(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={guardarJustificacion}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Visitas;
