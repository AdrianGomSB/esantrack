const express = require("express");
const router = express.Router();

const {
  getVisitas,
  crearVisita,
  editarVisita,
  eliminarVisita,
  getVisitasAdmin,
  getVisitaPorId,
} = require("../controllers/visitasController");

const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

router.get("/admin/all", verifyToken, isAdmin, getVisitasAdmin);
router.get("/:id", verifyToken, getVisitaPorId);
router.get("/", verifyToken, getVisitas);
router.post("/", verifyToken, crearVisita);
router.put("/:id", verifyToken, editarVisita);
router.delete("/:id", verifyToken, eliminarVisita);

module.exports = router;
