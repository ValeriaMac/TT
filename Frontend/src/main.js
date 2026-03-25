import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Lector from './vistas/Lector.vue'
import './assets/main.css'

const rutas = [
    {
        path: '/',
        component: Lector
    }
]

const enrutador = createRouter({
    history: createWebHistory(),
    routes: rutas
})

const app = createApp(App)
app.use(enrutador)
app.mount('#app')