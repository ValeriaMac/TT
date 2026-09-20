// Corrector ortográfico en español (RF_14, RT_02).
// Usa nspell (motor tipo Hunspell) con el diccionario dictionary-es.

const nspell = require('nspell');

// Palabras del dominio que el diccionario general no reconoce
const PALABRAS_PROPIAS = [
    'dislexia',
    'disléxico',
    'disléxica',
    'gamificación',
    'gamificado',
    'gamificada',
    'ortográfico',
    'ortográfica',
];

// dictionary-es es ESM-only; se carga con import() dinámico y se
// cachea para no repetir la carga en cada petición
let correctorListo = null;

async function obtenerCorrector() {
    if (correctorListo) return correctorListo;

    const { default: dictionary } = await import('dictionary-es');

    correctorListo = nspell(dictionary);
    PALABRAS_PROPIAS.forEach((palabra) => correctorListo.add(palabra));

    return correctorListo;
}

/**
 * Revisa un texto y regresa las palabras con posible error,
 * su posición en el texto y hasta 3 sugerencias por palabra.
 */
async function revisarTexto(texto) {
    const corrector = await obtenerCorrector();
    const errores = [];

    // Extrae cada palabra (letras + acentos + ñ) junto con su posición
    const expresionPalabra = /[a-záéíóúñü]+/gi;
    let coincidencia;

    while ((coincidencia = expresionPalabra.exec(texto)) !== null) {
        const palabra = coincidencia[0];
        const posicion = coincidencia.index;

        if (!corrector.correct(palabra)) {
            errores.push({
                palabra,
                posicion,
                sugerencias: corrector.suggest(palabra).slice(0, 3),
            });
        }
    }

    return errores;
}

module.exports = { revisarTexto };