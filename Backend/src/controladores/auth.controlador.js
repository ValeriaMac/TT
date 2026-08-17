const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const supabase = require('../config/supabase.cliente');

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
            .select('id, nombre, correo, es_menor_edad')
            .single();

        if (errorInsertar) throw errorInsertar;

        // Configuración visual predeterminada (RF_23)
        await supabase.from('configuracion_visual').insert({ usuario_id: usuarioNuevo.id });

        // Progreso general en ceros
        await supabase.from('progreso_general').insert({ usuario_id: usuarioNuevo.id });

        const token = jwt.sign({ id: usuarioNuevo.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRA,
        });

        res.status(201).json({
            mensaje: 'Cuenta creada correctamente',
            token,
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

module.exports = { registrarUsuario, iniciarSesion, obtenerPerfil };