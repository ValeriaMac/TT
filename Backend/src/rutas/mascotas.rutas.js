const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');
const {
    obtenerColeccion,
    registrarLibroAbierto,
    obtenerMascotaActiva,
    elegirMascotaActiva,
    equiparAccesorio,
} = require('../controladores/mascotas.controlador');

router.get('/', verificarToken, obtenerColeccion);
router.get('/activa', verificarToken, obtenerMascotaActiva);
router.put('/activa', verificarToken, elegirMascotaActiva);
router.put('/accesorios/:id/equipar', verificarToken, equiparAccesorio);
router.post('/registrar-lectura', verificarToken, registrarLibroAbierto);

module.exports = router;
