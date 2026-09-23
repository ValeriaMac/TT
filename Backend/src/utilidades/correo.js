// utilidades/correo.js
const nodemailer = require('nodemailer');

function crearTransportador() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USUARIO,
            pass: process.env.SMTP_CONTRASENA,
        },
    });
}

async function enviarCorreo({ para, asunto, html }) {
    const transportador = crearTransportador();
    await transportador.sendMail({
        from: process.env.SMTP_USUARIO,
        to: para,
        subject: asunto,
        html,
    });
}

module.exports = { enviarCorreo };