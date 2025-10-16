// routes/documentos.js
const express = require("express");
const router = express.Router();
const { subirDocumento } = require("../controllers/documentosController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/subir", verifyToken, ...subirDocumento);

module.exports = router;
