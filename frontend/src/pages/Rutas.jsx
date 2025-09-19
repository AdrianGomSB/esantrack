import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import Layout from "../components/Layout";
import { Marker, Polyline } from "@react-google-maps/api";
import GoogleMapComponent from "../components/GoogleMapComponent";

const Rutas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroEquipo, setFiltroEquipo] = useState("");
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [empresaInput, setEmpresaInput] = useState("");
  const [nuevoPunto, setNuevoPunto] = useState({
    direccion: "",
    hora_inicio: "08:00",
    hora_fin: "09:00",
    motivo_visita: "",
  });

  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [puntosRuta, setPuntosRuta] = useState([]);
  const [mostrarModalCrearPuntos, setMostrarModalCrearPuntos] = useState(false);
  const [mostrarModalEditarPuntos, setMostrarModalEditarPuntos] =
    useState(false);
  const [rutaSeleccionadaParaPuntos, setRutaSeleccionadaParaPuntos] =
    useState(null);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState({
    id: null,
    latitud: "",
    longitud: "",
    estado: "",
    orden: "",
    direccion: "",
    tipo: "",
    nombre: "",
    fichas_logradas: "",
  });

  const [direccionSeleccionada, setDireccionSeleccionada] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  const [filtroTitulo, setFiltroTitulo] = useState("");
  const [filtroEvento, setFiltroEvento] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [filtroProgreso, setFiltroProgreso] = useState("");
  const [filtroConPuntos, setFiltroConPuntos] = useState("");

  const obtenerRutas = async () => {
    setCargando(true);
    try {
      const res = await axios.get("/rutas", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const rutasProcesadas = res.data.map((ruta) => ({
        ...ruta,
        puntos:
          ruta.puntos?.map((p) => ({
            ...p,
            latitud: parseFloat(p.latitud),
            longitud: parseFloat(p.longitud),
          })) || [],
      }));

      setRutas(rutasProcesadas);
    } catch (error) {
      console.error("Error al obtener rutas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerRutas();

    if (usuario?.role === "admin" || usuario?.role === "supervisor") {
      const obtenerUsuarios = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsuarios(res.data);
        } catch (err) {
          console.error("Error al cargar usuarios:", err);
        }
      };

      obtenerUsuarios();
    }
  }, []);

  const rutasFiltradas = rutas.filter((ruta) => {
    const fechaRuta = ruta.fecha ? new Date(ruta.fecha) : null;
    const completados =
      ruta.puntos?.filter((p) => p.estado?.toLowerCase() === "completado")
        .length || 0;
    const total = ruta.puntos?.length || 0;

    return (
      (!filtroTitulo ||
        ruta.titulo.toLowerCase().includes(filtroTitulo.toLowerCase())) &&
      (!filtroEvento ||
        ruta.evento_titulo
          ?.toLowerCase()
          .includes(filtroEvento.toLowerCase())) &&
      (!filtroFechaInicio ||
        (fechaRuta && fechaRuta >= new Date(filtroFechaInicio))) &&
      (!filtroFechaFin ||
        (fechaRuta && fechaRuta <= new Date(filtroFechaFin))) &&
      (!filtroProgreso ||
        (filtroProgreso === "completo" && total > 0 && completados === total) ||
        (filtroProgreso === "incompleto" &&
          total > 0 &&
          completados < total)) &&
      (!filtroConPuntos ||
        (filtroConPuntos === "con" && total > 0) ||
        (filtroConPuntos === "sin" && total === 0)) &&
      (!filtroUsuario ||
        String(ruta.usuario_id) === filtroUsuario ||
        ruta.puntos?.some((p) => String(p.user_id) === filtroUsuario)) &&
      (!filtroEquipo ||
        ruta.puntos?.some((p) => {
          const u = usuarios.find((u) => u.id === p.user_id);
          return u?.equipo === filtroEquipo;
        }))
    );
  });

  const totalPaginas = Math.ceil(rutasFiltradas.length / filasPorPagina);
  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const rutasPaginadas = rutasFiltradas.slice(inicio, fin);

  return (
    <Layout titulo="Gestión de Rutas">
      <h1 className="text-xl font-bold mb-4">Rutas Registradas</h1>
      {cargando ? (
        <p>Cargando rutas...</p>
      ) : rutas.length === 0 ? (
        <p>No hay rutas registradas.</p>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              className="input input-bordered"
              placeholder="Buscar por título"
              value={filtroTitulo}
              onChange={(e) => setFiltroTitulo(e.target.value)}
            />
            <input
              type="text"
              className="input input-bordered"
              placeholder="Buscar por evento"
              value={filtroEvento}
              onChange={(e) => setFiltroEvento(e.target.value)}
            />
            <select
              className="select select-bordered"
              value={filtroProgreso}
              onChange={(e) => setFiltroProgreso(e.target.value)}
            >
              <option value="">Todos los progresos</option>
              <option value="completo">Completos</option>
              <option value="incompleto">Incompletos</option>
            </select>

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
            {usuario?.role === "admin" && (
              <select
                className="select select-bordered"
                value={filtroEquipo}
                onChange={(e) => {
                  setFiltroEquipo(e.target.value);
                  setFiltroUsuario(""); // resetea usuario al cambiar equipo
                }}
              >
                <option value="">Todos los equipos</option>
                {[
                  ...new Set(usuarios.map((u) => u.equipo).filter(Boolean)),
                ].map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            )}

            {(usuario?.role === "admin" || usuario?.role === "supervisor") && (
              <select
                className="select select-bordered"
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
              >
                <option value="">Todos los usuarios</option>
                {usuarios
                  .filter((u) => {
                    if (usuario.role === "admin") {
                      return filtroEquipo ? u.equipo === filtroEquipo : true;
                    } else {
                      return u.equipo === usuario.equipo;
                    }
                  })
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
              </select>
            )}

            <button
              className="btn btn-outline"
              onClick={() => {
                setFiltroTitulo("");
                setFiltroEvento("");
                setFiltroFechaInicio("");
                setFiltroFechaFin("");
                setFiltroProgreso("");
                setFiltroConPuntos("");
              }}
            >
              Limpiar filtros
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutasPaginadas.map((ruta) => (
                  <tr key={ruta.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{ruta.titulo}</td>
                    <td className="px-3 py-2">
                      {ruta.fecha
                        ? ruta.fecha.slice(0, 10).split("-").reverse().join("/")
                        : "-"}
                    </td>
                    <td className="px-3 py-2">{ruta.evento_titulo || "-"}</td>
                    <td className="px-3 py-2 w-40">
                      {ruta.puntos && ruta.puntos.length > 0 ? (
                        <div className="w-full">
                          <div className="text-xs mb-1 text-center">
                            {`
                              ${
                                ruta.puntos.filter(
                                  (p) =>
                                    p.estado?.toLowerCase() === "completado"
                                ).length
                              } / ${ruta.puntos.length}`}
                          </div>
                          <progress
                            className="progress progress-success w-full"
                            value={
                              ruta.puntos.filter(
                                (p) => p.estado?.toLowerCase() === "completado"
                              ).length
                            }
                            max={ruta.puntos.length}
                          ></progress>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-500">
                          Sin puntos
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="btn btn-sm btn-outline mr-2"
                        onClick={() => {
                          setRutaSeleccionadaParaPuntos(ruta);
                          setPuntosRuta(ruta.puntos || []);
                          setMostrarMapa(true);
                        }}
                      >
                        Ver
                      </button>
                      {ruta.puntos && ruta.puntos.length > 0 ? (
                        <button
                          className="btn btn-sm btn-warning mr-2"
                          onClick={() => {
                            setRutaSeleccionadaParaPuntos(ruta);
                            setPuntosRuta(ruta.puntos || []);
                            setMostrarModalEditarPuntos(true);
                          }}
                        >
                          Editar puntos
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-success mr-2"
                          onClick={() => {
                            setRutaSeleccionadaParaPuntos(ruta);
                            setPuntosRuta([]);
                            setMostrarModalCrearPuntos(true);
                          }}
                        >
                          Añadir puntos
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
      {/* MODAL CREAR PUNTOS */}
      {mostrarModalCrearPuntos && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-6 relative">
            <h2 className="text-xl font-bold text-center text-blue-600 mb-4">
              Crear Puntos de la Ruta
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lista de puntos */}
              <div className="h-[300px] overflow-y-auto border rounded p-3 bg-gray-50">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  Puntos Agregados
                </h3>
                {puntosRuta.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Aún no se han agregado puntos.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {puntosRuta.map((punto, index) => (
                      <li
                        key={index}
                        className="border rounded px-3 py-2 bg-white shadow-sm flex justify-between items-start"
                      >
                        <div>
                          <p>
                            <span className="font-semibold">#{index + 1}</span>{" "}
                            - <span>{punto.empresa}</span>
                          </p>
                          <p className="text-xs text-gray-500 italic">
                            {punto.tipo} | {punto.hora_inicio} -{" "}
                            {punto.hora_fin}
                          </p>
                        </div>
                        <button
                          className="text-red-500 hover:text-red-700 text-xs"
                          onClick={() => {
                            const confirmacion = confirm(
                              "¿Eliminar este punto?"
                            );
                            if (confirmacion) {
                              setPuntosRuta((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }
                          }}
                        >
                          ❌
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Formulario */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Tipo de Punto</label>
                <select
                  className="select select-bordered w-full"
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                >
                  <option value="Empresas">Empresas</option>
                  <option value="Institutos">Institutos</option>
                  <option value="Ferias">Ferias</option>
                  <option value="Charlas">Charlas</option>
                  <option value="Activaciones">Activaciones</option>
                </select>

                <label className="text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={empresaInput}
                  onChange={(e) => setEmpresaInput(e.target.value)}
                  placeholder={`Escribe nombre de ${categoriaSeleccionada.toLowerCase()}`}
                />

                <label className="text-sm font-medium">Dirección</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={nuevoPunto.direccion}
                  onChange={(e) =>
                    setNuevoPunto((prev) => ({
                      ...prev,
                      direccion: e.target.value,
                    }))
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Hora Inicio</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={nuevoPunto.hora_inicio}
                      onChange={(e) =>
                        setNuevoPunto((prev) => ({
                          ...prev,
                          hora_inicio: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hora Fin</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={nuevoPunto.hora_fin}
                      onChange={(e) =>
                        setNuevoPunto((prev) => ({
                          ...prev,
                          hora_fin: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <label className="text-sm font-medium">
                  Motivo de la Visita
                </label>
                <select
                  className="select select-bordered w-full"
                  value={nuevoPunto.motivo_visita}
                  onChange={(e) =>
                    setNuevoPunto((prev) => ({
                      ...prev,
                      motivo_visita: e.target.value,
                    }))
                  }
                >
                  <option value="">-- Selecciona un motivo --</option>
                  <option value="Presentación portafolio">
                    Presentación portafolio
                  </option>
                  <option value="Requerimiento de capacitación">
                    Requerimiento de capacitación
                  </option>
                  <option value="Reunión alineamiento">
                    Reunión alineamiento
                  </option>
                  <option value="Inicio del programa">
                    Inicio del programa
                  </option>
                  <option value="Cierre del programa">
                    Cierre del programa
                  </option>
                </select>

                <div className="flex gap-2 mt-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      if (!empresaInput.trim() || !nuevoPunto.direccion) {
                        alert("Falta nombre o dirección.");
                        return;
                      }
                      setPuntosRuta((prev) => [
                        ...prev,
                        {
                          ...nuevoPunto,
                          tipo: categoriaSeleccionada,
                          empresa: empresaInput,
                          fecha: rutaSeleccionadaParaPuntos.fecha,
                        },
                      ]);
                      setNuevoPunto({
                        direccion: "",
                        hora_inicio: "08:00",
                        hora_fin: "09:00",
                        motivo_visita: "",
                      });
                      setEmpresaInput("");
                    }}
                  >
                    Añadir Punto
                  </button>

                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setNuevoPunto({
                        direccion: "",
                        hora_inicio: "08:00",
                        hora_fin: "09:00",
                        motivo_visita: "",
                      });
                      setEmpresaInput("");
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-outline"
                onClick={() => setMostrarModalCrearPuntos(false)}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    for (let i = 0; i < puntosRuta.length; i++) {
                      const payload = {
                        ruta_id: rutaSeleccionadaParaPuntos.id,
                        direccion: puntosRuta[i].direccion || "",
                        orden: i + 1,
                        estado: puntosRuta[i].estado || "pendiente",
                        tipo: puntosRuta[i].tipo || "general", // evita null
                        nombre: puntosRuta[i].empresa || "Sin nombre",
                        fecha: puntosRuta[i].fecha
                          ? `${puntosRuta[i].fecha}T12:00:00`
                          : null,
                        hora_inicio: puntosRuta[i].hora_inicio || null,
                        hora_fin: puntosRuta[i].hora_fin || null,
                        motivo_visita: puntosRuta[i].motivo_visita || "",
                      };

                      console.log("📦 Payload que se envía:", payload);

                      await axios.post("/puntos_ruta", payload, {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      });
                    }

                    setMostrarModalCrearPuntos(false);
                    setPuntosRuta([]);
                    navigate(`/rutas?ruta_id=${rutaSeleccionadaParaPuntos.id}`);
                  } catch (error) {
                    console.error(
                      "❌ Error al guardar puntos:",
                      error.response?.data || error.message
                    );
                    alert("Error al guardar puntos");
                  }
                }}
              >
                Guardar puntos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PUNTOS */}
      {mostrarModalEditarPuntos && (
        <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center">
          <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl p-6 relative">
            <h2 className="text-xl font-bold text-center text-blue-600 mb-4">
              Editar Puntos de la Ruta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label>
                  Estado:
                  <select
                    className="select select-bordered select-sm w-full"
                    value={puntoSeleccionado.estado}
                    onChange={(e) => {
                      const nuevoEstado = e.target.value;
                      setPuntoSeleccionado({
                        ...puntoSeleccionado,
                        estado: nuevoEstado,
                      });
                    }}
                  >
                    <option value="">Selecciona estado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="reprogramado">Reprogramado</option>
                    <option value="completado">Completado</option>
                  </select>
                </label>
                <label>
                  Orden:
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    value={puntoSeleccionado.orden}
                    onChange={(e) =>
                      setPuntoSeleccionado({
                        ...puntoSeleccionado,
                        orden: e.target.value,
                      })
                    }
                  />
                </label>

                <button
                  className="btn btn-info"
                  onClick={async () => {
                    if (!puntoSeleccionado.id) {
                      alert("Selecciona un punto del resumen primero.");
                      return;
                    }

                    try {
                      await axios.put(
                        `/puntos_ruta/${puntoSeleccionado.id}`,
                        {
                          orden: puntoSeleccionado.orden,
                          estado: puntoSeleccionado.estado,
                          fichas_logradas:
                            puntoSeleccionado.estado?.toLowerCase() ===
                            "completado"
                              ? parseInt(
                                  puntoSeleccionado.fichas_logradas,
                                  10
                                ) || 0
                              : null,
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                        }
                      );

                      setPuntosRuta((prev) =>
                        prev.map((p) =>
                          p.id === puntoSeleccionado.id
                            ? {
                                ...p,
                                ...puntoSeleccionado,
                                direccion: direccionSeleccionada,
                              }
                            : p
                        )
                      );

                      await obtenerRutas();
                      setPuntoSeleccionado({
                        id: null,
                        latitud: "",
                        longitud: "",
                        estado: "",
                        orden: "",
                        direccion: "",
                        tipo: "",
                        nombre: "",
                      });
                      setDireccionSeleccionada("");
                    } catch (error) {
                      console.error(
                        "Error al actualizar punto individual:",
                        error
                      );
                      alert("Error al actualizar el punto.");
                    }
                  }}
                >
                  Actualizar punto
                </button>
              </div>

              <div className="overflow-auto max-h-[400px] border rounded-md">
                <table className="table table-zebra w-full text-sm">
                  <thead className="bg-blue-100 sticky top-0 z-10">
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Orden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puntosRuta.map((punto, index) => (
                      <tr
                        key={punto.id}
                        className={`cursor-pointer ${
                          puntoSeleccionado.id === punto.id
                            ? "bg-blue-50 font-semibold"
                            : ""
                        }`}
                        onClick={() => setPuntoSeleccionado(punto)}
                      >
                        <td>{index + 1}</td>
                        <td>{punto.nombre || "-"}</td>
                        <td>{punto.tipo || "-"}</td>
                        <td>{punto.estado || "-"}</td>
                        <td>{punto.orden || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                className="btn btn-sm bg-gray-300 hover:bg-gray-400 text-black font-semibold border border-gray-500 px-4 py-2 rounded shadow"
                onClick={() => {
                  setMostrarModalEditarPuntos(false);
                  setRutaSeleccionadaParaPuntos(null);
                  setPuntosRuta([]);
                  setPuntoSeleccionado({
                    id: null,
                    latitud: "",
                    longitud: "",
                    estado: "",
                    orden: "",
                    direccion: "",
                    tipo: "",
                    nombre: "",
                    fichas_logradas: "",
                  });
                }}
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {mostrarMapa && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white w-full max-w-5xl h-[500px] rounded-lg shadow-xl p-4 relative">
            <GoogleMapComponent
              puntos={puntosRuta}
              ruta={rutaSeleccionadaParaPuntos}
              onMarkerClick={(p) => {
                setPuntoSeleccionado(p);
                setDireccionSeleccionada(p.direccion || "");
                setMostrarModalEditarPuntos(true);
              }}
            />
            <div className="flex justify-end mt-4">
              <button
                className="btn btn-sm bg-gray-300 hover:bg-gray-400 text-black font-semibold border border-gray-500 px-4 py-2 rounded shadow"
                onClick={() => setMostrarMapa(false)}
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Rutas;
