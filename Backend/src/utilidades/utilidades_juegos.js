// utilidades/utilidades_juegos.js
//
// Lógica COMPARTIDA por todos los ejercicios gamificados (Atrapa el
// error, Cronómetro, y los que sigan). Cada ejercicio tiene su propio
// controlador, pero todos usan estas mismas dos funciones para no
// repetir código.

const supabase = require('../config/supabase.cliente');

const SUBNIVELES_POR_NIVEL = 5; // 5 rondas perfectas seguidas por nivel para completarlo

// Revuelve el orden de un arreglo (algoritmo Fisher-Yates), para que
// el contenido no salga siempre en el mismo orden en cada intento
function revolver(arreglo) {
    const copia = [...arreglo];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// Revisa el historial del usuario para un ejercicio y calcula en qué
// nivel y subnivel está. Una "ronda perfecta" se define como haber
// sacado el puntaje máximo posible en esa ronda (100 puntos por
// defecto) — sirve igual para Atrapa el error (5 aciertos x 20 pts)
// que para Cronómetro (100 pts por leer dentro del rango esperado).
// Al juntar 5 rondas perfectas en un nivel, se pasa al siguiente.
async function determinarNivelYSubnivel(usuarioId, ejercicioId, puntosMaximosPorRonda = 100) {
    const { data: niveles, error: errorNiveles } = await supabase
        .from('niveles')
        .select('id, numero_nivel')
        .eq('ejercicio_id', ejercicioId)
        .order('numero_nivel', { ascending: true });

    if (errorNiveles) throw errorNiveles;

    const { data: resultados, error: errorResultados } = await supabase
        .from('resultados_ejercicio')
        .select('nivel_id, puntos_obtenidos')
        .eq('usuario_id', usuarioId)
        .eq('ejercicio_id', ejercicioId);

    if (errorResultados) throw errorResultados;

    for (const nivel of niveles) {
        const rondasPerfectas = resultados.filter(
            (r) => r.nivel_id === nivel.id && r.puntos_obtenidos === puntosMaximosPorRonda
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

// Reparte una lista de contenido (preguntas, tarjetas, lecturas...) en
// bloques exclusivos por subnivel, y regresa el bloque que le toca al
// subnivel actual, YA revuelto. El tamaño del bloque se calcula solo
// según cuánto contenido haya (no hace falta que cada ejercicio tenga
// exactamente el mismo número de elementos).
function obtenerBloqueDelSubnivel(items, subnivel, subnivelesPorNivel = SUBNIVELES_POR_NIVEL) {
    const tamanoBloque = Math.floor(items.length / subnivelesPorNivel) || 1;
    const inicio = (subnivel - 1) * tamanoBloque;
    const bloque = items.slice(inicio, inicio + tamanoBloque);
    return revolver(bloque);
}

module.exports = { revolver, determinarNivelYSubnivel, obtenerBloqueDelSubnivel, SUBNIVELES_POR_NIVEL };