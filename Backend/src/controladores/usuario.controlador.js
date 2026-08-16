const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg'); // o tu conexión Sequelize, ajusta según tengas

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // la URL de conexión de Supabase
});

// Calcula si una fecha de nacimiento corresponde a un menor de edad
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

        // Validaciones básicas (RN_01: contraseña mínimo 8 caracteres, mayúscula, minúscula y número)
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
        const usuarioExistente = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({ mensaje: 'Este correo ya tiene una cuenta registrada' });
        }

        // Encriptar contraseña
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        // Insertar usuario nuevo
        const resultado = await pool.query(
            `INSERT INTO usuarios (nombre, correo, contrasena_hash, fecha_nacimiento, correo_tutor, aviso_privacidad_aceptado)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, correo, es_menor_edad`,
            [nombre, correo, contrasenaHash, fechaNacimiento, correoTutor || null, avisoPrivacidadAceptado || false]
        );

        const usuarioNuevo = resultado.rows[0];

        // Aplicar configuración visual predeterminada para dislexia (RF_23)
        await pool.query(
            `INSERT INTO configuracion_visual (usuario_id) VALUES ($1)`,
            [usuarioNuevo.id]
        );

        // Crear su registro de progreso general en ceros
        await pool.query(
            `INSERT INTO progreso_general (usuario_id) VALUES ($1)`,
            [usuarioNuevo.id]
        );

        // Generar token JWT
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

        const resultado = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);

        // Mensaje genérico a propósito, para no revelar si el correo existe o no (CU-SIS-02)
        if (resultado.rows.length === 0) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const usuario = resultado.rows[0];
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
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
            },
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

// GET /api/auth/perfil (ruta protegida, usa el middleware)
async function obtenerPerfil(req, res) {
    try {
        const resultado = await pool.query(
            `SELECT u.id, u.nombre, u.correo, u.fecha_registro, cv.*
             FROM usuarios u
             LEFT JOIN configuracion_visual cv ON cv.usuario_id = u.id
             WHERE u.id = $1`,
            [req.usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(resultado.rows[0]);

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { registrarUsuario, iniciarSesion, obtenerPerfil };