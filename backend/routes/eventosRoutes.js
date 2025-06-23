const express = require("express");
const router = express.Router();
const {
  crearEvento,
  getEventos,
  getEventoPorId,
  editarEvento,
  eliminarEvento,
  getEventosAdmin,
  getEventosPorUsuario,
} = require("../controllers/eventosController");

const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getEventos);
router.get("/:id", verifyToken, getEventoPorId);
router.post("/", verifyToken, crearEvento);
router.put("/:id", verifyToken, editarEvento);
router.delete("/:id", verifyToken, eliminarEvento);

module.exports = router;
