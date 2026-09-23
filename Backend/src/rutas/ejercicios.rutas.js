const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');

const atrapaError = require('../controladores/atrapaError.controlador');
const cronometro = require('../controladores/cronometro.controlador');
const tarjetas = require('../controladores/tarjetas.controlador');
const textoTrivia = require('../controladores/textoTrivia.controlador');
const lluvia = require('../controladores/lluvia.controlador');

// Atrapa el error (CU-EJ-03)
router.get('/atrapa-error', verificarToken, atrapaError.obtenerPreguntas);
router.post('/atrapa-error/verificar', verificarToken, atrapaError.verificarRespuesta);

// Cronómetro (CU-EJ-02)
router.get('/cronometro', verificarToken, cronometro.obtenerLectura);

// Tarjetas (CU-EJ-04)
router.get('/tarjetas', verificarToken, tarjetas.obtenerTarjetas);
router.post('/tarjetas/verificar', verificarToken, tarjetas.verificarTarjeta);

// Texto + trivia (CU-EJ-01)
router.get('/texto-trivia', verificarToken, textoTrivia.obtenerPreguntas);
router.post('/texto-trivia/verificar', verificarToken, textoTrivia.verificarRespuesta);

// Lluvia (CU-EJ-05)
router.get('/lluvia', verificarToken, lluvia.obtenerConfiguracion);

module.exports = router;