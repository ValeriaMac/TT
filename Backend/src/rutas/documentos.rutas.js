const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');
const {
    crearDocumento,
    listarDocumentos,
    obtenerDocumento,
    actualizarDocumento,
    eliminarDocumento,
} = require('../controladores/documentosTexto.controlador');

router.post('/', verificarToken, crearDocumento);
router.get('/', verificarToken, listarDocumentos);
router.get('/:id', verificarToken, obtenerDocumento);
router.put('/:id', verificarToken, actualizarDocumento);
router.delete('/:id', verificarToken, eliminarDocumento);

module.exports = router;