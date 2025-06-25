import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";
const Organizacion = () => {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [sugerenciasNombre, setSugerenciasNombre] = useState([]);
  const organizacionesPorPagina = 10;

  const [nuevaOrganizacion, setNuevaOrganizacion] = useState({
    nombre: "",
    tipo: "Empresa",
    direccion: "",
  });

  useEffect(() => {
    obtenerOrganizaciones();
  }, []);

  const obtenerOrganizaciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/organizaciones", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrganizaciones(res.data);
    } catch (error) {
      console.error("Error al obtener organizaciones:", error);
    }
  };

  const handleAgregarOrganizacion = async () => {
    try {
      const token = localStorage.getItem("token");

      if (nuevaOrganizacion.id) {
        await axios.put(
          `/organizaciones/${nuevaOrganizacion.id}`,
          nuevaOrganizacion,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.post("/api/organizaciones", nuevaOrganizacion, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setNuevaOrganizacion({ nombre: "", tipo: "Empresa", direccion: "" });
      setMostrarModal(false);
      obtenerOrganizaciones();
    } catch (error) {
      console.error("Error al guardar organización:", error);
    }
  };
  const eliminarOrganizacion = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta organización?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/organizaciones/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      obtenerOrganizaciones();
    } catch (error) {
      console.error("Error al eliminar organización:", error);
    }
  };

  const editarOrganizacion = (org) => {
    setNuevaOrganizacion(org);
    setMostrarModal(true);
  };

  const buscarEmpresasPorNombre = async (texto) => {
    setNuevaOrganizacion((prev) => ({ ...prev, nombre: texto }));
    if (!texto.trim()) {
      setSugerenciasNombre([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/empresas/buscar?query=${encodeURIComponent(
          texto
        )}&tipo=${encodeURIComponent(nuevaOrganizacion.tipo)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSugerenciasNombre(res.data);
    } catch (error) {
      console.error("Error al buscar sugerencias:", error);
    }
  };

  // Paginación
  const totalPaginas = Math.ceil(
    organizaciones.length / organizacionesPorPagina
  );
  const indiceInicio = (paginaActual - 1) * organizacionesPorPagina;
  const indiceFin = indiceInicio + organizacionesPorPagina;
  const organizacionesPagina = organizaciones.slice(indiceInicio, indiceFin);

  return (
    <Layout titulo="Organización">
      <h1 className="text-2xl font-bold mb-4">Cartera</h1>

      <div className="mb-4">
        <button
          onClick={() => setMostrarModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Agregar Organización
        </button>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 text-center">
              Nueva Organización
            </h2>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Tipo</label>
              <select
                value={nuevaOrganizacion.tipo}
                onChange={(e) =>
                  setNuevaOrganizacion({
                    ...nuevaOrganizacion,
                    tipo: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded"
              >
                <option value="Empresa">Empresa</option>
                <option value="Instituto">Instituto</option>
              </select>
            </div>

            <div className="mb-4 relative">
              <label className="block mb-1 font-medium">Nombre</label>
              <input
                type="text"
                value={nuevaOrganizacion.nombre}
                onChange={(e) => buscarEmpresasPorNombre(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              {sugerenciasNombre.length > 0 && (
                <ul className="absolute bg-white border border-gray-300 rounded mt-1 w-full z-50 max-h-48 overflow-y-auto">
                  {sugerenciasNombre.map((sug) => (
                    <li
                      key={sug.id_empresa}
                      onClick={() => {
                        setNuevaOrganizacion({
                          ...nuevaOrganizacion,
                          nombre: sug.nombre,
                          direccion: sug.direccion || "", // para completar dirección si existe
                        });
                        setSugerenciasNombre([]);
                      }}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {sug.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Dirección</label>
              <input
                type="text"
                value={nuevaOrganizacion.direccion}
                onChange={(e) =>
                  setNuevaOrganizacion({
                    ...nuevaOrganizacion,
                    direccion: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarOrganizacion}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Dirección</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {organizacionesPagina.map((org) => (
              <tr key={org.id}>
                <td className="px-4 py-2">{org.nombre}</td>
                <td className="px-4 py-2">{org.tipo}</td>
                <td className="px-4 py-2">{org.direccion}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => editarOrganizacion(org)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-xs btn-error text-white"
                    onClick={() => eliminarOrganizacion(org.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Anterior
        </button>
        <span className="text-sm font-medium">
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          onClick={() =>
            setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))
          }
          disabled={paginaActual === totalPaginas}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Siguiente
        </button>
      </div>
    </Layout>
  );
};

export default Organizacion;
