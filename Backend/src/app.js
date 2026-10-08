const express = require('express');
const cors = require('cors');
require('dotenv').config();

const lectorRutas = require('./rutas/lector.rutas');
const authRutas = require('./rutas/auth.rutas');
const configuracionRutas = require('./rutas/configuracion.rutas');
const escrituraRutas = require('./rutas/escritura.rutas');
const progresoRutas = require('./rutas/progreso.rutas');
const ejerciciosRutas = require('./rutas/ejercicios.rutas');
const documentosRutas = require('./rutas/documentos.rutas'); // Importar las rutas de documentos
const mascotasRutas = require('./rutas/mascotas.rutas');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CORS =====
// Solo se aceptan peticiones desde el frontend de la aplicación.
// FRONTEND_URL es la dirección del frontend (en producción, la de Vercel);
// CORS_ORIGENES permite agregar otras, separadas por coma (opcional).
const limpiar = (url) => url.trim().replace(/\/$/, '');
const origenesPermitidos = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGENES || '').split(','),
]
    .filter(Boolean)
    .map(limpiar);

// En desarrollo local también se permite el servidor de Vite
if (process.env.NODE_ENV !== 'production') {
    origenesPermitidos.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(
    cors({
        origin(origen, callback) {
            // Sin "origin" = peticiones que no vienen de un navegador (por ejemplo, pruebas con curl)
            if (!origen || origenesPermitidos.includes(limpiar(origen))) {
                return callback(null, true);
            }
            return callback(new Error('Origen no permitido por CORS'));
        },
    })
);
app.use(express.json());

// Rutas
app.use('/api/lector', lectorRutas);
app.use('/api/auth', authRutas);
app.use('/api/configuracion', configuracionRutas);
app.use('/api/escritura', escrituraRutas);
app.use('/api/progreso', progresoRutas);
app.use('/api/mascotas', mascotasRutas);
app.use('/api/ejercicios', ejerciciosRutas);
app.use('/api/documentos', documentosRutas);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor funcionando correctamente' });
});

// Ruta de salud: la usan Render y los monitores de disponibilidad (RNF_06)
app.get('/health', (req, res) => {
    res.json({ estado: 'ok', hora: new Date().toISOString() });
});

// Manejo de errores (por ejemplo, archivos que no son EPUB o que pesan más de 5 MB, RN_10)
app.use((error, req, res, next) => {
    if (error.message === 'Origen no permitido por CORS') {
        return res.status(403).json({ mensaje: error.message });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ mensaje: 'El archivo supera el máximo de 5 MB' });
    }
    if (error.message === 'Solo se permiten archivos EPUB') {
        return res.status(400).json({ mensaje: error.message });
    }
    console.error('Error no controlado:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
