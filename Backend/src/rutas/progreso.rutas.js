const express = require('express');
const router = express.Router();
const { obtenerProgreso, registrarResultado, obtenerHistorial } = require('../controladores/progreso.controlador');
const verificarToken = require('../middlewares/auth.middleware');

router.get('/', verificarToken, obtenerProgreso);
router.get('/historial', verificarToken, obtenerHistorial);
router.post('/resultado', verificarToken, registrarResultado);

module.exports = router;