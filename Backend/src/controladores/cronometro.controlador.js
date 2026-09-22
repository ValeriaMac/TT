// controladores/cronometro.controlador.js
const supabase = require('../config/supabase.cliente');
const { revolver, determinarNivelYSubnivel, SUBNIVELES_POR_NIVEL } = require('../utilidades/utilidades_juegos');

// GET /api/ejercicios/cronometro (protegida)
//
// A diferencia de Atrapa el error, aquí cada ronda es UNA sola lectura,
// así que cada subnivel usa un bloque de lecturas (no de 5, se calcula
// según cuántas haya) y elige una al azar de ese bloque.
async function obtenerLectura(req, res) {
    try {
        // Si viene ?excluirId=X, es porque el usuario le dio "Intentar
        // de nuevo" y no queremos mostrarle el mismo texto otra vez
        const idAExcluir = req.query.excluirId ? parseInt(req.query.excluirId) : null;

        const { data: ejercicio, error: errorEjercicio } = await supabase
            .from('ejercicios')
            .select('id')
            .eq('clave', 'CU-EJ-02')
            .single();

        if (errorEjercicio || !ejercicio) {
            return res.status(404).json({ mensaje: 'Ejercicio no encontrado' });
        }

        const progreso = await determinarNivelYSubnivel(req.usuarioId, ejercicio.id);

        const { data: lecturas, error: errorLecturas } = await supabase
            .from('banco_preguntas')
            .select('id, enunciado, opciones')
            .eq('nivel_id', progreso.nivelId)
            .order('id', { ascending: true });

        if (errorLecturas) throw errorLecturas;

        // Cada subnivel tiene su propio bloque de lecturas exclusivo.
        // Dentro de ese bloque, se elige una AL AZAR en cada intento,
        // para no repetir siempre la misma lectura.
        const lecturasPorSubnivel = Math.floor(lecturas.length / SUBNIVELES_POR_NIVEL) || 1;
        const inicioBloque = (progreso.subnivel - 1) * lecturasPorSubnivel;
        let bloqueDelSubnivel = lecturas.slice(inicioBloque, inicioBloque + lecturasPorSubnivel);

        // Se descarta la lectura que ya se mostró, PERO solo si quedan
        // otras opciones en el bloque — si es la única, se deja (mejor
        // repetir que no mostrar nada)
        if (idAExcluir && bloqueDelSubnivel.length > 1) {
            const bloqueSinRepetir = bloqueDelSubnivel.filter((l) => l.id !== idAExcluir);
            if (bloqueSinRepetir.length > 0) bloqueDelSubnivel = bloqueSinRepetir;
        }

        const lectura = revolver(bloqueDelSubnivel)[0];

        if (!lectura) {
            return res.status(404).json({ mensaje: 'No hay lectura cargada para este subnivel.' });
        }

        res.json({
            lecturaId: lectura.id,
            enunciado: lectura.enunciado,
            rangoEsperado: lectura.opciones?.rango_ppm || [80, 100],
            numeroNivel: progreso.numeroNivel,
            subnivel: progreso.subnivel,
            ejercicioCompletado: progreso.ejercicioCompletado,
        });

    } catch (error) {
        console.error('Error al obtener la lectura:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { obtenerLectura };