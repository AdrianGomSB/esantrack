export const getColoresPorTipo = (tipo) => {
  const tipoColor = {
    Empresas: "#2563eb",
    Institutos: "#10b981",
    Ferias: "#f59e0b",
    Charlas: "#8b5cf6",
    Activaciones: "#ef4444",
  };
  const baseColor = tipoColor[tipo] || "#6b7280";
  return {
    baseColor,
    pastel: baseColor + "22",
  };
};

// utils/eventUtils.js
export const transformarEventosDesdePuntosRuta = (data) => {
  return data.map((p) => {
    const fecha = new Date(p.fecha).toISOString().split("T")[0];
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
        usuario_id: p.user_id, // 👈 CAMBIO CLAVE AQUÍ
        equipo: p.equipo,
      },
    };
  });
};
