const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const visitasRoutes = require("./routes/visitasRoutes");
const eventosRoutes = require("./routes/eventosRoutes");
const rutasRoutes = require("./routes/rutasRoutes");
const puntosRutaRoutes = require("./routes/puntosRutaRoutes");
const empresasRoutes = require("./routes/empresasRoutes");
const organizacionesRoutes = require("./routes/organizacionesRoutes");
const geocodificarRoute = require("./routes/geocodificarRoute");
const usersRoutes = require("./routes/userRoutes");
const auditoriaRoutes = require("./routes/auditoriaRoutes");

const app = express();

// ⚡ Usa regex para aceptar todos los subdominios .vercel.app y localhost
const allowedOrigins = [
  "http://localhost:5173",
  "https://esantrack.vercel.app",
  "https://esantrack-git-main-adrians-projects-b4e8c77f.vercel.app",
  "https://uesantrack.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/visitas", visitasRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/rutas", rutasRoutes);
app.use("/api/puntos_ruta", puntosRutaRoutes);
app.use("/api/empresas", empresasRoutes);
app.use("/api/organizaciones", organizacionesRoutes);
app.use("/api/geocodificar", geocodificarRoute);
app.use("/api/users", usersRoutes);
app.use("/api/auditoria", auditoriaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor en el puerto ${PORT}`);
});
