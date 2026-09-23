// auth.rutas.js
const express = require('express');
const router = express.Router();
const {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    actualizarNombre,
    cambiarContrasena,
    eliminarCuenta,
    verificarCorreo,
    confirmarTutor,
} = require('../controladores/auth.controlador');
const {
    solicitarRecuperacion,
    confirmarNuevaContrasena,
} = require('../controladores/recuperacion.controlador');
const verificarToken = require('../middlewares/auth.middleware');

router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarNombre);
router.put('/perfil/contrasena', verificarToken, cambiarContrasena);
router.delete('/perfil', verificarToken, eliminarCuenta);
router.post('/recuperar', solicitarRecuperacion);
router.post('/recuperar/confirmar', confirmarNuevaContrasena);
router.get('/verificar-correo', verificarCorreo);
router.get('/confirmar-tutor', confirmarTutor);

module.exports = router;