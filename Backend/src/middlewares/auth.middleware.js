const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const encabezadoAuth = req.headers['authorization'];

    if (!encabezadoAuth) {
        return res.status(401).json({ mensaje: 'No se proporcionó un token de acceso' });
    }

    // El encabezado viene como: "Bearer eyJhbGc..."
    const token = encabezadoAuth.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Formato de token inválido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, datosUsuario) => {
        if (error) {
            return res.status(403).json({ mensaje: 'Token inválido o expirado' });
        }
        // Guardamos el id del usuario en la petición, para usarlo en los controladores
        req.usuarioId = datosUsuario.id;
        next();
    });
}

module.exports = verificarToken;