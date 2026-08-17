const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');
const {
    obtenerConfiguracion,
    actualizarConfiguracion,
    listarPlantillas,
    guardarPlantilla,
    aplicarPlantilla,
    eliminarPlantilla,
} = require('../controladores/configuracion.controlador');

// Todas estas rutas requieren sesión iniciada
router.get('/', verificarToken, obtenerConfiguracion);
router.put('/', verificarToken, actualizarConfiguracion);
router.get('/plantillas', verificarToken, listarPlantillas);
router.post('/plantillas', verificarToken, guardarPlantilla);
router.post('/plantillas/:id/aplicar', verificarToken, aplicarPlantilla);
router.delete('/plantillas/:id', verificarToken, eliminarPlantilla);

module.exports = router;