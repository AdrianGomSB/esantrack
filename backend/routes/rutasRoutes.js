const express = require("express");
const router = express.Router();
const {
  getRutas,
  getRutaPorId,
  getRutaPorEvento,
  crearRuta,
  editarRuta,
  eliminarRuta,
} = require("../controllers/rutasController");

const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/evento/:evento_id", verifyToken, getRutaPorEvento); 
router.get("/", verifyToken, getRutas);
router.get("/:id", verifyToken, getRutaPorId); 

router.post("/", verifyToken, crearRuta);
router.put("/:id", verifyToken, editarRuta);
router.delete("/:id", verifyToken, eliminarRuta);

module.exports = router;
