// controladores/textoTrivia.controlador.js
//
// Mecánica: se muestra un texto de lectura, y 3 preguntas de opción
// múltiple sobre ese mismo texto. El texto va repetido dentro de
// "opciones" de cada pregunta (así no hace falta una tabla nueva
// para guardarlo aparte); el frontend solo lo muestra una vez.
const supabase = require('../config/supabase.cliente');
const { obtenerBloqueDelSubnivel, determinarNivelYSubnivel } = require('../utilidades/utilidades_juegos');

// GET /api/ejercicios/texto-trivia (protegida)
async function obtenerPreguntas(req, res) {
    try {
        const { data: ejercicio, error: errorEjercicio } = await supabase
            .from('ejercicios')
            .select('id')
            .eq('clave', 'CU-EJ-01')
            .single();

        if (errorEjercicio || !ejercicio) {
            return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
        }

        const progreso = await determinarNivelYSubnivel(req.usuarioId, ejercicio.id);

        const { data: preguntas, error: errorPreguntas } = await supabase
            .from('banco_preguntas')
            .select('id, enunciado, opciones')
            .eq('nivel_id', progreso.nivelId)
            .order('id', { ascending: true });

        if (errorPreguntas) throw errorPreguntas;

        // Cada subnivel tiene su propio bloque de 3 preguntas (las 3
        // preguntas de un mismo texto), sin cruzarse con los demás
        const bloqueDelSubnivel = obtenerBloqueDelSubnivel(preguntas, progreso.subnivel);

        // El texto de lectura es el mismo en las 3 preguntas del bloque,
        // así que se manda una sola vez, aparte
        const textoLectura = bloqueDelSubnivel[0]?.opciones?.texto_lectura || '';

        res.json({
            numeroNivel: progreso.numeroNivel,
            subnivel: progreso.subnivel,
            ejercicioCompletado: progreso.ejercicioCompletado,
            textoLectura,
            // NUNCA se manda la respuesta correcta aquí
            preguntas: bloqueDelSubnivel.map((p) => ({
                id: p.id,
                pregunta: p.enunciado,
                opciones: p.opciones?.opciones_respuesta || [],
            })),
        });

    } catch (error) {
        console.error('Error al obtener preguntas de trivia:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// POST /api/ejercicios/texto-trivia/verificar (protegida)
// Body: { preguntaId, respuesta }
async function verificarRespuesta(req, res) {
    try {
        const { preguntaId, respuesta } = req.body;

        if (!preguntaId || !respuesta) {
            return res.status(400).json({ mensaje: 'Faltan datos' });
        }

        const { data: pregunta, error } = await supabase
            .from('banco_preguntas')
            .select('respuesta_correcta')
            .eq('id', preguntaId)
            .single();

        if (error || !pregunta) {
            return res.status(404).json({ mensaje: 'Pregunta no encontrada' });
        }

        const normalizar = (texto) => texto.trim().toLowerCase();
        const correcto = normalizar(respuesta) === normalizar(pregunta.respuesta_correcta);

        res.json({ correcto, respuestaCorrecta: pregunta.respuesta_correcta });

    } catch (error) {
        console.error('Error al verificar respuesta de trivia:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerPreguntas, verificarRespuesta };
