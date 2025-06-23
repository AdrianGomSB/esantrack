import { Navigate } from "react-router-dom";

const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem("token");
  const usuario = localStorage.getItem("usuario");

  const usuarioValido = usuario ? JSON.parse(usuario) : null;

  if (!token || !usuarioValido) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RutaPrivada;
