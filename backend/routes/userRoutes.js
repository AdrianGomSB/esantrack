const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  actualizarUsuario,
  eliminarUsuario,
} = require("../controllers/userController");

const { verifyToken } = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/verificarRol");

router.get(
  "/",
  verifyToken,
  verificarRol(["admin", "supervisor"]),
  getAllUsers
);
router.patch(
  "/:id",
  verifyToken,
  verificarRol(["admin", "supervisor", "asesor"]),
  actualizarUsuario
);
router.delete("/:id", verifyToken, verificarRol(["admin"]), eliminarUsuario);

module.exports = router;
