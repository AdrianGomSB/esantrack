const express = require("express");
const router = express.Router();

const {
  crearPunto,
  getPuntosPorRuta,
  getPuntoPorId,
  eliminarPunto,
  editarPunto,
  getTodosLosPuntos,
  getPuntosCompletados,
  eliminarPuntosPorRuta,
} = require("../controllers/puntosRutaController");

const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/ruta/:ruta_id", verifyToken, getPuntosPorRuta);
router.get("/completados", verifyToken, getPuntosCompletados);
router.get("/", verifyToken, getTodosLosPuntos);
router.get("/:id", verifyToken, getPuntoPorId);

router.post("/", verifyToken, crearPunto);
router.put("/:id", verifyToken, editarPunto);
router.delete("/:id", verifyToken, eliminarPunto);
router.delete("/ruta/:ruta_id", verifyToken, eliminarPuntosPorRuta);

module.exports = router;
