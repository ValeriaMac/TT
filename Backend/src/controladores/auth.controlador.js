const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const supabase = require('../config/supabase.cliente');
const { enviarCorreo } = require('../utilidades/correo');

async function enviarCorreoDeConfirmacion(usuario) {
    const token = crypto.randomBytes(32).toString('hex');

    await supabase
        .from('usuarios')
        .update({ token_verificacion: token })
        .eq('id', usuario.id);

    const enlace = `${process.env.FRONTEND_URL}/verificar-correo?token=${token}`;

    await enviarCorreo({
        para: usuario.correo,
        asunto: '¡Bienvenido a lex! Confirma tu correo',
        html: `
            <p>Hola ${usuario.nombre},</p>
            <p>Gracias por crear tu cuenta en lex. Confirma tu correo dando clic aquí:</p>
            <p><a href="${enlace}">${enlace}</a></p>
        `,
    });
}

async function enviarCorreoAlTutor(usuario) {
    const token = crypto.randomBytes(32).toString('hex');

    await supabase
        .from('usuarios')
        .update({ token_tutor: token })
        .eq('id', usuario.id);

    const enlace = `${process.env.FRONTEND_URL}/confirmar-tutor?token=${token}`;

    await enviarCorreo({
        para: usuario.correo_tutor,
        asunto: 'Se registró una cuenta de menor de edad en lex',
        html: `
            <p>Hola,</p>
            <p>Te escribimos porque tu correo fue registrado como tutor de <strong>${usuario.nombre}</strong>,
            quien acaba de crear una cuenta en lex, una aplicación de apoyo para personas con dislexia.</p>
            <p>Como parte de nuestro compromiso con la protección de datos de menores (LGDNNA), te pedimos
            confirmar que estás al tanto de este registro:</p>
            <p><a href="${enlace}">${enlace}</a></p>
            <p>Si no reconoces a esta persona o no autorizas el uso de tu correo con este fin,
            por favor contáctanos.</p>
        `,
    });
}

function calcularEsMenorEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad < 18;
}

// POST /api/auth/registro
async function registrarUsuario(req, res) {
    try {
        const { nombre, correo, contrasena, fechaNacimiento, correoTutor, avisoPrivacidadAceptado } = req.body;

        if (!nombre || !correo || !contrasena || !fechaNacimiento) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
        }

        const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!regexContrasena.test(contrasena)) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
            });
        }

        const esMenor = calcularEsMenorEdad(fechaNacimiento);
        if (esMenor && !correoTutor) {
            return res.status(400).json({
                mensaje: 'Los usuarios menores de edad deben proporcionar el correo de un tutor'
            });
        }

        // Verificar que el correo no exista ya
        const { data: usuarioExistente } = await supabase
            .from('usuarios')
            .select('id')
            .eq('correo', correo)
            .maybeSingle();

        if (usuarioExistente) {
            return res.status(409).json({ mensaje: 'Este correo ya tiene una cuenta registrada' });
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        // Insertar usuario nuevo (el trigger de la BD calcula es_menor_edad solo)
        const { data: usuarioNuevo, error: errorInsertar } = await supabase
            .from('usuarios')
            .insert({
                nombre,
                correo,
                contrasena_hash: contrasenaHash,
                fecha_nacimiento: fechaNacimiento,
                correo_tutor: correoTutor || null,
                aviso_privacidad_aceptado: avisoPrivacidadAceptado || false,
            })
            .select('id, nombre, correo, es_menor_edad, correo_tutor')
            .single();

        if (errorInsertar) throw errorInsertar;

        // Configuración visual predeterminada (RF_23)
        await supabase.from('configuracion_visual').insert({ usuario_id: usuarioNuevo.id });

        // Progreso general en ceros
        await supabase.from('progreso_general').insert({ usuario_id: usuarioNuevo.id });

        // Correo de confirmación al propio usuario (a todos, sean o no menores)
        await enviarCorreoDeConfirmacion(usuarioNuevo);

        // Si es menor de edad, además se le avisa al tutor — esto es
        // justo el mecanismo que respalda la factibilidad legal
        // documentada (LGDNNA Art. 76 y 101 Bis 2): el tutor se entera
        // de que se usó su correo para registrar a un menor.
        if (usuarioNuevo.es_menor_edad) {
            await enviarCorreoAlTutor(usuarioNuevo);
        }

        // IMPORTANTE: ya NO se manda un token de sesión aquí. Si se
        // mandara, confirmar el correo sería solo decorativo (el
        // usuario ya podría usar la cuenta sin haber confirmado nada).
        // Tiene que iniciar sesión después, y ahí sí se revisa que
        // ya haya confirmado (ver iniciarSesion).
        res.status(201).json({
            mensaje: usuarioNuevo.es_menor_edad
                ? 'Cuenta creada. Revisa tu correo para confirmarlo, y pídele a tu tutor que confirme el suyo también.'
                : 'Cuenta creada. Revisa tu correo para confirmarlo antes de iniciar sesión.',
            usuario: usuarioNuevo,
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// POST /api/auth/login
async function iniciarSesion(req, res) {
    try {
        const { correo, contrasena } = req.body;

        if (!correo || !contrasena) {
            return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios' });
        }

        const { data: usuario } = await supabase
            .from('usuarios')
            .select('*')
            .eq('correo', correo)
            .maybeSingle();

        if (!usuario) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        // Aquí es donde de verdad se exige la confirmación — sin esto,
        // los correos que se mandan al registrarse no bloquean nada.
        if (!usuario.correo_verificado) {
            return res.status(403).json({
                mensaje: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
                razon: 'correo_no_verificado',
            });
        }

        if (usuario.es_menor_edad && !usuario.tutor_confirmo) {
            return res.status(403).json({
                mensaje: 'Tu tutor todavía no confirma tu cuenta. Pídele que revise el correo que le enviamos.',
                razon: 'tutor_no_confirmo',
            });
        }

        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRA,
        });

        res.json({
            mensaje: 'Sesión iniciada correctamente',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/auth/perfil (protegida)
async function obtenerPerfil(req, res) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nombre, correo, fecha_registro, configuracion_visual(*)')
            .eq('id', req.usuarioId)
            .single();

        if (error || !data) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(data);

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// PUT /api/auth/perfil (protegida) — cambiar el nombre
async function actualizarNombre(req, res) {
    try {
        const { nombre } = req.body;

        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ mensaje: 'El nombre no puede estar vacío' });
        }

        const { data, error } = await supabase
            .from('usuarios')
            .update({ nombre: nombre.trim() })
            .eq('id', req.usuarioId)
            .select('id, nombre, correo')
            .single();

        if (error) throw error;

        res.json({ mensaje: 'Nombre actualizado correctamente', usuario: data });

    } catch (error) {
        console.error('Error al actualizar el nombre:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// PUT /api/auth/perfil/contrasena (protegida)
async function cambiarContrasena(req, res) {
    try {
        const { contrasenaActual, contrasenaNueva } = req.body;

        if (!contrasenaActual || !contrasenaNueva) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
        }

        const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!regexContrasena.test(contrasenaNueva)) {
            return res.status(400).json({
                mensaje: 'La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
            });
        }

        const { data: usuario, error: errorBuscar } = await supabase
            .from('usuarios')
            .select('contrasena_hash')
            .eq('id', req.usuarioId)
            .single();

        if (errorBuscar || !usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena_hash);
        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
        }

        const nuevoHash = await bcrypt.hash(contrasenaNueva, 10);

        const { error: errorActualizar } = await supabase
            .from('usuarios')
            .update({ contrasena_hash: nuevoHash })
            .eq('id', req.usuarioId);

        if (errorActualizar) throw errorActualizar;

        res.json({ mensaje: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// DELETE /api/auth/perfil (protegida)
//
// IMPORTANTE: esto borra la fila del usuario en "usuarios". Si las
// tablas relacionadas (configuracion_visual, progreso_general,
// documentos, plantillas, etc.) no tienen configurado ON DELETE
// CASCADE en Supabase, esas filas se quedarían huérfanas en vez de
// borrarse. Vale la pena confirmar eso directo en Supabase
// (Database > relaciones de la tabla usuarios) antes de dar esto
// por completamente terminado.
async function eliminarCuenta(req, res) {
    try {
        const { contrasena } = req.body;

        if (!contrasena) {
            return res.status(400).json({ mensaje: 'Debes confirmar tu contraseña' });
        }

        const { data: usuario, error: errorBuscar } = await supabase
            .from('usuarios')
            .select('contrasena_hash')
            .eq('id', req.usuarioId)
            .single();

        if (errorBuscar || !usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
        if (!contrasenaValida) {
            return res.status(401).json({ mensaje: 'La contraseña es incorrecta' });
        }

        const { error: errorEliminar } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', req.usuarioId);

        if (errorEliminar) throw errorEliminar;

        res.json({ mensaje: 'Cuenta eliminada correctamente' });

    } catch (error) {
        console.error('Error al eliminar la cuenta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/auth/verificar-correo?token=X
async function verificarCorreo(req, res) {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ mensaje: 'Falta el token' });

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('token_verificacion', token)
            .maybeSingle();

        if (error || !usuario) {
            return res.status(400).json({ mensaje: 'El enlace no es válido o ya fue usado.' });
        }

        await supabase
            .from('usuarios')
            .update({ correo_verificado: true, token_verificacion: null })
            .eq('id', usuario.id);

        res.json({ mensaje: 'Correo verificado correctamente.' });
    } catch (error) {
        console.error('Error al verificar correo:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/auth/confirmar-tutor?token=X
async function confirmarTutor(req, res) {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ mensaje: 'Falta el token' });

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('token_tutor', token)
            .maybeSingle();

        if (error || !usuario) {
            return res.status(400).json({ mensaje: 'El enlace no es válido o ya fue usado.' });
        }

        await supabase
            .from('usuarios')
            .update({ tutor_confirmo: true, token_tutor: null })
            .eq('id', usuario.id);

        res.json({ mensaje: `Confirmación registrada para la cuenta de ${usuario.nombre}.` });
    } catch (error) {
        console.error('Error al confirmar tutor:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    actualizarNombre,
    cambiarContrasena,
    eliminarCuenta,
    verificarCorreo,
    confirmarTutor,
};