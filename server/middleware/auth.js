const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    const decoded = jwt.verify(token, 'roua2904');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé aux admins" });
  }
  next();
};
