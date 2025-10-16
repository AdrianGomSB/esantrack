const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../models/db");
const { registrarAuditoria } = require("./auditoriaController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "actas");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\-.]+/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== DOCX_MIME) {
      return cb(new Error("Solo se permiten archivos .docx"));
    }
    cb(null, true);
  },
});

const subirDocumento = [
  upload.single("archivo"),
  async (req, res) => {
    try {
      const { punto_id } = req.body;
      if (!punto_id || !req.file) {
        return res.status(400).json({ error: "Faltan datos" });
      }

      const puntoRes = await pool.query(
        `SELECT id, user_id, documento_url
           FROM puntos_ruta
          WHERE id = $1`,
        [punto_id]
      );

      if (puntoRes.rowCount === 0) {
        return res.status(404).json({ error: "Punto no encontrado" });
      }

      const punto = puntoRes.rows[0];

      if (punto.documento_url) {
        return res
          .status(409)
          .json({ error: "Este punto ya tiene un documento subido" });
      }

      const role = req.user?.role;
      const userId = req.user?.userId;
      const esDueno = String(punto.user_id) === String(userId);
      const esPrivilegiado = role === "admin" || role === "supervisor";
      if (!esPrivilegiado && !esDueno) {
        return res.status(403).json({ error: "Sin permisos para subir aquí" });
      }

      const file = req.file;
      const publicUrl = `/uploads/actas/${file.filename}`;

      const updateRes = await pool.query(
        `UPDATE puntos_ruta
            SET documento_url = $1,
                documento_nombre = $2,
                documento_mime = $3,
                documento_tamano = $4,
                documento_subido_en = NOW()
          WHERE id = $5
        RETURNING *`,
        [publicUrl, file.originalname, file.mimetype, file.size, punto_id]
      );

      await registrarAuditoria({
        usuario_id: userId,
        tabla: "puntos_ruta",
        registro_id: punto_id,
        campo: "documento_url",
        valor_anterior: punto.documento_url,
        valor_nuevo: publicUrl,
      });

      return res.json({
        ok: true,
        mensaje: "Documento subido correctamente",
        url: publicUrl,
        punto: updateRes.rows[0],
      });
    } catch (err) {
      console.error("Error al subir documento:", err);
      return res.status(500).json({ error: "Error al guardar el documento" });
    }
  },
];

module.exports = { subirDocumento };
