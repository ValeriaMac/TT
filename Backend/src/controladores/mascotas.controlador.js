// controladores/mascotas.controlador.js
const supabase = require('../config/supabase.cliente');

// Se llama después de CUALQUIER acción que pueda desbloquear algo:
// terminar una ronda de ejercicio, guardar un documento, o abrir un
// libro. "contextoEjercicio" solo aplica cuando viene de un ejercicio
// (primeros_pasos/perfección/maestría dependen de CUÁL ejercicio fue);
// las demás condiciones (racha, escritura, lectura, variedad, puntos)
// se revisan siempre, sin importar qué las disparó — es más simple
// y evita que alguna se quede sin revisar por error.
async function revisarRecompensas(usuarioId, contextoEjercicio = null) {
    const recompensasNuevas = [];

    if (contextoEjercicio) {
        const { ejercicioClave, esPrimerResultado, fuePerfecta, ejercicioCompletado } = contextoEjercicio;

        if (esPrimerResultado) {
            const otorgada = await otorgarPorCondicion('mascotas', 'usuario_mascotas', 'mascota_id', usuarioId, {
                categoria: 'primeros_pasos',
                condicion_ejercicio: ejercicioClave,
            });
            if (otorgada) recompensasNuevas.push(otorgada);
        }

        if (fuePerfecta) {
            const otorgada = await otorgarPorCondicion('accesorios', 'usuario_accesorios', 'accesorio_id', usuarioId, {
                categoria: 'perfeccion',
                condicion_ejercicio: ejercicioClave,
            });
            if (otorgada) recompensasNuevas.push(otorgada);
        }

        if (ejercicioCompletado) {
            const otorgada = await otorgarPorCondicion('accesorios', 'usuario_accesorios', 'accesorio_id', usuarioId, {
                categoria: 'maestria',
                condicion_ejercicio: ejercicioClave,
            });
            if (otorgada) recompensasNuevas.push(otorgada);
        }
    }

    // Constancia: racha actual contra los 3 umbrales (3/7/30 días)
    const { data: progreso } = await supabase
        .from('progreso_general')
        .select('racha_actual, puntos_totales')
        .eq('usuario_id', usuarioId)
        .single();

    if (progreso) {
        const otorgadas = await otorgarPorUmbral('mascotas', 'usuario_mascotas', 'mascota_id', usuarioId, {
            categoria: 'constancia',
            columnaCondicion: 'condicion_racha_dias',
            valorActual: progreso.racha_actual,
        });
        recompensasNuevas.push(...otorgadas);

        // Puntos totales acumulados
        const otorgadasPuntos = await otorgarPorUmbral('accesorios', 'usuario_accesorios', 'accesorio_id', usuarioId, {
            categoria: 'puntos',
            columnaCondicion: 'condicion_puntos_totales',
            valorActual: progreso.puntos_totales,
        });
        recompensasNuevas.push(...otorgadasPuntos);
    }

    // Escritura: cuántos documentos de texto ha creado
    const { count: totalDocumentos } = await supabase
        .from('documentos_texto')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);

    const otorgadasEscritura = await otorgarPorUmbral('accesorios', 'usuario_accesorios', 'accesorio_id', usuarioId, {
        categoria: 'escritura',
        columnaCondicion: 'condicion_documentos_escritos',
        valorActual: totalDocumentos || 0,
    });
    recompensasNuevas.push(...otorgadasEscritura);

    // Lectura: cuántos libros DISTINTOS ha abierto
    const { count: totalLibros } = await supabase
        .from('usuario_libros_abiertos')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);

    const otorgadasLecturaMascota = await otorgarPorUmbral('mascotas', 'usuario_mascotas', 'mascota_id', usuarioId, {
        categoria: 'lectura',
        columnaCondicion: 'condicion_libros_leidos',
        valorActual: totalLibros || 0,
    });
    recompensasNuevas.push(...otorgadasLecturaMascota);

    const otorgadasLecturaAccesorio = await otorgarPorUmbral('accesorios', 'usuario_accesorios', 'accesorio_id', usuarioId, {
        categoria: 'lectura',
        columnaCondicion: 'condicion_libros_leidos',
        valorActual: totalLibros || 0,
    });
    recompensasNuevas.push(...otorgadasLecturaAccesorio);

    // Variedad: ¿ya completó al menos 1 ronda en los 5 ejercicios gamificados?
    const { data: ejerciciosConResultado } = await supabase
        .from('resultados_ejercicio')
        .select('ejercicio_id')
        .eq('usuario_id', usuarioId);

    const ejerciciosDistintos = new Set((ejerciciosConResultado || []).map((r) => r.ejercicio_id));
    if (ejerciciosDistintos.size >= 5) {
        const otorgada = await otorgarPorCondicion('accesorios', 'usuario_accesorios', 'accesorio_id', usuarioId, {
            categoria: 'variedad',
            condicion_variedad_ejercicios: true,
        });
        if (otorgada) recompensasNuevas.push(otorgada);
    }

    return recompensasNuevas;
}

// Otorga UNA recompensa que cumpla exactamente los filtros dados
// (usado para condiciones "de una sola vez", como primeros_pasos o
// bienvenida)
async function otorgarPorCondicion(tabla, tablaUsuario, columnaId, usuarioId, filtros) {
    let consulta = supabase.from(tabla).select('*');
    for (const [columna, valor] of Object.entries(filtros)) {
        consulta = consulta.eq(columna, valor);
    }
    const { data: item } = await consulta.maybeSingle();
    if (!item) return null;

    const { data: yaLoTiene } = await supabase
        .from(tablaUsuario)
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq(columnaId, item.id)
        .maybeSingle();

    if (yaLoTiene) return null;

    await supabase.from(tablaUsuario).insert({ usuario_id: usuarioId, [columnaId]: item.id });
    return { tipo: tabla === 'mascotas' ? 'mascota' : 'accesorio', ...item };
}

// Otorga TODAS las recompensas de una categoría cuyo umbral numérico
// ya se alcanzó (usado para condiciones progresivas: racha, puntos,
// documentos escritos, libros leídos)
async function otorgarPorUmbral(tabla, tablaUsuario, columnaId, usuarioId, { categoria, columnaCondicion, valorActual }) {
    const otorgadas = [];

    const { data: candidatos } = await supabase
        .from(tabla)
        .select('*')
        .eq('categoria', categoria)
        .lte(columnaCondicion, valorActual);

    for (const item of candidatos || []) {
        const { data: yaLoTiene } = await supabase
            .from(tablaUsuario)
            .select('id')
            .eq('usuario_id', usuarioId)
            .eq(columnaId, item.id)
            .maybeSingle();

        if (!yaLoTiene) {
            await supabase.from(tablaUsuario).insert({ usuario_id: usuarioId, [columnaId]: item.id });
            otorgadas.push({ tipo: tabla === 'mascotas' ? 'mascota' : 'accesorio', ...item });
        }
    }

    return otorgadas;
}

// POST /api/mascotas/registrar-lectura (protegida)
// Body: { nombreArchivo }
// Se llama desde VistaLector.vue cada vez que se abre un EPUB real
// (no el texto de demostración). Si ya se había abierto antes, no
// pasa nada (el UNIQUE de la tabla lo evita).
async function registrarLibroAbierto(req, res) {
    try {
        const { nombreArchivo } = req.body;
        if (!nombreArchivo) {
            return res.status(400).json({ mensaje: 'Falta el nombre del archivo' });
        }

        await supabase
            .from('usuario_libros_abiertos')
            .upsert(
                { usuario_id: req.usuarioId, nombre_archivo: nombreArchivo },
                { onConflict: 'usuario_id,nombre_archivo', ignoreDuplicates: true }
            );

        const recompensasNuevas = await revisarRecompensas(req.usuarioId);

        res.json({ mensaje: 'Lectura registrada', recompensasNuevas });
    } catch (error) {
        console.error('Error al registrar libro abierto:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/mascotas (protegida) — todo el catálogo, marcando qué ya
// tiene el usuario, cuál es su mascota activa y qué accesorios trae puestos
async function obtenerColeccion(req, res) {
    try {
        const { data: todasMascotas } = await supabase.from('mascotas').select('*').order('id');
        const { data: todosAccesorios } = await supabase.from('accesorios').select('*').order('id');
        const { data: mascotasUsuario } = await supabase
            .from('usuario_mascotas')
            .select('mascota_id, fecha_obtenida')
            .eq('usuario_id', req.usuarioId);
        const { data: accesoriosUsuario } = await supabase
            .from('usuario_accesorios')
            .select('accesorio_id, fecha_obtenida, equipado')
            .eq('usuario_id', req.usuarioId);
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('mascota_activa_id')
            .eq('id', req.usuarioId)
            .single();

        const idsMascotasObtenidas = new Map((mascotasUsuario || []).map((m) => [m.mascota_id, m.fecha_obtenida]));
        const idsAccesoriosObtenidos = new Map((accesoriosUsuario || []).map((a) => [a.accesorio_id, { fecha: a.fecha_obtenida, equipado: a.equipado }]));

        res.json({
            mascotaActivaId: usuario?.mascota_activa_id || null,
            mascotas: (todasMascotas || []).map((m) => ({
                ...m,
                obtenida: idsMascotasObtenidas.has(m.id),
                fechaObtenida: idsMascotasObtenidas.get(m.id) || null,
            })),
            accesorios: (todosAccesorios || []).map((a) => ({
                ...a,
                obtenido: idsAccesoriosObtenidos.has(a.id),
                fechaObtenida: idsAccesoriosObtenidos.get(a.id)?.fecha || null,
                equipado: idsAccesoriosObtenidos.get(a.id)?.equipado || false,
            })),
        });
    } catch (error) {
        console.error('Error al obtener colección:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// Se llama desde iniciarSesion en auth.controlador.js, en CADA login
// exitoso. otorgarPorCondicion ya evita duplicados, así que en el
// login 2, 3, 4... simplemente no hace nada.
async function otorgarMascotaBienvenida(usuarioId) {
    const otorgada = await otorgarPorCondicion('mascotas', 'usuario_mascotas', 'mascota_id', usuarioId, {
        categoria: 'bienvenida',
    });

    // Si es la primera mascota que obtiene, se vuelve su mascota
    // activa automáticamente (para que el Dashboard nunca se vea
    // vacío). Si ya tenía una elegida, se respeta esa elección.
    if (otorgada) {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('mascota_activa_id')
            .eq('id', usuarioId)
            .single();

        if (usuario && !usuario.mascota_activa_id) {
            await supabase
                .from('usuarios')
                .update({ mascota_activa_id: otorgada.id })
                .eq('id', usuarioId);
        }
    }

    return otorgada;
}

// GET /api/mascotas/activa (protegida) — la mascota que se muestra
// en el Dashboard, junto con los accesorios que trae puestos
async function obtenerMascotaActiva(req, res) {
    try {
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('mascota_activa_id, mascotas:mascota_activa_id(*)')
            .eq('id', req.usuarioId)
            .single();

        const { data: accesoriosEquipados } = await supabase
            .from('usuario_accesorios')
            .select('accesorios(*)')
            .eq('usuario_id', req.usuarioId)
            .eq('equipado', true);

        res.json({
            mascotaActiva: usuario?.mascotas || null,
            accesoriosEquipados: (accesoriosEquipados || []).map((a) => a.accesorios),
        });
    } catch (error) {
        console.error('Error al obtener mascota activa:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// PUT /api/mascotas/activa (protegida)
// Body: { mascotaId }
async function elegirMascotaActiva(req, res) {
    try {
        const { mascotaId } = req.body;
        if (!mascotaId) {
            return res.status(400).json({ mensaje: 'Falta el id de la mascota' });
        }

        // Verifica que de verdad sea suya antes de dejarlo elegirla
        const { data: laTiene } = await supabase
            .from('usuario_mascotas')
            .select('id')
            .eq('usuario_id', req.usuarioId)
            .eq('mascota_id', mascotaId)
            .maybeSingle();

        if (!laTiene) {
            return res.status(403).json({ mensaje: 'Todavía no tienes esa mascota' });
        }

        await supabase
            .from('usuarios')
            .update({ mascota_activa_id: mascotaId })
            .eq('id', req.usuarioId);

        res.json({ mensaje: 'Mascota activa actualizada' });
    } catch (error) {
        console.error('Error al elegir mascota activa:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// PUT /api/mascotas/accesorios/:id/equipar (protegida)
// Body: { equipar: true | false }
async function equiparAccesorio(req, res) {
    try {
        const accesorioId = req.params.id;
        const { equipar } = req.body;

        // update...select().maybeSingle() en una sola consulta: si la
        // fila no era del usuario, el WHERE de usuario_id no encuentra
        // nada que actualizar y "actualizado" regresa null — así no
        // hace falta una consulta aparte solo para checar dueño.
        const { data: actualizado, error } = await supabase
            .from('usuario_accesorios')
            .update({ equipado: !!equipar })
            .eq('usuario_id', req.usuarioId)
            .eq('accesorio_id', accesorioId)
            .select('id')
            .maybeSingle();

        if (error) throw error;
        if (!actualizado) {
            return res.status(403).json({ mensaje: 'Todavía no tienes ese accesorio' });
        }

        res.json({ mensaje: equipar ? 'Accesorio equipado' : 'Accesorio quitado' });
    } catch (error) {
        console.error('Error al equipar accesorio:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = {
    revisarRecompensas,
    registrarLibroAbierto,
    obtenerColeccion,
    otorgarMascotaBienvenida,
    obtenerMascotaActiva,
    elegirMascotaActiva,
    equiparAccesorio,
};
