const express = require("express");
const router = express.Router();
const { subirDocumento } = require("../controllers/documentosController");
// const { requireAuth } = require("../middlewares/auth"); // si aplica

router.post("/subir", /* requireAuth, */ ...subirDocumento);
module.exports = router;

const path = require("path");
const documentosRoutes = require("./routes/documentos");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/documentos", documentosRoutes);
