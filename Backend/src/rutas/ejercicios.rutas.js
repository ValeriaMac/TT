const express = require('express');
const router = express.Router();
const {
    obtenerPreguntasAtrapaError,
    verificarRespuestaAtrapaError,
} = require('../controladores/ejercicios.controlador');
const verificarToken = require('../middlewares/auth.middleware');

router.get('/atrapa-error', verificarToken, obtenerPreguntasAtrapaError);
router.post('/atrapa-error/verificar', verificarToken, verificarRespuestaAtrapaError);

module.exports = router;