<template>
  <div id="app">
    <nav v-if="authStore.estaAutenticado" class="navegacion-principal" aria-label="Navegación principal">
      <span class="logo-app">lex</span>

      <div class="enlaces-nav">
        <router-link to="/inicio" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Inicio
        </router-link>

        <router-link to="/lectura" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Lectura
        </router-link>

        <router-link to="/escritura" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          Escritura
        </router-link>

        <router-link to="/ejercicios" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="19" cy="14" r="1"/></svg>
          Ejercicios
        </router-link>
        <router-link to="/documentos" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Documentos
        </router-link>
        <router-link to="/progreso" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Progreso
        </router-link>
        <span class="enlace-nav deshabilitado" title="Próximamente">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>
          Insignias
        </span>
        <router-link to="/configuracion" class="enlace-nav">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Configuración
        </router-link>
      </div>

      <div class="info-usuario">
        <router-link to="/perfil" class="nombre-usuario">👤 {{ authStore.usuario?.nombre }}</router-link>
        <button @click="manejarCerrarSesion" class="btn-secundario">Salir</button>
      </div>
    </nav>

    <main :class="{ 'con-nav-fijo': authStore.estaAutenticado }">
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 2rem;
  background-color: var(--color-tarjeta);
  border-bottom: 1px solid var(--color-borde);
}

.logo-app {
  font-size: 1.4rem;
}

.enlaces-nav {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.enlace-nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radio-boton);
  white-space: nowrap;
}

.enlace-nav.router-link-active {
  background-color: var(--color-primario);
  color: white;
}

.enlace-nav.deshabilitado {
  opacity: 0.4;
  cursor: not-allowed;
}

.info-usuario {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nombre-usuario {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
}

.nombre-usuario:hover {
  color: var(--color-primario);
}

main.con-nav-fijo {
  padding-top: 75px;
}
</style>