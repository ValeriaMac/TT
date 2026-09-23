import { defineStore } from 'pinia';
import api from '../servicios/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        usuario: JSON.parse(localStorage.getItem('usuario')) || null,
        token: localStorage.getItem('token') || null,
    }),

    getters: {
        estaAutenticado: (state) => !!state.token,
    },

    actions: {
        async registrar(datosFormulario) {
            // Ya NO inicia sesión sola: el backend no manda token hasta
            // que el correo (y, si es menor, el tutor) confirmen. Aquí
            // solo se manda el registro y se regresa el mensaje.
            const respuesta = await api.post('/auth/registro', datosFormulario);
            return respuesta.data;
        },

        async iniciarSesion(correo, contrasena) {
            const respuesta = await api.post('/auth/login', { correo, contrasena });
            this.guardarSesion(respuesta.data.usuario, respuesta.data.token);
            return respuesta.data;
        },

        async actualizarNombre(nombre) {
            const respuesta = await api.put('/auth/perfil', { nombre });
            // Se actualiza también lo que ya está guardado en el store,
            // para que el nombre nuevo aparezca de inmediato en toda la app
            // (por ejemplo, el saludo del Dashboard)
            this.usuario = { ...this.usuario, ...respuesta.data.usuario };
            localStorage.setItem('usuario', JSON.stringify(this.usuario));
            return respuesta.data;
        },

        async cambiarContrasena(contrasenaActual, contrasenaNueva) {
            const respuesta = await api.put('/auth/perfil/contrasena', {
                contrasenaActual,
                contrasenaNueva,
            });
            return respuesta.data;
        },

        async eliminarCuenta(contrasena) {
            const respuesta = await api.delete('/auth/perfil', { data: { contrasena } });
            this.cerrarSesion();
            return respuesta.data;
        },

        guardarSesion(usuario, token) {
            this.usuario = usuario;
            this.token = token;
            localStorage.setItem('usuario', JSON.stringify(usuario));
            localStorage.setItem('token', token);
        },

        cerrarSesion() {
            this.usuario = null;
            this.token = null;
            localStorage.removeItem('usuario');
            localStorage.removeItem('token');
        },
    },
});