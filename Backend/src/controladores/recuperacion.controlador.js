// controladores/recuperacion.controlador.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const supabase = require('../config/supabase.cliente');
const { enviarCorreo } = require('../utilidades/correo');

const HORAS_VALIDEZ_TOKEN = 1;

// POST /api/auth/recuperar
// Body: { correo }
async function solicitarRecuperacion(req, res) {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({ mensaje: 'El correo es obligatorio' });
        }

        const { data: usuario } = await supabase
            .from('usuarios')
            .select('id, nombre')
            .eq('correo', correo)
            .maybeSingle();

        // Importante: se responde IGUAL exista o no ese correo, para
        // no revelar qué correos sí están registrados (esto es una
        // buena práctica de seguridad estándar)
        if (!usuario) {
            return res.json({ mensaje: 'Si el correo existe, se envió un enlace de recuperación.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const vencimiento = new Date(Date.now() + HORAS_VALIDEZ_TOKEN * 60 * 60 * 1000);

        const { error: errorGuardar } = await supabase
            .from('usuarios')
            .update({ token_recuperacion: token, token_recuperacion_vence: vencimiento.toISOString() })
            .eq('id', usuario.id);

        if (errorGuardar) throw errorGuardar;

        const enlaceRecuperacion = `${process.env.FRONTEND_URL}/recuperar/confirmar?token=${token}`;

        await enviarCorreo({
            para: correo,
            asunto: 'Recupera tu contraseña — lex',
            html: `
                <p>Hola ${usuario.nombre},</p>
                <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por ${HORAS_VALIDEZ_TOKEN} hora:</p>
                <p><a href="${enlaceRecuperacion}">${enlaceRecuperacion}</a></p>
                <p>Si tú no pediste esto, puedes ignorar este correo.</p>
            `,
        });

        res.json({ mensaje: 'Si el correo existe, se envió un enlace de recuperación.' });

    } catch (error) {
        console.error('Error al solicitar recuperación:', error);
        // Ojo: si el error es de configuración de correo (credenciales
        // mal puestas en .env), este catch es el que lo va a atrapar
        res.status(500).json({ mensaje: 'No se pudo enviar el correo de recuperación. Verifica la configuración de SMTP.' });
    }
}

// POST /api/auth/recuperar/confirmar
// Body: { token, nuevaContrasena }
async function confirmarNuevaContrasena(req, res) {
    try {
        const { token, nuevaContrasena } = req.body;

        if (!token || !nuevaContrasena) {
            return res.status(400).json({ mensaje: 'Faltan datos' });
        }

        const regexContrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!regexContrasena.test(nuevaContrasena)) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
            });
        }

        const { data: usuario, error: errorBuscar } = await supabase
            .from('usuarios')
            .select('id, token_recuperacion_vence')
            .eq('token_recuperacion', token)
            .maybeSingle();

        if (errorBuscar || !usuario) {
            return res.status(400).json({ mensaje: 'El enlace no es válido o ya fue usado.' });
        }

        if (new Date(usuario.token_recuperacion_vence) < new Date()) {
            return res.status(400).json({ mensaje: 'El enlace ya venció. Solicita uno nuevo.' });
        }

        const nuevoHash = await bcrypt.hash(nuevaContrasena, 10);

        const { error: errorActualizar } = await supabase
            .from('usuarios')
            .update({
                contrasena_hash: nuevoHash,
                token_recuperacion: null,
                token_recuperacion_vence: null,
            })
            .eq('id', usuario.id);

        if (errorActualizar) throw errorActualizar;

        res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error('Error al confirmar nueva contraseña:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
}

module.exports = { solicitarRecuperacion, confirmarNuevaContrasena };