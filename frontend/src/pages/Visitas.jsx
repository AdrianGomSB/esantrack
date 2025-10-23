import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";

import { Document, Packer, Paragraph, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";
const UPLOADS_BASE = API_BASE.replace(/\/api\/?$/, "");
const buildFileUrl = (url) => {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  return `${UPLOADS_BASE}${url}`;
};

const Visitas = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};

  const [puntosRuta, setPuntosRuta] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

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

  // Cargar usuarios (si admin/supervisor)
  useEffect(() => {
    const cargarUsuarios = async () => {
      if (usuario.role === "admin" || usuario.role === "supervisor") {
        try {
          const token = localStorage.getItem("token");
          const { data } = await axios.get("/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsuarios(data);
        } catch (e) {
          console.error("Error al cargar usuarios:", e);
        }
      }
    };
    cargarUsuarios();
  }, []);

  // Cargar puntos de ruta
  const refetchPuntos = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/puntos_ruta", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPuntosRuta(data);
    } catch (error) {
      console.error("Error al obtener puntos de ruta:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    refetchPuntos();
  }, []);

  // Helpers UI
  const obtenerClaseEstado = (estado) => {
    switch ((estado || "").toLowerCase()) {
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

  // Filtro
  const filtrarDatos = () => {
    return puntosRuta.filter((p) => {
      const meta = p.metas_fichas ?? 0;
      const logradas = p.fichas_logradas ?? 0;
      const fechaRaw = p.fecha_visita || p.fecha || p.start;
      const fecha = fechaRaw ? new Date(fechaRaw) : null;

      return (
        (!filtroTipo || p.tipo === filtroTipo) &&
        (!filtroFechaInicio ||
          (fecha && fecha >= new Date(filtroFechaInicio))) &&
        (!filtroFechaFin || (fecha && fecha <= new Date(filtroFechaFin))) &&
        (!filtroNombre ||
          (p.nombre || "")
            .toLowerCase()
            .includes(filtroNombre.toLowerCase())) &&
        (!filtroMotivo ||
          (filtroMotivo === "Sin motivo" && !p.motivo_visita) ||
          p.motivo_visita === filtroMotivo) &&
        (!filtroProgreso ||
          (filtroProgreso === ">" && logradas > meta) ||
          (filtroProgreso === "<" && logradas < meta) ||
          (filtroProgreso === "=" && logradas === meta)) &&
        (!filtroEstado || p.estado === filtroEstado) &&
        (!filtroUsuario || String(p.user_id) === String(filtroUsuario)) &&
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

  const generarDocxParaFila = async (punto) => {
    try {
      const usuarioActual = JSON.parse(localStorage.getItem("usuario")) || {};
      const responsable =
        usuarioActual?.nombre ||
        usuarioActual?.username ||
        "__________________";
      const cliente = punto?.nombre || "__________________";
      const motivo = punto?.motivo_visita || "__________________";
      const direccion = punto?.direccion || "__________________";

      const fechaTexto = new Date().toLocaleDateString("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "ACTA DE VISITA",
                heading: "Heading1",
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: " " }),
              new Paragraph({ text: `Fecha: ${fechaTexto}` }),
              new Paragraph({ text: `Cliente/Institución: ${cliente}` }),
              new Paragraph({ text: `Motivo: ${motivo}` }),
              new Paragraph({
                text: `Dirección: ${direccion}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "La presente acta certifica que la visita se realizó conforme al plan establecido.",
                spacing: { after: 400 },
              }),
              new Paragraph({ text: " " }),
              new Paragraph({
                text: "Firma del responsable:",
                spacing: { before: 200 },
              }),
              new Paragraph({
                text: "_______________________________",
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                text: responsable,
                alignment: AlignmentType.CENTER,
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);

      const fechaISO = new Date().toISOString().slice(0, 10);
      const seguro = (s) =>
        (s || "")
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\-]+/g, "_");
      const filename = `Acta_Visita_${seguro(cliente)}_${fechaISO}.docx`;

      // Descarga local inmediata (no hay POST, no hay almacenamiento en servidor)
      saveAs(blob, filename);
    } catch (e) {
      console.error("No se pudo generar el documento:", e);
      alert("No se pudo generar el documento para esta visita.");
    }
  };

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeAdvertencia, setMensajeAdvertencia] = useState("");
  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  const abrirModal = (punto) => {
    setPuntoSeleccionado(punto);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
  };

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
          <option value="">-- Selecciona un motivo --</option>
          <option value="Presentación portafolio">
            Presentación portafolio
          </option>
          <option value="Requerimiento de capacitación">
            Requerimiento de capacitación
          </option>
          <option value="Reunión alineamiento">Reunión alineamiento</option>
          <option value="Inicio del programa">Inicio del programa</option>
          <option value="Cierre del programa">Cierre del programa</option>
          <option value="Sin motivo">Sin motivo</option>
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
              {[...new Set(usuarios.map((u) => u.equipo))]
                .filter(Boolean)
                .map((equipo) => (
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
                    {u.nombre ?? u.username}
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
                  {u.nombre ?? u.username}
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
                  {/* Nueva columna Acciones */}
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {datosPaginados.map((punto) => {
                  return (
                    <tr key={punto.id} className="hover:bg-gray-50">
                      <td>{punto.tipo || "-"}</td>
                      <td>{punto.nombre || "-"}</td>
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
                          {punto.estado || "-"}
                        </span>
                      </td>

                      {/* Acciones: según exista o no documento */}
                      <td className="whitespace-nowrap flex gap-2">
                        {/* Verificamos si el documento está subido y si el usuario es admin o supervisor */}
                        {punto.documento_url &&
                          (usuario.role === "admin" ||
                            usuario.role === "supervisor") && (
                            <>
                              <button
                                className="btn btn-xs btn-danger"
                                onClick={() => deleteDocument(punto)} // Aquí llamas a la función de eliminar el documento
                                title="Eliminar documento"
                              >
                                🗑️ Eliminar
                              </button>
                            </>
                          )}

                        {/* Si el documento no está subido, mostramos el botón para subir el archivo */}
                        {!punto.documento_url && (
                          <label
                            className="btn btn-xs btn-outline cursor-pointer"
                            title="Subir Word firmado"
                          >
                            ⬆️ Subir Word
                            <input
                              type="file"
                              accept=".docx"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append("archivo", file);
                                formData.append("punto_id", punto.id);

                                try {
                                  await axios.post(
                                    "/documentos/subir",
                                    formData,
                                    {
                                      headers: {
                                        "Content-Type": "multipart/form-data",
                                      },
                                    }
                                  );

                                  // Refrescar la lista de puntos para que se vea la opción de visualizar el documento
                                  await refetchPuntos();
                                  alert("Archivo subido correctamente.");
                                } catch (error) {
                                  console.error("Error al subir Word:", error);
                                  alert("No se pudo subir el archivo.");
                                } finally {
                                  e.target.value = ""; // Limpiar el input de archivo
                                }
                              }}
                            />
                          </label>
                        )}

                        {/* Mostrar el botón de visualizar solo si el documento está subido */}
                        {punto.documento_url && (
                          <a
                            className="btn btn-xs btn-success"
                            href={buildFileUrl(punto.documento_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Ver ${punto.documento_nombre || "Word"}`}
                          >
                            👁️ Visualizar Word
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {mostrarModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Advertencia</h2>
                <p>
                  Una vez subido el documento, no se podrá actualizar ni editar
                  el envío. En caso de un error, contacte con su supervisor para
                  gestionar el cambio.
                </p>
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={cerrarModal}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => setMostrarModal(false)}
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          )}
          {mensajeAdvertencia && (
            <div className="alert alert-warning mt-4">
              <strong>Advertencia:</strong> {mensajeAdvertencia}
            </div>
          )}

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
    </Layout>
  );
};

export default Visitas;
