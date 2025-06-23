const express = require("express");
const router = express.Router();
const {
  getOrganizaciones,
  crearOrganizacion,
  buscarOrganizacionesPorNombre,
  actualizarOrganizacion,
  eliminarOrganizacion,
} = require("../controllers/organizacionesController");

const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getOrganizaciones);
router.get("/buscar", verifyToken, buscarOrganizacionesPorNombre);
router.post("/", verifyToken, crearOrganizacion);
router.put("/:id", verifyToken, actualizarOrganizacion);
router.delete("/:id", verifyToken, eliminarOrganizacion);

module.exports = router;
