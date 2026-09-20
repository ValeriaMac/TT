import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

import Landing from '../vistas/Landing.vue';                  // 👈 NUEVO — página pública
import Login from '../vistas/Login.vue';
import Registro from '../vistas/Registro.vue';
import RecuperarContrasena from '../vistas/RecuperarContrasena.vue'; // 👈 NUEVO
import Inicio from '../vistas/Inicio.vue';                    // 👈 NUEVO — dashboard
import Lector from '../vistas/Lector.vue';
import ConfiguracionVisual from '../vistas/ConfiguracionVisual.vue';
import Escritura from '../vistas/Escritura.vue';
import MisDocumentos from '../componentes/MisDocumentos.vue';

const rutas = [
    {
        path: '/',
        name: 'landing',
        component: Landing, // página pública, sin meta: la ve cualquiera
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { requiereInvitado: true },
    },
    {
        path: '/registro',
        name: 'registro',
        component: Registro,
        meta: { requiereInvitado: true },
    },
    {
        path: '/recuperar',
        name: 'recuperar',
        component: RecuperarContrasena,
        meta: { requiereInvitado: true },
    },
    {
        path: '/inicio',
        name: 'inicio',
        component: Inicio,
        meta: { requiereAutenticacion: true },
    },
    {
        path: '/lectura',
        name: 'lectura',
        component: Lector,
        meta: { requiereAutenticacion: true },
    },
    {
        path: '/documentos',
        name: 'documentos',
        component: MisDocumentos,
        meta: { requiereAutenticacion: true },
    },
    {
        path: '/configuracion',
        name: 'configuracion',
        component: ConfiguracionVisual,
        meta: { requiereAutenticacion: true },
    },
    {
        path: '/escritura',
        name: 'escritura',
        component: Escritura,
        meta: { requiereAutenticacion: true },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes: rutas,
});

router.beforeEach((rutaDestino, rutaOrigen, next) => {
    const authStore = useAuthStore();

    if (rutaDestino.meta.requiereAutenticacion && !authStore.estaAutenticado) {
        next('/login');
    } else if (rutaDestino.meta.requiereInvitado && authStore.estaAutenticado) {
        next('/inicio');
    } else if (rutaDestino.name === 'landing' && authStore.estaAutenticado) {
        // Si ya inició sesión y entra a "/", lo mandamos directo al dashboard
        next('/inicio');
    } else {
        next();
    }
});

export default router;