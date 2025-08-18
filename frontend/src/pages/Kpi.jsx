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
                .map((p) => (p.nombre || "").trim()) // normalizado en opciones
                .filter(Boolean)
            ),
          ].map((nombre, i) => (
            <option key={i} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      {kpis ? (
        <>
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
