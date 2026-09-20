import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

import Login from '../vistas/Login.vue';
import Registro from '../vistas/Registro.vue';
import Lector from '../vistas/Lector.vue';
import ConfiguracionVisual from '../vistas/ConfiguracionVisual.vue';
import Escritura from '../vistas/Escritura.vue';


const rutas = [
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { requiereInvitado: true }, // solo accesible si NO tienes sesión
    },
    {
        path: '/registro',
        name: 'registro',
        component: Registro,
        meta: { requiereInvitado: true },
    },
    {
        path: '/',
        name: 'inicio',
        component: Lector, // por ahora la pantalla principal es el lector, luego agregamos un menú
        meta: { requiereAutenticacion: true }, // solo accesible si SÍ tienes sesión
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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes: rutas,
});

// Guardia de navegación: revisa antes de entrar a cada ruta
router.beforeEach((rutaDestino, rutaOrigen, next) => {
    const authStore = useAuthStore();

    if (rutaDestino.meta.requiereAutenticacion && !authStore.estaAutenticado) {
        // Quiere entrar a una ruta protegida sin sesión → lo manda a login
        next('/login');
    } else if (rutaDestino.meta.requiereInvitado && authStore.estaAutenticado) {
        // Ya tiene sesión pero intenta ver login/registro → lo manda al inicio
        next('/');
    } else {
        next(); // todo bien, lo deja pasar
    }
});

export default router;