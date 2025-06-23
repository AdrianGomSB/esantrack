const express = require("express");
const router = express.Router();
const { obtenerAuditoria } = require("../controllers/auditoriaController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, obtenerAuditoria);

module.exports = router;
