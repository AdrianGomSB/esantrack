import { useEffect, useState } from "react";
import axios from "../utils/axiosConfig";
import Layout from "../components/Layout";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    username: "",
    password: "",
    equipo: "DPA",
    role: "user",
  });
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEquipo, setFiltroEquipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const filasPorPagina = 10;
  const [error, setError] = useState("");
  const usuarioActual = JSON.parse(localStorage.getItem("usuario"));

  const obtenerUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data;

      if (usuarioActual.role === "supervisor") {
        data = data.filter((u) => u.equipo === usuarioActual.equipo);
      }

      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const abrirModalEditar = (usuario) => {
    setUsuarioEditar({ ...usuario, password: "" });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setUsuarioEditar(null);
  };

  const abrirModalCrear = () => {
    setMostrarCrear(true);
  };

  const cerrarModalCrear = () => {
    setMostrarCrear(false);
    setNuevoUsuario({
      nombre: "",
      username: "",
      password: "",
      equipo: "DPA",
      role: "user",
    });
  };

  const handleEditar = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        role: usuarioEditar.role,
        equipo: usuarioEditar.equipo,
        activo: usuarioEditar.activo,
      };

      if (usuarioEditar.password && usuarioEditar.password.trim() !== "") {
        payload.password = usuarioEditar.password;
      }

      await axios.patch(
        `http://localhost:5000/api/users/${usuarioEditar.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      cerrarModal();
      obtenerUsuarios();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar usuario");
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      obtenerUsuarios();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar usuario");
    }
  };

  const handleCrear = async () => {
    try {
      const payload = { ...nuevoUsuario };

      if (usuarioActual.role !== "admin") {
        payload.role = usuarioEditar.role;
        payload.equipo = usuarioEditar.equipo;
      }

      await axios.post("http://localhost:5000/api/auth/register", payload);
      cerrarModalCrear();
      obtenerUsuarios();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al registrar usuario");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideBusqueda =
      u.username.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.nombre.toLowerCase().includes(busqueda.toLowerCase());

    if (usuarioActual.role === "admin") {
      const coincideRol = filtroRol ? u.role === filtroRol : true;
      const coincideEquipo = filtroEquipo ? u.equipo === filtroEquipo : true;
      return coincideBusqueda && coincideRol && coincideEquipo;
    }

    return coincideBusqueda;
  });

  const totalPaginas = Math.ceil(usuariosFiltrados.length / filasPorPagina);
  const usuariosPagina = usuariosFiltrados.slice(
    (pagina - 1) * filasPorPagina,
    pagina * filasPorPagina
  );

  return (
    <Layout titulo="Usuarios">
      <h1 className="text-2xl font-bold mb-4">Usuarios Registrados</h1>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o usuario"
          className="input input-bordered"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {usuarioActual.role === "admin" && (
          <>
            <select
              className="select select-bordered"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="user">Asesor</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>

            <select
              className="select select-bordered"
              value={filtroEquipo}
              onChange={(e) => setFiltroEquipo(e.target.value)}
            >
              <option value="">Todos los equipos</option>
              <option value="DPA">DPA</option>
              <option value="Regiones">Regiones</option>
              <option value="Corporativo">Corporativo</option>
            </select>
          </>
        )}

        <button className="btn btn-primary" onClick={abrirModalCrear}>
          Añadir Usuario
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Usuario</th>
              <th className="px-4 py-2 text-left">Rol</th>
              <th className="px-4 py-2 text-left">Equipo</th>
              <th className="px-4 py-2 text-left">Activo</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPagina.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2">{user.username}</td>
                <td className="px-4 py-2 capitalize">{user.role}</td>
                <td className="px-4 py-2">{user.equipo}</td>
                <td className="px-4 py-2">{user.activo ? "Sí" : "No"}</td>
                <td className="px-4 py-2">{user.nombre}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => abrirModalEditar(user)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-xs btn-error text-white"
                    onClick={() => eliminarUsuario(user.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-center mt-4 gap-2">
        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i + 1}
            className={`btn btn-xs ${
              pagina === i + 1 ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => setPagina(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal Crear Usuario */}
      {mostrarCrear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Registrar Usuario</h3>

            <input
              className="input input-bordered w-full mb-3"
              placeholder="Nombre completo"
              value={nuevoUsuario.nombre}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
              }
            />

            <input
              className="input input-bordered w-full mb-3"
              placeholder="Nombre de usuario"
              value={nuevoUsuario.username}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })
              }
            />

            <input
              className="input input-bordered w-full mb-3"
              placeholder="Contraseña"
              type="password"
              value={nuevoUsuario.password}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
              }
            />

            {usuarioActual.role === "admin" ? (
              <select
                className="select select-bordered w-full mb-3"
                value={nuevoUsuario.equipo}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, equipo: e.target.value })
                }
              >
                <option value="DPA">DPA</option>
                <option value="Regiones">Regiones</option>
                <option value="Corporativo">Corporativo</option>
              </select>
            ) : (
              <input
                type="text"
                className="input input-bordered w-full mb-3 bg-gray-100"
                value={usuarioActual.equipo}
                disabled
                readOnly
              />
            )}

            <select
              className="select select-bordered w-full mb-4"
              value={nuevoUsuario.role}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, role: e.target.value })
              }
            >
              <option value="user">Asesor</option>
              <option value="supervisor">Supervisor</option>
              {usuarioActual.role === "admin" && (
                <option value="admin">Administrador</option>
              )}
            </select>

            <div className="flex justify-end space-x-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={cerrarModalCrear}
              >
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleCrear}>
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {mostrarModal && usuarioEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Editar Usuario</h3>

            <label className="block mb-2 text-sm font-medium">Rol</label>
            {usuarioActual.role === "admin" ? (
              <select
                className="select select-bordered w-full mb-4"
                value={usuarioEditar.role}
                onChange={(e) =>
                  setUsuarioEditar({ ...usuarioEditar, role: e.target.value })
                }
              >
                <option value="user">Asesor</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Administrador</option>
              </select>
            ) : (
              <input
                type="text"
                className="input input-bordered w-full mb-4 bg-gray-100"
                value={usuarioEditar.role}
                readOnly
                disabled
              />
            )}

            <label className="block mb-2 text-sm font-medium">Equipo</label>
            {usuarioActual.role === "admin" ? (
              <select
                className="select select-bordered w-full mb-4"
                value={usuarioEditar.equipo}
                onChange={(e) =>
                  setUsuarioEditar({ ...usuarioEditar, equipo: e.target.value })
                }
              >
                <option value="DPA">DPA</option>
                <option value="Regiones">Regiones</option>
                <option value="Corporativo">Corporativo</option>
              </select>
            ) : (
              <input
                type="text"
                className="input input-bordered w-full mb-4 bg-gray-100"
                value={usuarioEditar.equipo}
                readOnly
                disabled
              />
            )}

            <label className="block mb-2 text-sm font-medium">Activo</label>
            <select
              className="select select-bordered w-full mb-4"
              value={usuarioEditar.activo}
              onChange={(e) =>
                setUsuarioEditar({
                  ...usuarioEditar,
                  activo: e.target.value === "true",
                })
              }
            >
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>

            <label className="block mb-2 text-sm font-medium">
              Nueva Contraseña
            </label>
            <input
              type="password"
              className="input input-bordered w-full mb-4"
              placeholder="Dejar en blanco para no cambiar"
              value={usuarioEditar?.password || ""}
              onChange={(e) =>
                setUsuarioEditar({ ...usuarioEditar, password: e.target.value })
              }
            />
            <div className="flex justify-end space-x-2">
              <button className="btn btn-outline btn-sm" onClick={cerrarModal}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleEditar}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Usuarios;
