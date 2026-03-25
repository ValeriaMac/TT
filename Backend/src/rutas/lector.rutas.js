const express = require('express');
const router = express.Router();
const subida = require('../middlewares/subida.middleware');
const {
    subirEpub,
    obtenerEpubs,
    obtenerUrlEpub,
    eliminarEpub
} = require('../controladores/lector.controlador');

// Subir un EPUB
router.post('/subir', subida.single('epub'), subirEpub);

// Obtener lista de EPUBs
router.get('/lista', obtenerEpubs);

// Obtener URL temporal de un EPUB
router.get('/url/:nombre', obtenerUrlEpub);

// Eliminar un EPUB
router.delete('/eliminar/:nombre', eliminarEpub);

module.exports = router;