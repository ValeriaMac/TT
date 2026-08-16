// auth.rutas.js
const express = require('express');
const router = express.Router();
const { registrarUsuario, iniciarSesion, obtenerPerfil } = require('../controladores/auth.controlador');
const verificarToken = require('../middlewares/auth.middleware');
router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);
router.get('/perfil', verificarToken, obtenerPerfil); // protegida

module.exports = router;