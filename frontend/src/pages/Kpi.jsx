import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import clsx from "clsx";

// 🔽 NUEVO: librerías para Excel
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];
const motivosFijos = [
  "Visita de cartera",
  "Presentación portafolio",
  "Requerimiento de capacitación",
  "Reunión alineamiento",
  "Inicio del programa",
  "Cierre del programa",
];

const reformatearDatosParaStacked = (data) => {
  const agrupado = {};
  data.forEach(({ motivo, estado, cantidad }) => {
    if (!agrupado[motivo]) {
      agrupado[motivo] = {
        motivo,
        completado: 0,
        reprogramado: 0,
        cancelado: 0,
        pendiente: 0,
      };
    }
    agrupado[motivo][estado] = cantidad;
  });
  return Object.values(agrupado)
    .filter((d) => motivosFijos.includes(d.motivo))
    .sort((a, b) => a.motivo.localeCompare(b.motivo));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 p-2 rounded shadow text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-gray-700">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Kpi = () => {
  const [kpis, setKpis] = useState(null);
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFin, setFiltroFin] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [filtroEquipo, setFiltroEquipo] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [puntos, setPuntos] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");

  // 🔽 NUEVO: selector de asesoras con búsqueda y checkboxes
  const [asesorasSeleccionadas, setAsesorasSeleccionadas] = useState([]);
  const [busquedaAsesora, setBusquedaAsesora] = useState(""); // texto para filtrar por nombre/username

  const usuariosFiltrados = filtroEquipo
    ? usuarios.filter((u) => u.equipo === filtroEquipo)
    : usuarios;

  const obtenerUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const obtenerPuntos = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/puntos_ruta", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPuntos(data);
    } catch (error) {
      console.error("Error al cargar puntos:", error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
    obtenerPuntos();
  }, []);

  // Lista de asesoras filtradas por equipo + texto
  const asesorasDeEquipo = usuarios.filter((u) => u.equipo === filtroEquipo);
  const asesorasFiltradas = asesorasDeEquipo.filter((u) => {
    if (!busquedaAsesora.trim()) return true;
    const q = busquedaAsesora.toLowerCase();
    const nombre = (u.nombre ?? "").toLowerCase();
    const username = (u.username ?? "").toLowerCase();
    return (
      nombre.includes(q) || username.includes(q) || String(u.id).includes(q)
    );
  });

  useEffect(() => {
    if (!puntos || puntos.length === 0) return;

    const estados = {
      completado: 0,
      pendiente: 0,
      reprogramado: 0,
      cancelado: 0,
    };

    let totalPuntos = 0;
    let puntosCompletados = 0;
    const motivoContador = {};
    const motivoPorEstado = {};
    const visitasEmpresa = {};

    const desde = filtroInicio ? new Date(filtroInicio) : null;
    const hasta = filtroFin ? new Date(filtroFin) : null;

    for (const p of puntos) {
      const fecha = new Date(p.fecha);
      const estado = p.estado?.toLowerCase();
      const motivo = p.motivo_visita || "Otro";
      const nombreEmpresa = (p.nombre || "").trim(); // normalizado

      if ((desde && fecha < desde) || (hasta && fecha > hasta)) continue;
      if (filtroUsuario && String(p.user_id) !== String(filtroUsuario))
        continue;
      if (
        filtroEquipo &&
        !usuarios.find(
          (u) => String(u.id) === String(p.user_id) && u.equipo === filtroEquipo
        )
      )
        continue;
      if (filtroMotivo && p.motivo_visita !== filtroMotivo) continue;
      if (empresaSeleccionada && nombreEmpresa !== empresaSeleccionada)
        continue;

      totalPuntos++;
      if (estado && estados.hasOwnProperty(estado)) estados[estado]++;
      if (estado === "completado") puntosCompletados++;

      motivoContador[motivo] = (motivoContador[motivo] || 0) + 1;

      if (!motivoPorEstado[motivo]) motivoPorEstado[motivo] = {};
      motivoPorEstado[motivo][estado] =
        (motivoPorEstado[motivo][estado] || 0) + 1;

      if (!visitasEmpresa[nombreEmpresa]) visitasEmpresa[nombreEmpresa] = 0;
      visitasEmpresa[nombreEmpresa]++;
    }

    const motivoData = Object.entries(motivoContador)
      .filter(([motivo]) => motivosFijos.includes(motivo))
      .map(([motivo, cantidad]) => ({ motivo, cantidad }))
      .sort((a, b) => a.motivo.localeCompare(b.motivo));

    const motivoEstadoData = Object.entries(motivoPorEstado).flatMap(
      ([motivo, estados]) =>
        Object.entries(estados).map(([estado, cantidad]) => ({
          motivo,
          estado,
          cantidad,
        }))
    );

    setKpis({
      motivoData,
      motivoEstadoData,
      totalPuntos,
      puntosCompletados,
      estados,
      visitasEmpresa,
    });
  }, [
    puntos,
    filtroInicio,
    filtroFin,
    filtroUsuario,
    filtroEquipo,
    filtroMotivo,
    empresaSeleccionada,
    usuarios,
  ]);

  // 🔽 NUEVO: Export tipo SQL "SELECT * FROM puntos_ruta WHERE user_id IN (...)"
  const exportarExcelPorAsesoras = () => {
    if (!puntos || puntos.length === 0) return;

    if (!asesorasSeleccionadas || asesorasSeleccionadas.length === 0) {
      alert("Selecciona al menos una asesora.");
      return;
    }

    const sel = new Set(asesorasSeleccionadas.map(String));
    const rows = puntos.filter((p) => sel.has(String(p.user_id)));

    if (rows.length === 0) {
      alert("No hay registros para las asesoras seleccionadas.");
      return;
    }

    // Solo columnas: Asesora (nombre o user_id), user_id, estado, motivo_visita, nombre, fecha
    const data = rows.map((p) => {
      const u = usuarios.find((x) => String(x.id) === String(p.user_id));
      const asesora = u?.nombre ?? u?.username ?? p.user_id;
      let fecha = "";
      if (p.fecha) {
        try {
          const d = new Date(p.fecha);
          if (!isNaN(d)) fecha = d.toISOString().slice(0, 10);
        } catch {}
      }
      return {
        Asesora: asesora, // nombre si existe, si no, el user_id
        user_id: p.user_id ?? "", // lo dejamos también explícito por si lo necesitas
        estado: p.estado ?? "",
        motivo_visita: p.motivo_visita ?? "",
        nombre: (p.nombre || "").trim(), // empresa/institución
        fecha: fecha,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data, {
      header: [
        "Asesora",
        "user_id",
        "estado",
        "motivo_visita",
        "nombre",
        "fecha",
      ],
    });
    XLSX.utils.book_append_sheet(wb, ws, "puntos_ruta_filtrado");

    const hoy = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `puntos_ruta_asesoras_${asesorasSeleccionadas.join(
      "-"
    )}_${hoy}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      nombreArchivo
    );
  };

  return (
    <Layout titulo="Kpi">
      <h1 className="text-2xl font-bold mb-4">Resumen de Actividad</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 items-end">
        <input
          type="date"
          className="input input-bordered"
          value={filtroInicio}
          onChange={(e) => setFiltroInicio(e.target.value)}
        />
        <input
          type="date"
          className="input input-bordered"
          value={filtroFin}
          onChange={(e) => setFiltroFin(e.target.value)}
        />

        <select
          className="input input-bordered"
          value={filtroMotivo}
          onChange={(e) => setFiltroMotivo(e.target.value)}
        >
          <option value="">Todos los motivos</option>
          {motivosFijos.map((m, i) => (
            <option key={i} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="input input-bordered"
          value={filtroEquipo}
          onChange={(e) => {
            setFiltroEquipo(e.target.value);
            setFiltroUsuario("");
            setEmpresaSeleccionada("");
            setAsesorasSeleccionadas([]); // limpiar multi-select al cambiar equipo
          }}
        >
          <option value="">Todos los equipos</option>
          {[...new Set(usuarios.map((u) => u.equipo))]
            .filter(Boolean)
            .map((equipo, i) => (
              <option key={i} value={equipo}>
                {equipo}
              </option>
            ))}
        </select>

        <select
          className="input input-bordered"
          value={filtroUsuario}
          onChange={(e) => {
            setFiltroUsuario(e.target.value);
            setEmpresaSeleccionada("");
          }}
          disabled={!filtroEquipo}
        >
          <option value="">Todos los usuarios</option>
          {usuarios
            .filter((u) => u.equipo === filtroEquipo)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre ?? u.username}
              </option>
            ))}
        </select>

        <select
          className="input input-bordered"
          value={empresaSeleccionada}
          onChange={(e) => setEmpresaSeleccionada(e.target.value)}
          disabled={!filtroUsuario}
        >
          <option value="">Todas las empresas/instituciones</option>
          {[
            ...new Set(
              puntos
                .filter((p) => String(p.user_id) === filtroUsuario)
                .map((p) => (p.nombre || "").trim())
                .filter(Boolean)
            ),
          ].map((nombre, i) => (
            <option key={i} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      {/* 🔽 NUEVO: Multi-select y botón de exportación tipo SQL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-start">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">
            Buscar asesora por nombre, usuario o ID
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Ej: Ana / agomez / 12"
            value={busquedaAsesora}
            onChange={(e) => setBusquedaAsesora(e.target.value)}
            disabled={!filtroEquipo}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setAsesorasSeleccionadas(
                asesorasDeEquipo.map((u) => String(u.id))
              )
            }
            disabled={!filtroEquipo || asesorasDeEquipo.length === 0}
            title="Seleccionar todo el equipo"
          >
            Seleccionar todo
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setAsesorasSeleccionadas([])}
            disabled={!filtroEquipo}
          >
            Quitar todo
          </button>
        </div>

        <div>
          <button
            className="btn btn-primary text-white"
            onClick={exportarExcelPorAsesoras}
            disabled={!filtroEquipo || asesorasSeleccionadas.length === 0}
            title='Exportar "SELECT * FROM puntos_ruta WHERE user_id IN (...)" con columnas específicas'
          >
            ⬇️ Exportar Excel (asesoras)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4 max-h-64 overflow-auto pr-1">
        {asesorasFiltradas.map((u) => {
          const id = String(u.id);
          const checked = asesorasSeleccionadas.includes(id);
          return (
            <label
              key={id}
              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={checked}
                onChange={(e) => {
                  setAsesorasSeleccionadas((prev) =>
                    e.target.checked
                      ? [...prev, id]
                      : prev.filter((x) => x !== id)
                  );
                }}
              />
              <span className="text-sm">
                {u.nombre ?? u.username ?? `ID ${id}`}{" "}
                <span className="text-gray-400">· ID {id}</span>
              </span>
            </label>
          );
        })}

        {filtroEquipo && asesorasFiltradas.length === 0 && (
          <div className="text-sm text-gray-500">Sin coincidencias.</div>
        )}
        {!filtroEquipo && (
          <div className="text-sm text-gray-500">
            Selecciona primero un equipo para ver asesoras.
          </div>
        )}
      </div>

      {kpis ? (
        <>
          <br />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total de Puntos", value: kpis.totalPuntos ?? 0 },
              { label: "Completados", value: kpis.estados.completado ?? 0 },
              { label: "Reprogramados", value: kpis.estados.reprogramado ?? 0 },
              { label: "Cancelados", value: kpis.estados.cancelado ?? 0 },
              { label: "Pendientes", value: kpis.estados.pendiente ?? 0 },
              empresaSeleccionada && {
                label: `Visitas a ${empresaSeleccionada}`,
                value: kpis.visitasEmpresa?.[empresaSeleccionada?.trim()] ?? 0,
              },
            ]
              .filter(Boolean)
              .map((k, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded shadow text-center border"
                >
                  <h3 className="text-sm text-gray-500">{k.label}</h3>
                  <p className="text-xl font-bold text-blue-600">{k.value}</p>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
            {/* 1. Distribución de motivos */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-center mb-2">
                Distribución de Motivos
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={kpis.motivoData}
                    dataKey="cantidad"
                    nameKey="motivo"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {kpis.motivoData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 2. Motivo por estado */}
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold text-center mb-2">
                Motivo vs Estado
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={reformatearDatosParaStacked(kpis.motivoEstadoData)}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="motivo" type="category" />
                  <Legend />
                  <ReTooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="completado"
                    stackId="a"
                    fill="#10b981"
                    name="Completado"
                  />
                  <Bar
                    dataKey="reprogramado"
                    stackId="a"
                    fill="#f59e0b"
                    name="Reprogramado"
                  />
                  <Bar
                    dataKey="cancelado"
                    stackId="a"
                    fill="#ef4444"
                    name="Cancelado"
                  />
                  <Bar
                    dataKey="pendiente"
                    stackId="a"
                    fill="#3b82f6"
                    name="Pendiente"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">Cargando KPIs...</p>
      )}
    </Layout>
  );
};

export default Kpi;
