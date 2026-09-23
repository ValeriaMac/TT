// controladores/tarjetas.controlador.js
//
// Mecánica: se muestran palabras una por una, cada una escrita
// correcta O incorrectamente (confusión visual: b/d, p/q, m/n). El
// usuario tiene que decidir rápido si está "Correcta" o "Incorrecta".
const supabase = require('../config/supabase.cliente');
const { revolver, determinarNivelYSubnivel } = require('../utilidades/utilidades_juegos');

const CANTIDAD_POR_RONDA = 10;

// GET /api/ejercicios/tarjetas (protegida)
async function obtenerTarjetas(req, res) {
    try {
        const { data: ejercicio, error: errorEjercicio } = await supabase
            .from('ejercicios')
            .select('id')
            .eq('clave', 'CU-EJ-04')
            .single();

        if (errorEjercicio || !ejercicio) {
            return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
        }

        const progreso = await determinarNivelYSubnivel(req.usuarioId, ejercicio.id);

        const { data: tarjetas, error: errorTarjetas } = await supabase
            .from('banco_preguntas')
            .select('id, enunciado, opciones')
            .eq('nivel_id', progreso.nivelId);

        if (errorTarjetas) throw errorTarjetas;

        // A diferencia de Atrapa el error, aquí NO se reparte en bloques
        // exclusivos por subnivel: es un ejercicio de práctica rápida
        // tipo flashcards, así que se sacan 10 al azar del banco
        // completo del nivel en cada ronda (puede repetir contenido
        // entre subniveles, y es intencional — ayuda a automatizar
        // el reconocimiento con la repetición).
        const seleccion = revolver(tarjetas).slice(0, CANTIDAD_POR_RONDA);

        res.json({
            numeroNivel: progreso.numeroNivel,
            subnivel: progreso.subnivel,
            ejercicioCompletado: progreso.ejercicioCompletado,
            // Se manda "palabra" y qué letra va en cada lado (para que
            // el botón diga "B/D", "P/Q" o "M/N" según la tarjeta) —
            // pero NUNCA el lado correcto, eso solo se sabe al llamar
            // a verificarTarjeta
            tarjetas: seleccion.map((t) => ({
                id: t.id,
                palabra: t.enunciado,
                letraIzquierda: t.opciones?.letra_izquierda || '',
                letraDerecha: t.opciones?.letra_derecha || '',
            })),
        });

    } catch (error) {
        console.error('Error al obtener tarjetas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// POST /api/ejercicios/tarjetas/verificar (protegida)
// Body: { tarjetaId, respuestaUsuario: 'correcto' | 'incorrecto' }
async function verificarTarjeta(req, res) {
    try {
        const { tarjetaId, respuestaUsuario } = req.body;

        if (!tarjetaId || !respuestaUsuario) {
            return res.status(400).json({ mensaje: 'Faltan datos' });
        }

        const { data: tarjeta, error } = await supabase
            .from('banco_preguntas')
            .select('enunciado, respuesta_correcta')
            .eq('id', tarjetaId)
            .single();

        if (error || !tarjeta) {
            return res.status(404).json({ mensaje: 'Tarjeta no encontrada' });
        }

        const correcto = respuestaUsuario === tarjeta.respuesta_correcta;

        res.json({
            correcto,
            respuestaCorrecta: tarjeta.respuesta_correcta,
            palabra: tarjeta.enunciado,
        });

    } catch (error) {
        console.error('Error al verificar tarjeta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerTarjetas, verificarTarjeta };