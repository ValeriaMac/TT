const express = require('express');
const cors = require('cors');
require('dotenv').config();

const lectorRutas = require('./rutas/lector.rutas');
const authRutas = require('./rutas/auth.rutas');   
const configuracionRutas = require('./rutas/configuracion.rutas');
const escrituraRutas = require('./rutas/escritura.rutas');
const progresoRutas = require('./rutas/progreso.rutas');
const ejerciciosRutas = require('./rutas/ejercicios.rutas');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/lector', lectorRutas);
app.use('/api/auth', authRutas);  
app.use('/api/configuracion', configuracionRutas);
app.use('/api/escritura', escrituraRutas); 
app.use('/api/progreso', progresoRutas);
app.use('/api/ejercicios', ejerciciosRutas);
                
// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor funcionando correctamente' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

