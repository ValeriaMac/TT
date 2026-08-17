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
            const respuesta = await api.post('/auth/registro', datosFormulario);
            this.guardarSesion(respuesta.data.usuario, respuesta.data.token);
            return respuesta.data;
        },

        async iniciarSesion(correo, contrasena) {
            const respuesta = await api.post('/auth/login', { correo, contrasena });
            this.guardarSesion(respuesta.data.usuario, respuesta.data.token);
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
