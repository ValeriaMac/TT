<template>
  <div id="app">
    <nav v-if="authStore.estaAutenticado" class="navegacion-principal" aria-label="Navegación principal">
      <span class="nombre-usuario">Hola, {{ authStore.usuario?.nombre }}</span>
      <button @click="manejarCerrarSesion" aria-label="Cerrar sesión">Cerrar sesión</button>
    </nav>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from './store/auth.store'

const router = useRouter()
const authStore = useAuthStore()

function manejarCerrarSesion() {
  authStore.cerrarSesion()
  router.push('/login')
}
</script>

<style>
.navegacion-principal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f0f0f0;
}
.nombre-usuario {
  font-weight: bold;
}
</style>