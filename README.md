
# 🗂️ ESANTRACK App

Sistema integral de gestión de rutas, puntos georreferenciados y visitas, diseñado para equipos de campo corporativos y administrativos.

---

## 📌 Funcionalidades principales

- ✅ Gestión de rutas y puntos de visita
- 🗺️ Visualización de puntos en Google Maps
- 🗃️ Cartera de organizaciones (empresas, institutos, etc.)
- 📅 Calendario interactivo con FullCalendar
- 📊 KPIs dinámicos y exportación a PDF
- 🔍 Filtros avanzados por tipo, fecha, equipo, usuario, estado y progreso
- 🔐 Control de acceso por roles (admin, supervisor, user)
- 🧠 Justificación de puntos no completados

---

## 🛠️ Tecnologías

### Frontend
- React.js + Vite
- TailwindCSS
- Recharts (gráficos)
- FullCalendar
- Google Maps API
- Axios

### Backend
- Node.js + Express
- PostgreSQL
- JWT (autenticación)
- Multer (para subir archivos)
- CORS, dotenv, pg

---

## 🚀 Instalación y ejecución local

### 1. Clonar repositorio

```bash
git clone https://github.com/(ponees tu usuario aquí jeje)/backoffice-app.git
cd backoffice-app
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Crea un archivo `.env` con tus credenciales:

```
PORT=5000
DB_USER=(Tu user de bd)
DB_HOST=localhost
DB_DATABASE=(El nombre de tu bd)
DB_PASSWORD=(contraseña de tu bd)
DB_PORT=5432
JWT_SECRET=(Solo si usas JWT) - borralo sino
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Desarrollado por Adrian Gómez Sánchez – [@AdrianGomSB](https://github.com/AdrianGomSB)
