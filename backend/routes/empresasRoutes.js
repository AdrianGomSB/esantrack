const express = require("express");
const router = express.Router();
const {
  getEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  buscarEmpresasPorNombre,
} = require("../controllers/empresasController");

const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getEmpresas);
router.post("/", verifyToken, crearEmpresa);
router.put("/:id", verifyToken, actualizarEmpresa);
router.delete("/:id", verifyToken, eliminarEmpresa);
router.get("/buscar", verifyToken, buscarEmpresasPorNombre);

module.exports = router;
