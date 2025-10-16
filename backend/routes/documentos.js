// routes/documentos.js
const express = require("express");
const router = express.Router();
const { subirDocumento } = require("../controllers/documentosController");
const { requireAuth } = require("../middlewares/authMiddleware");

router.post("/subir", requireAuth, ...subirDocumento);

module.exports = router;
