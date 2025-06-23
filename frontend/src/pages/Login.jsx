// src/pages/Login.jsx
import { useState } from "react";
import axios from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );
      const { token, usuario } = res.data; // 🔹 asegúrate de usar "usuario" como en el backend

      const decoded = JSON.parse(atob(token.split(".")[1]));

      localStorage.setItem("token", token);
      localStorage.setItem("userId", decoded.userId);
      localStorage.setItem("role", decoded.role);

      localStorage.setItem("usuario", JSON.stringify(usuario));

      navigate("/inicio");
    } catch (err) {
      console.error(
        "Error al iniciar sesión:",
        err.response?.data || err.message
      );
      setError("Credenciales inválidas");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center font-mono bg-base-200">
      <form onSubmit={handleSubmit} className="flex shadow-2xl">
        <div className="flex flex-col items-center justify-center text-center p-10 gap-6 bg-white rounded-2xl w-96">
          <h1 className="text-4xl font-bold">Bienvenido</h1>
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-lg">Usuario</span>
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-lg">Contraseña</span>
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="******"
              required
            />
          </div>

          <label className="label cursor-pointer gap-2">
            <input type="checkbox" className="checkbox" />
            <span className="label-text text-sm">Recordar contraseña</span>
          </label>

          <button
            type="submit"
            className="btn btn-error w-full text-white text-lg"
          >
            Iniciar Sesión
          </button>
        </div>
      </form>
    </section>
  );
}

export default Login;
