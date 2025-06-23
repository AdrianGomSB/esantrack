const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      ...decoded,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

// Middleware opcional para admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Acceso solo para administradores" });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
};
