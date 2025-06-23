const express = require("express");
const {
  getInformeVentas,
  getUsuarios,
} = require("../controllers/adminController");
const router = express.Router();

router.get("/ventas", getInformeVentas);
router.get("/usuarios", getUsuarios);

module.exports = router;
