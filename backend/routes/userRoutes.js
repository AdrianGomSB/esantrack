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
  (req, res, next) => {
    const usuarioIdToken = req.usuario.id;
    const usuarioIdParam = parseInt(req.params.id, 10);
    if (req.usuario.role === "admin") {
      return next();
    }
    if (usuarioIdToken === usuarioIdParam) {
      if ("role" in req.body || "equipo" in req.body) {
        return res
          .status(403)
          .json({ message: "No está permitido modificar rol o equipo" });
      }
      return next();
    }
    return res
      .status(403)
      .json({ message: "No autorizado para actualizar este usuario" });
  },
  actualizarUsuario
);

router.delete("/:id", verifyToken, verificarRol(["admin"]), eliminarUsuario);

module.exports = router;
