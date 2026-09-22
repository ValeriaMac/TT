// controladores/atrapaError.controlador.js
const supabase = require('../config/supabase.cliente');
const { revolver, determinarNivelYSubnivel } = require('../utilidades/utilidades_juegos');

const CANTIDAD_POR_RONDA = 5;

// GET /api/ejercicios/atrapa-error (protegida)
//
// El nivel/subnivel ya no se recibe por parámetro: se calcula
// automáticamente según el progreso real del usuario en este ejercicio.
async function obtenerPreguntas(req, res) {
    try {
        const { data: ejercicio, error: errorEjercicio } = await supabase
            .from('ejercicios')
            .select('id')
            .eq('clave', 'CU-EJ-03')
            .single();

        if (errorEjercicio || !ejercicio) {
            return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
        }

        const progreso = await determinarNivelYSubnivel(req.usuarioId, ejercicio.id);

        // Se ordena por id para que el reparto por subnivel sea siempre
        // el mismo bloque (no cambia entre peticiones)
        const { data: preguntas, error: errorPreguntas } = await supabase
            .from('banco_preguntas')
            .select('id, enunciado')
            .eq('nivel_id', progreso.nivelId)
            .order('id', { ascending: true });

        if (errorPreguntas) throw errorPreguntas;

        // Cada subnivel tiene su propio bloque de 5 oraciones, exclusivo
        // y sin cruzarse con los demás subniveles de este mismo nivel.
        const inicioBloque = (progreso.subnivel - 1) * CANTIDAD_POR_RONDA;
        const bloqueDelSubnivel = preguntas.slice(inicioBloque, inicioBloque + CANTIDAD_POR_RONDA);

        // Dentro de ese bloque fijo, sí se revuelve el ORDEN en que
        // aparecen, para que no se sientan siempre iguales al reintentar
        const seleccionAleatoria = revolver(bloqueDelSubnivel);

        res.json({
            nivelId: progreso.nivelId,
            numeroNivel: progreso.numeroNivel,
            subnivel: progreso.subnivel,
            ejercicioCompletado: progreso.ejercicioCompletado,
            preguntas: seleccionAleatoria,
        });

    } catch (error) {
        console.error('Error al obtener preguntas:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// POST /api/ejercicios/atrapa-error/verificar (protegida)
// Body: { preguntaId, respuesta }
async function verificarRespuesta(req, res) {
    try {
        const { preguntaId, respuesta } = req.body;

        if (!preguntaId || respuesta === undefined) {
            return res.status(400).json({ mensaje: 'Faltan datos' });
        }

        const { data: pregunta, error } = await supabase
            .from('banco_preguntas')
            .select('respuesta_correcta, opciones')
            .eq('id', preguntaId)
            .single();

        if (error || !pregunta) {
            return res.status(404).json({ mensaje: 'Pregunta no encontrada' });
        }

        // Comparación sin distinguir mayúsculas/acentos "duros"
        const normalizar = (texto) => texto.trim().toLowerCase();
        const correcto = normalizar(respuesta) === normalizar(pregunta.respuesta_correcta);

        res.json({
            correcto,
            respuestaCorrecta: pregunta.respuesta_correcta,
            palabraIncorrecta: pregunta.opciones?.palabra_incorrecta || null,
        });

    } catch (error) {
        console.error('Error al verificar respuesta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerPreguntas, verificarRespuesta };