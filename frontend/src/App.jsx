import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Usuarios";
import Inicio from "./pages/Inicio";
import Visitas from "./pages/Visitas";
import Calendario from "./pages/Calendario";
import Rutas from "./pages/Rutas";
import Kpi from "./pages/Kpi";
import Organizacion from "./pages/Organizacion";
import RutaPrivada from "./components/RutaPrivada";
import Auditoria from "./pages/Auditoria";
import Perfil from "./pages/Perfil";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/inicio"
        element={
          <RutaPrivada>
            <Inicio />
          </RutaPrivada>
        }
      />
      <Route
        path="/visitas"
        element={
          <RutaPrivada>
            <Visitas />
          </RutaPrivada>
        }
      />
      <Route
        path="/calendario"
        element={
          <RutaPrivada>
            <Calendario />
          </RutaPrivada>
        }
      />
      <Route
        path="/rutas"
        element={
          <RutaPrivada>
            <Rutas />
          </RutaPrivada>
        }
      />
      <Route
        path="/kpi"
        element={
          <RutaPrivada>
            <Kpi />
          </RutaPrivada>
        }
      />
      <Route
        path="/organizacion"
        element={
          <RutaPrivada>
            <Organizacion />
          </RutaPrivada>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RutaPrivada>
            <Registro />
          </RutaPrivada>
        }
      />
      <Route
        path="/auditoria"
        element={
          <RutaPrivada>
            <Auditoria />
          </RutaPrivada>
        }
      />
      <Route
        path="/perfil"
        element={
          <RutaPrivada>
            <Perfil />
          </RutaPrivada>
        }
      />
    </Routes>
  );
}

export default App;
