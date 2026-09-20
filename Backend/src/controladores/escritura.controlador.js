// Controlador del módulo de escritura (CU-SIS-10, RF_13, RF_14)

const { revisarTexto } = require('../utilidades/corrector');

// POST /api/escritura/revisar
// Body: { texto: "..." }
async function revisarOrtografia(req, res) {
    const { texto } = req.body;

    if (typeof texto !== 'string' || texto.trim().length === 0) {
        return res.status(400).json({
            mensaje: 'Debes enviar un texto para revisar.',
        });
    }

    const LIMITE_CARACTERES = 5000;
    if (texto.length > LIMITE_CARACTERES) {
        return res.status(400).json({
            mensaje: `El texto no puede superar los ${LIMITE_CARACTERES} caracteres.`,
        });
    }

    try {
        const errores = await revisarTexto(texto);
        res.json({ totalErrores: errores.length, errores });
    } catch (error) {
        console.error('Error al revisar el texto:', error);
        res.status(500).json({ mensaje: 'Ocurrió un error al revisar el texto.' });
    }
}

module.exports = { revisarOrtografia };