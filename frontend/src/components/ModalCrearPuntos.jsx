import React, { useState } from "react";
import axiosInstance from "../utils/axiosConfig";
import axios from "axios";

export default function ModalCrearPuntos({
  mostrarModalCrearPuntos,
  setMostrarModalCrearPuntos,
  puntosRuta,
  setPuntosRuta,
  rutaSeleccionadaParaPuntos,
  navigate,
}) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Empresas");
  const [empresaInput, setEmpresaInput] = useState("");
  const [empresaSugerencias, setEmpresaSugerencias] = useState([]);
  const [nuevoPunto, setNuevoPunto] = useState({
    direccion: "",
    latitud: null,
    longitud: null,
    hora_inicio: "08:00",
    hora_fin: "09:00",
    motivo_visita: "",
  });

  const geocodificarDireccion = async (direccion) => {
    try {
      const res = await axiosInstance.get(
        `geocodificar?direccion=${encodeURIComponent(direccion)}`
      );
      return res.data; // { lat, lng }
    } catch (err) {
      console.error("Error geocodificando:", err);
      return null;
    }
  };

  if (!mostrarModalCrearPuntos) return null;

  return (
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
                        <span className="font-semibold">#{index + 1}</span> -{" "}
                        <span>{punto.empresa}</span>
                      </p>
                      <p className="text-xs text-gray-500 italic">
                        {punto.tipo} | {punto.hora_inicio} - {punto.hora_fin}
                      </p>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700 text-xs"
                      onClick={() => {
                        const confirmacion = confirm("¿Eliminar este punto?");
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
                      const res = await axiosInstance.get(
                        `/organizaciones/buscar?query=${encodeURIComponent(
                          query
                        )}&tipo=${encodeURIComponent(categoriaSeleccionada)}`,
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
                  } else {
                    setEmpresaSugerencias([]);
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
                      onClick={() => {
                        setEmpresaInput(emp.nombre);
                        setNuevoPunto((prev) => ({
                          ...prev,
                          direccion: emp.direccion || "",
                          latitud: null,
                          longitud: null,
                        }));
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

            {/* Horarios */}
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

            <label className="text-sm font-medium">Motivo de la Visita</label>
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
              <option value="Presentación portafolio">
                Presentación portafolio
              </option>
              <option value="Requerimiento de capacitación">
                Requerimiento de capacitación
              </option>
              <option value="Reunión alineamiento">Reunión alineamiento</option>
              <option value="Inicio del programa">Inicio del programa</option>
              <option value="Cierre del programa">Cierre del programa</option>
            </select>

            {/* Botones */}
            <div className="flex gap-2 mt-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={async () => {
                  // Validaciones
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

                  // Validar traslape de horarios
                  const existeConflicto = puntosRuta.some((p) => {
                    const inicio = nuevoPunto.hora_inicio;
                    const fin = nuevoPunto.hora_fin;
                    return (
                      (inicio >= p.hora_inicio && inicio < p.hora_fin) ||
                      (fin > p.hora_inicio && fin <= p.hora_fin) ||
                      (inicio <= p.hora_inicio && fin >= p.hora_fin)
                    );
                  });

                  if (existeConflicto) {
                    alert("Ya existe un punto de ruta en ese horario.");
                    return;
                  }

                  // Geocodificar si faltan coordenadas
                  if (!nuevoPunto.latitud || !nuevoPunto.longitud) {
                    const coords = await geocodificarDireccion(
                      nuevoPunto.direccion
                    );
                    if (!coords) {
                      alert("No se pudo obtener la ubicación de la dirección.");
                      return;
                    }
                    nuevoPunto.latitud = coords.lat;
                    nuevoPunto.longitud = coords.lng;
                  }

                  // Agregar punto
                  setPuntosRuta((prev) => [
                    ...prev,
                    {
                      ...nuevoPunto,
                      tipo: categoriaSeleccionada,
                      empresa: empresaInput,
                      fecha: rutaSeleccionadaParaPuntos.fecha,
                    },
                  ]);

                  // Resetear campos
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
                      estado: puntosRuta[i].estado || "pendiente",
                      tipo: puntosRuta[i].tipo || null,
                      nombre: puntosRuta[i].empresa || null,
                      fecha: `${puntosRuta[i].fecha}T12:00:00`, // ✅ Aquí corregimos
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
  );
}
