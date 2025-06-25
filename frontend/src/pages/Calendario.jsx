import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import Layout from "../components/Layout";
import FiltrosCalendario from "../components/FiltrosCalendario";

import { getColoresPorTipo } from "../utils/eventUtils";
import { transformarEventosDesdePuntosRuta } from "../utils/eventUtils";

import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";

import "leaflet/dist/leaflet.css";

const Calendario = () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const [usuarios, setUsuarios] = useState([]);
  const [filtroEquipo, setFiltroEquipo] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const geocodificarDireccion = async (direccion) => {
    try {
      const res = await axios.get("/geocodificar", {
        params: { direccion },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // solo si es necesario
        },
      });
      return res.data;
    } catch (err) {
      console.error("Error al geocodificar dirección:", err);
      return null;
    }
  };

  const [nuevoPunto, setNuevoPunto] = useState({
    direccion: "",
    latitud: null,
    longitud: null,
    hora_inicio: "08:00",
    hora_fin: "09:00",
    motivo_visita: "",
  });
  const [eventosFiltrados, setEventosFiltrados] = useState([]);

  const navigate = useNavigate();
  const [empresaInput, setEmpresaInput] = useState("");
  const [empresaSugerencias, setEmpresaSugerencias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Empresas");

  const calendarRef = useRef(null);
  const [mostrarModalCrearPuntos, setMostrarModalCrearPuntos] = useState(false);
  const [rutaSeleccionadaParaPuntos, setRutaSeleccionadaParaPuntos] =
    useState(null);
  const [puntosRuta, setPuntosRuta] = useState([]);

  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({
    title: "",
    date: "",
    description: "",
  });
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [eventoEnEdicionId, setEventoEnEdicionId] = useState(null);

  // Cargar eventos del backend
  useEffect(() => {
    const fetchPuntosRuta = async () => {
      try {
        const res = await axios.get("/puntos_ruta", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const eventos = transformarEventosDesdePuntosRuta(res.data);
        setEventosCalendario(eventos);
        setEventosFiltrados(eventos);
      } catch (error) {
        console.error("Error al obtener puntos de ruta:", error);
      }
    };

    fetchPuntosRuta();

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

  return (
    <Layout titulo="Calendario">
      <h1 className="text-2xl font-bold mb-6">Calendario</h1>
      <div className="flex justify-end mb-3 md:mb-4">
        <button
          className="btn bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm"
          onClick={() => {
            setMostrarModal(true);
            setModoEdicion(false);
            setNuevoEvento({ title: "", date: "", description: "" });
          }}
        >
          ➕ Añadir Evento
        </button>
      </div>
      <div className="mb-6">
        {/* FiltrosCalendario */}
        <FiltrosCalendario
          eventosOriginales={eventosCalendario}
          setEventosFiltrados={setEventosFiltrados}
          usuarios={usuarios}
          usuario={usuario}
          filtroEquipo={filtroEquipo}
          setFiltroEquipo={setFiltroEquipo}
          filtroUsuario={filtroUsuario}
          setFiltroUsuario={setFiltroUsuario}
        />

        {/* Leyenda de tipos */}
        <div className="flex flex-wrap gap-4 mt-6 px-4 md:px-10">
          {[
            { color: "#2563eb", label: "Empresas" },
            { color: "#10b981", label: "Institutos" },
            { color: "#f59e0b", label: "Ferias" },
            { color: "#8b5cf6", label: "Charlas" },
            { color: "#ef4444", label: "Activaciones" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="overflow-x-auto bg-white text-gray-800 p-3 rounded-lg shadow 
    [&_.fc]:text-gray-800 
    [&_.fc-toolbar-title]:text-2xl 
    [&_.fc-daygrid-day-number]:text-base 
    [&_.fc-event-title]:text-base
   [&_.fc-day]:border-gray-600
    [&_.fc-day]:border-2
    [&_.fc-event]:rounded-md [&_.fc-event]:shadow-sm
    [&_.fc-scrollgrid]:bg-blue-50"
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView="dayGridMonth"
          editable={false}
          displayEventTime={false}
          events={eventosFiltrados}
          locale={esLocale}
          contentHeight="auto"
          aspectRatio={1.5}
          customButtons={{
            myPrev: {
              text: "←",
              click: () => calendarRef.current.getApi().prev(),
            },
            myNext: {
              text: "→",
              click: () => calendarRef.current.getApi().next(),
            },
            myToday: {
              text: "Hoy",
              click: () => calendarRef.current.getApi().today(),
            },
          }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false, // o true para formato 12h
          }}
          eventClick={(info) => {
            const evento = info.event;
            setEventoSeleccionado({
              title: evento.title,
              date: evento.startStr,
              description: evento.extendedProps.direccion,
              estado: evento.extendedProps.estado,
              tipo: evento.extendedProps.tipo,
              latitud: evento.extendedProps.latitud,
              longitud: evento.extendedProps.longitud,
            });
          }}
          headerToolbar={{
            start: "myPrev,myNext,myToday",
            center: "title",
            end: "dayGridMonth,timeGridWeek,listWeek",
          }}
        />
      </div>
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 relative transition-all duration-300 transform scale-100">
            <h2 className="text-xl font-bold text-center text-blue-700 mb-4">
              {modoEdicion ? "Editar Evento" : "Crear Nuevo Evento"}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título del Evento
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full mt-1"
                  value={nuevoEvento.title}
                  onChange={(e) =>
                    setNuevoEvento({ ...nuevoEvento, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full mt-1"
                  value={nuevoEvento.date}
                  onChange={(e) =>
                    setNuevoEvento({ ...nuevoEvento, date: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="btn border border-gray-300 hover:bg-gray-100 text-gray-700"
                  onClick={() => {
                    const hayCambios =
                      nuevoEvento.title ||
                      nuevoEvento.date ||
                      nuevoEvento.description;
                    if (hayCambios) {
                      const confirmar = confirm(
                        "Tienes cambios sin guardar. ¿Deseas salir?"
                      );
                      if (!confirmar) return;
                    }
                    setMostrarModal(false);
                    setModoEdicion(false);
                    setEventoEnEdicionId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={async () => {
                    if (!nuevoEvento.title || !nuevoEvento.date) {
                      alert("Completa los campos obligatorios.");
                      return;
                    }

                    try {
                      let eventoCreado;

                      if (modoEdicion) {
                        // Editar evento
                        await axios.put(
                          `/eventos/${eventoEnEdicionId}`,
                          {
                            titulo: nuevoEvento.title,
                            fecha_inicio: nuevoEvento.date,
                            fecha_fin: nuevoEvento.date,
                            empresa_id: null,
                          },
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "token"
                              )}`,
                            },
                          }
                        );
                      } else {
                        // Crear evento
                        const response = await axios.post(
                          "/eventos",
                          {
                            titulo: nuevoEvento.title,
                            fecha_inicio: nuevoEvento.date,
                            fecha_fin: nuevoEvento.date,
                            empresa_id: null,
                          },
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "token"
                              )}`,
                            },
                          }
                        );
                        eventoCreado = response.data;

                        // Crear ruta automáticamente
                        // Mostrar el modal directamente con la ruta creada en backend
                        setRutaSeleccionadaParaPuntos({
                          id: eventoCreado.ruta_id,
                          titulo: `Ruta ${nuevoEvento.title}`,
                          fecha: nuevoEvento.date,
                        });
                        setPuntosRuta([]);
                        setMostrarModalCrearPuntos(true);
                      }

                      // Actualizar lista de eventos
                      const res = await axios.get("/eventos", {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      });

                      const eventosActualizados = res.data.map((evento) => ({
                        id: evento.id,
                        title: evento.titulo,
                        start: evento.fecha_inicio,
                        end: evento.fecha_fin,
                      }));

                      setEventosCalendario(eventosActualizados);
                    } catch (error) {
                      console.error("Error al guardar evento y ruta:", error);
                      alert("Hubo un error al guardar el evento.");
                    }

                    setNuevoEvento({ title: "", date: "", description: "" });
                    setMostrarModal(false);
                    setModoEdicion(false);
                    setEventoEnEdicionId(null);
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalCrearPuntos && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-6 relative">
            <h2 className="text-xl font-bold text-center text-blue-600 mb-4">
              Crear Puntos de la Ruta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={(e) => {
                    setCategoriaSeleccionada(e.target.value);
                    setEmpresaInput("");
                    setEmpresaSugerencias([]);
                  }}
                >
                  <option value="Empresas">Empresas</option>
                  <option value="Institutos">Institutos</option>
                  <option value="Ferias">Ferias</option>
                  <option value="Charlas">Charlas</option>
                  <option value="Activaciones">Activaciones</option>
                </select>

                {/* Autocompletado */}
                <div className="relative">
                  <label className="text-sm font-medium">
                    Buscar {categoriaSeleccionada}
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={empresaInput}
                    onChange={async (e) => {
                      const query = e.target.value;
                      setEmpresaInput(query);
                      if (query.trim()) {
                        try {
                          const res = await axios.get(
                            `/organizaciones/buscar?query=${encodeURIComponent(
                              query
                            )}&tipo=${encodeURIComponent(
                              categoriaSeleccionada
                            )}`,

                            {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem(
                                  "token"
                                )}`,
                              },
                            }
                          );
                          setEmpresaSugerencias(res.data);
                        } catch (err) {
                          console.error("Error buscando organizaciones:", err);
                        }
                      }
                    }}
                    placeholder={`Escribe nombre de ${categoriaSeleccionada.toLowerCase()}`}
                  />
                  {empresaSugerencias.length > 0 && (
                    <ul className="absolute bg-white border shadow w-full max-h-40 overflow-y-auto z-50">
                      {empresaSugerencias.map((emp) => (
                        <li
                          key={emp.id}
                          className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
                          onClick={async () => {
                            setEmpresaInput(emp.nombre);
                            const coords = await geocodificarDireccion(
                              emp.direccion
                            );
                            if (coords) {
                              setNuevoPunto((prev) => ({
                                ...prev,
                                direccion: emp.direccion,
                                latitud: coords.lat,
                                longitud: coords.lng,
                              }));
                            }
                            setEmpresaSugerencias([]);
                          }}
                        >
                          {emp.nombre}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label className="text-sm font-medium">Dirección</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={nuevoPunto?.direccion || ""}
                  onChange={(e) =>
                    setNuevoPunto((prev) => ({
                      ...prev,
                      direccion: e.target.value,
                    }))
                  }
                />

                {/* Otros campos */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Hora Inicio</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={nuevoPunto?.hora_inicio || "08:00"}
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
                      value={nuevoPunto?.hora_fin || "09:00"}
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
                  value={nuevoPunto?.motivo_visita || ""}
                  onChange={(e) =>
                    setNuevoPunto((prev) => ({
                      ...prev,
                      motivo_visita: e.target.value,
                    }))
                  }
                >
                  <option value="">-- Selecciona un motivo --</option>
                  <option value="Visita de cartera">Visita de cartera</option>
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
                    onClick={async () => {
                      const error = (() => {
                        if (!empresaInput.trim())
                          return "Falta nombre de la organización.";
                        if (!nuevoPunto?.direccion) return "Falta dirección.";
                        if (!nuevoPunto?.hora_inicio || !nuevoPunto?.hora_fin)
                          return "Faltan horarios.";
                        if (!nuevoPunto?.motivo_visita)
                          return "Falta motivo de visita.";
                        return null;
                      })();

                      if (error) {
                        alert(error);
                        return;
                      }

                      // ⛔ Verificar traslape de horarios
                      const nuevoInicio = nuevoPunto.hora_inicio;
                      const nuevoFin = nuevoPunto.hora_fin;

                      const existeConflicto = puntosRuta.some((p) => {
                        return (
                          (nuevoInicio >= p.hora_inicio &&
                            nuevoInicio < p.hora_fin) ||
                          (nuevoFin > p.hora_inicio &&
                            nuevoFin <= p.hora_fin) ||
                          (nuevoInicio <= p.hora_inicio &&
                            nuevoFin >= p.hora_fin)
                        );
                      });

                      if (existeConflicto) {
                        alert("Ya existe un punto de ruta en ese horario.");
                        return;
                      }

                      // 🌍 Geocodificar si faltan coordenadas
                      if (!nuevoPunto.latitud || !nuevoPunto.longitud) {
                        const coords = await geocodificarDireccion(
                          nuevoPunto.direccion
                        );
                        if (!coords) {
                          alert(
                            "No se pudo obtener la ubicación de la dirección."
                          );
                          return;
                        }
                        nuevoPunto.latitud = coords.lat;
                        nuevoPunto.longitud = coords.lng;
                      }

                      // ✅ Agregar el punto a la lista
                      setPuntosRuta((prev) => [
                        ...prev,
                        {
                          ...nuevoPunto,
                          tipo: categoriaSeleccionada,
                          empresa: empresaInput,
                          fecha: rutaSeleccionadaParaPuntos.fecha,
                        },
                      ]);

                      // 🔄 Resetear los campos
                      setNuevoPunto({
                        direccion: "",
                        latitud: null,
                        longitud: null,
                        hora_inicio: "08:00",
                        hora_fin: "09:00",
                        motivo_visita: "",
                      });
                      setEmpresaInput("");
                      setEmpresaSugerencias([]);
                    }}
                  >
                    Añadir Punto
                  </button>

                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      setNuevoPunto({
                        direccion: "",
                        latitud: null,
                        longitud: null,
                        hora_inicio: "08:00",
                        hora_fin: "09:00",
                        motivo_visita: "",
                      });
                      setEmpresaInput("");
                      setEmpresaSugerencias([]);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            {/* Guardar puntos */}
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
                      await axios.post(
                        "/puntos_ruta",
                        {
                          ruta_id: rutaSeleccionadaParaPuntos.id,
                          latitud: puntosRuta[i].latitud,
                          longitud: puntosRuta[i].longitud,
                          orden: i + 1,
                          estado: puntosRuta[i].estado,
                          tipo: puntosRuta[i].tipo || null,
                          nombre: puntosRuta[i].empresa || null,
                          fecha: puntosRuta[i].fecha,
                          hora_inicio: puntosRuta[i].hora_inicio,
                          hora_fin: puntosRuta[i].hora_fin,
                          motivo_visita: puntosRuta[i].motivo_visita || "",
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                              "token"
                            )}`,
                          },
                        }
                      );
                    }
                    setMostrarModalCrearPuntos(false);
                    setPuntosRuta([]);
                    navigate(`/rutas?ruta_id=${rutaSeleccionadaParaPuntos.id}`);
                  } catch (error) {
                    alert("Error al guardar puntos");
                    console.error(error);
                  }
                }}
              >
                Guardar puntos
              </button>
            </div>
          </div>
        </div>
      )}

      {eventoSeleccionado && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-5">
            <h2 className="text-lg font-bold text-blue-600 mb-2">
              Detalles del Punto
            </h2>
            <p>
              <span className="font-semibold">Título:</span>{" "}
              {eventoSeleccionado.title}
            </p>
            <p>
              <span className="font-semibold">Fecha:</span>{" "}
              {eventoSeleccionado.date?.split("T")[0]}
            </p>
            <p>
              <span className="font-semibold">Dirección:</span>{" "}
              {eventoSeleccionado.description}
            </p>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                className="select select-bordered w-full"
                value={eventoSeleccionado.estado}
                onChange={(e) =>
                  setEventoSeleccionado({
                    ...eventoSeleccionado,
                    estado: e.target.value,
                  })
                }
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En progreso">En progreso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
            {eventoSeleccionado?.latitud && eventoSeleccionado?.longitud && (
              <div className="mt-4">
                <GoogleMapModal
                  lat={eventoSeleccionado.latitud}
                  lng={eventoSeleccionado.longitud}
                />
              </div>
            )}

            <div className="flex justify-between mt-5">
              <button
                className="btn btn-sm bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => setEventoSeleccionado(null)}
              >
                Cerrar
              </button>
              <button
                className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                onClick={async () => {
                  try {
                    await axios.put(
                      `/puntos_ruta/${eventoSeleccionado.id}`,
                      {
                        estado: eventoSeleccionado.estado,
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      }
                    );

                    // Recargar eventos para ver reflejado el cambio
                    const res = await axios.get("/puntos_ruta", {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                      },
                    });

                    const eventos = res.data.map((p) => {
                      const fecha = new Date(p.fecha)
                        .toISOString()
                        .split("T")[0];
                      const horaInicio = p.hora_inicio?.slice(0, 5) || "08:00";
                      const horaFin = p.hora_fin?.slice(0, 5) || "09:00";
                      const { baseColor, pastel } = getColoresPorTipo(p.tipo);

                      return {
                        id: p.id,
                        title: p.nombre || `Punto ${p.id}`,
                        start: `${fecha}T${horaInicio}`,
                        end: `${fecha}T${horaFin}`,
                        backgroundColor: pastel,
                        borderColor: baseColor,
                        textColor: baseColor,
                        display: "block",
                        classNames: ["text-base", "font-semibold"],
                        extendedProps: {
                          latitud: p.latitud,
                          longitud: p.longitud,
                          estado: p.estado,
                          tipo: p.tipo,
                          direccion: p.direccion,
                          descripcion: p.descripcion,
                        },
                      };
                    });

                    setEventosCalendario(eventos);
                    setEventosFiltrados(eventos);
                    setEventoSeleccionado(null);
                  } catch (err) {
                    console.error("Error al actualizar el estado:", err);
                    alert("No se pudo actualizar el estado del punto.");
                  }
                }}
              >
                Guardar Estado
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Calendario;
