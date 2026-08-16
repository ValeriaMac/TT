const express = require('express');
const cors = require('cors');
require('dotenv').config();

const lectorRutas = require('./rutas/lector.rutas');
const authRutas = require('./rutas/auth.rutas');   // 👈 se mueve aquí arriba, junto a lectorRutas

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/lector', lectorRutas);
app.use('/api/auth', authRutas);                   // 👈 se mueve aquí, junto a las demás rutas

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor funcionando correctamente' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});