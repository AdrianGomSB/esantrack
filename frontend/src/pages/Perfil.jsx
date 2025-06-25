import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axios from "../utils/axiosConfig";
const Perfil = () => {
  const [perfil, setPerfil] = useState({
    nombre: "",
    username: "",
    password: "",
  });
  const [mensaje, setMensaje] = useState("");
  const usuarioActual = JSON.parse(localStorage.getItem("usuario"));

  useEffect(() => {
    if (usuarioActual) {
      setPerfil({
        nombre: usuarioActual.nombre,
        username: usuarioActual.username,
        password: "",
      });
    }
  }, []);

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        nombre: perfil.nombre,
        username: perfil.username,
      };

      if (perfil.password.trim()) {
        payload.password = perfil.password;
      }

      await axios.patch(`/users/${usuarioActual.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMensaje("Perfil actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setMensaje("Error al actualizar perfil.");
    }
  };

  return (
    <Layout titulo="Mi Perfil">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md mt-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Editar Perfil</h1>
        <p className="text-gray-600 text-center mb-6">
          Bienvenido,{" "}
          <span className="font-semibold">{usuarioActual.nombre}</span>. Aquí
          puedes actualizar tus datos personales.
        </p>
        {mensaje && (
          <div className="text-sm text-green-600 text-center mb-4">
            {mensaje}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre completo
            </label>
            <input
              name="nombre"
              className="input input-bordered w-full"
              value={perfil.nombre}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre de usuario
            </label>
            <input
              name="username"
              className="input input-bordered w-full"
              value={perfil.username}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Nueva contraseña
            </label>
            <input
              name="password"
              type="password"
              className="input input-bordered w-full"
              placeholder="Dejar en blanco para no cambiar"
              value={perfil.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-500">
              Equipo
            </label>
            <input
              className="input input-bordered w-full bg-gray-100 text-gray-600"
              value={usuarioActual.equipo}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-500">
              Rol
            </label>
            <input
              className="input input-bordered w-full bg-gray-100 text-gray-600"
              value={usuarioActual.role}
              disabled
            />
          </div>

          <button
            className="btn btn-primary w-full mt-4"
            onClick={handleGuardar}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Perfil;
