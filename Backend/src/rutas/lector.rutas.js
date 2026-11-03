const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');
const subida = require('../middlewares/subida.middleware');
const {
    subirEpub,
    obtenerEpubs,
    obtenerUrlEpub,
    eliminarEpub
} = require('../controladores/lector.controlador');

// Todas las rutas del lector piden token (RNF_08)

// Subir un EPUB
router.post('/subir', verificarToken, subida.single('epub'), subirEpub);

// Obtener lista de EPUBs del usuario
router.get('/lista', verificarToken, obtenerEpubs);

// Obtener URL temporal de un EPUB del usuario
router.get('/url/:nombre', verificarToken, obtenerUrlEpub);

// Eliminar un EPUB del usuario
router.delete('/eliminar/:nombre', verificarToken, eliminarEpub);

module.exports = router;