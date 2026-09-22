const supabase = require('../config/supabase.cliente');

// Revuelve el orden de un arreglo (algoritmo Fisher-Yates), para que
// las preguntas no salgan siempre en el mismo orden en cada intento
function revolver(arreglo) {
    const copia = [...arreglo];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

const TOTAL_NIVELES = 5;
const SUBNIVELES_POR_NIVEL = 5; // 5 rondas perfectas seguidas por nivel para completarlo
const CANTIDAD_POR_RONDA = 5;

// Revisa el historial del usuario para este ejercicio y calcula en qué
// nivel y subnivel está. La regla es: una "ronda perfecta" (los 5
// aciertos) en un nivel cuenta como haber pasado un subnivel; al
// juntar 5 rondas perfectas en ese nivel, se pasa al siguiente.
async function determinarNivelYSubnivel(usuarioId, ejercicioId) {
    const { data: niveles, error: errorNiveles } = await supabase
        .from('niveles')
        .select('id, numero_nivel')
        .eq('ejercicio_id', ejercicioId)
        .order('numero_nivel', { ascending: true });

    if (errorNiveles) throw errorNiveles;

    const { data: resultados, error: errorResultados } = await supabase
        .from('resultados_ejercicio')
        .select('nivel_id, aciertos')
        .eq('usuario_id', usuarioId)
        .eq('ejercicio_id', ejercicioId);

    if (errorResultados) throw errorResultados;

    for (const nivel of niveles) {
        const rondasPerfectas = resultados.filter(
            (r) => r.nivel_id === nivel.id && r.aciertos === CANTIDAD_POR_RONDA
        ).length;

        if (rondasPerfectas < SUBNIVELES_POR_NIVEL) {
            return {
                nivelId: nivel.id,
                numeroNivel: nivel.numero_nivel,
                subnivel: rondasPerfectas + 1,
                ejercicioCompletado: false,
            };
        }
    }

    // Si llegó aquí, ya completó los 5 subniveles de los 5 niveles
    const ultimoNivel = niveles[niveles.length - 1];
    return {
        nivelId: ultimoNivel.id,
        numeroNivel: ultimoNivel.numero_nivel,
        subnivel: SUBNIVELES_POR_NIVEL,
        ejercicioCompletado: true,
    };
}

// GET /api/ejercicios/atrapa-error (protegida)
//
// Ya no recibe el nivel por parámetro: se calcula automáticamente
// según el progreso real del usuario en este ejercicio.
async function obtenerPreguntasAtrapaError(req, res) {
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
        // Ej.: con 25 preguntas y 5 por subnivel: subnivel 1 = posiciones
        // 0-4, subnivel 2 = posiciones 5-9, subnivel 3 = 10-14, etc.
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
async function verificarRespuestaAtrapaError(req, res) {
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

        // Comparación sin distinguir mayúsculas/acentos "duros": se
        // normaliza a minúsculas y se quitan espacios sobrantes
        const normalizar = (texto) => texto.trim().toLowerCase();
        const correcto = normalizar(respuesta) === normalizar(pregunta.respuesta_correcta);

        res.json({
            correcto,
            respuestaCorrecta: pregunta.respuesta_correcta,
            // Se manda solo si existe; el frontend la usa para resaltar
            // la palabra incorrecta después de 3 fallos seguidos
            palabraIncorrecta: pregunta.opciones?.palabra_incorrecta || null,
        });

    } catch (error) {
        console.error('Error al verificar respuesta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerPreguntasAtrapaError, verificarRespuestaAtrapaError };