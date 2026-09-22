const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');

const atrapaError = require('../controladores/atrapaError.controlador');
const cronometro = require('../controladores/cronometro.controlador');

// Atrapa el error (CU-EJ-03)
router.get('/atrapa-error', verificarToken, atrapaError.obtenerPreguntas);
router.post('/atrapa-error/verificar', verificarToken, atrapaError.verificarRespuesta);

// Cronómetro (CU-EJ-02)
router.get('/cronometro', verificarToken, cronometro.obtenerLectura);

module.exports = router;