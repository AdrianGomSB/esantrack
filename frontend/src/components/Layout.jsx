import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import clsx from "clsx";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCerrarSesion = () => {
    localStorage.clear();
    navigate("/");
  };

  const usuario = JSON.parse(localStorage.getItem("usuario")) || {};
  const navItems = [
    {
      label: "Auditoría",
      icon: "🔍",
      path: "/auditoria",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Calendario",
      icon: "📅",
      path: "/calendario",
      roles: ["user", "supervisor", "admin"],
    },
    {
      label: "Cartera",
      icon: "🗃️",
      path: "/organizacion",
      roles: ["user", "supervisor", "admin"],
    },
    {
      label: "Perfil",
      icon: "👤",
      path: "/perfil",
      roles: ["user", "supervisor", "admin"],
    },
    {
      label: "Resumen",
      icon: "📊",
      path: "/kpi",
      roles: ["supervisor", "admin"],
    },
    {
      label: "Rutas",
      icon: "🗺️",
      path: "/rutas",
      roles: ["user", "supervisor", "admin"],
    },
    {
      label: "Usuarios",
      icon: "➕",
      path: "/usuarios",
      roles: ["admin", "supervisor"],
    },
    {
      label: "Visitas",
      icon: "🧾",
      path: "/visitas",
      roles: ["user", "supervisor", "admin"],
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-gray-800 shadow-md border-r flex flex-col">
        {/* Logo */}
        <div className="p-4 flex justify-center items-center border-b border-gray-200">
          <Link to="/inicio" className="w-full h-12 flex justify-center">
            <img
              src={logo}
              alt="Logo"
              className="h-12 max-w-[140px] object-contain"
            />
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems
            .filter((item) => item.roles.includes(usuario.role?.toLowerCase()))
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "btn btn-ghost justify-start w-full text-left flex items-center gap-2 rounded-md",
                  location.pathname === item.path
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
        </nav>

        {/* Botón cerrar sesión */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="btn w-full bg-red-500 hover:bg-red-600 text-white border-none"
            onClick={handleCerrarSesion}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col bg-gray-50">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            Esantrack
          </h2>
          <div className="text-sm text-gray-600">
            👤 {usuario.nombre || "Usuario"}{" "}
            {usuario.equipo ? ` - ${usuario.equipo}` : ""}
          </div>
        </header>

        <section className="p-6 overflow-y-auto h-full w-full">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
