import { useState, useEffect } from "react";

const FiltrosCalendario = ({
  eventosOriginales,
  setEventosFiltrados,
  usuarios,
  usuario,
  filtroEquipo,
  setFiltroEquipo,
  filtroUsuario,
  setFiltroUsuario,
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [busquedaTitulo, setBusquedaTitulo] = useState("");

  useEffect(() => {
    let filtrados = eventosOriginales;

    if (filtroCategoria) {
      filtrados = filtrados.filter(
        (e) =>
          e.extendedProps?.tipo?.toLowerCase() === filtroCategoria.toLowerCase()
      );
    }

    if (desde) {
      filtrados = filtrados.filter((e) => new Date(e.start) >= new Date(desde));
    }

    if (hasta) {
      filtrados = filtrados.filter((e) => new Date(e.start) <= new Date(hasta));
    }

    if (busquedaTitulo.trim()) {
      filtrados = filtrados.filter((e) =>
        e.title.toLowerCase().includes(busquedaTitulo.toLowerCase())
      );
    }

    if (filtroEquipo) {
      filtrados = filtrados.filter(
        (e) => e.extendedProps?.equipo === filtroEquipo
      );
    }

    if (filtroUsuario) {
      filtrados = filtrados.filter(
        (e) => String(e.extendedProps?.usuario_id) === filtroUsuario
      );
    }

    setEventosFiltrados(filtrados);
  }, [
    filtroCategoria,
    desde,
    hasta,
    busquedaTitulo,
    filtroEquipo,
    filtroUsuario,
    eventosOriginales,
  ]);

  return (
    <div className="grid md:grid-cols-6 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium">Tipo</label>
        <select
          className="select select-bordered w-full"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="Empresas">Empresas</option>
          <option value="Institutos">Institutos</option>
          <option value="Ferias">Ferias</option>
          <option value="Charlas">Charlas</option>
          <option value="Activaciones">Activaciones</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Desde</label>
        <input
          type="date"
          className="input input-bordered w-full"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Hasta</label>
        <input
          type="date"
          className="input input-bordered w-full"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Buscar título</label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Escribe aquí..."
          value={busquedaTitulo}
          onChange={(e) => setBusquedaTitulo(e.target.value)}
        />
      </div>

      {usuario?.role === "admin" && (
        <>
          <div>
            <label className="block text-sm font-medium">Equipo</label>
            <select
              className="select select-bordered w-full"
              value={filtroEquipo}
              onChange={(e) => {
                setFiltroEquipo(e.target.value);
                setFiltroUsuario(""); // Limpia usuario al cambiar de equipo
              }}
            >
              <option value="">Todos</option>
              {[...new Set(usuarios.map((u) => u.equipo))].map((equipo) => (
                <option key={equipo} value={equipo}>
                  {equipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Usuario</label>
            <select
              className="select select-bordered w-full"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
              disabled={!filtroEquipo}
            >
              <option value="">Todos</option>
              {usuarios
                .filter((u) => u.equipo === filtroEquipo)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}

      {usuario?.role === "supervisor" && (
        <div>
          <label className="block text-sm font-medium">Usuario</label>
          <select
            className="select select-bordered w-full"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          >
            <option value="">Todos</option>
            {usuarios
              .filter((u) => u.equipo === usuario.equipo)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default FiltrosCalendario;
