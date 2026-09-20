// Rutas del módulo de escritura

const { Router } = require('express');
const verificarToken = require('../middlewares/auth.middleware');
const { revisarOrtografia } = require('../controladores/escritura.controlador');

const router = Router();

router.post('/revisar', verificarToken, revisarOrtografia);

module.exports = router;