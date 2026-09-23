<template>
  <div class="pagina-degradada">
    <div class="tarjeta-auth">
      <div class="estado-confirmacion">
        <div v-if="cargando" class="icono-correo">⏳</div>
        <div v-else-if="exito" class="icono-correo">✅</div>
        <div v-else class="icono-correo">❌</div>

        <h2>{{ cargando ? 'Confirmando tu correo...' : (exito ? '¡Correo confirmado!' : 'No se pudo confirmar') }}</h2>
        <p class="descripcion">{{ mensaje }}</p>

        <router-link v-if="exito" to="/login" class="btn-primario btn-enlace">Ir a iniciar sesión</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/servicios/api';

const route = useRoute();

const cargando = ref(true);
const exito = ref(false);
const mensaje = ref('');

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    mensaje.value = 'Este enlace no es válido.';
    cargando.value = false;
    return;
  }

  try {
    const respuesta = await api.get('/auth/verificar-correo', { params: { token } });
    mensaje.value = respuesta.data.mensaje;
    exito.value = true;
  } catch (error) {
    mensaje.value = error.response?.data?.mensaje || 'No se pudo confirmar tu correo.';
  } finally {
    cargando.value = false;
  }
});
</script>

<style scoped>
.pagina-degradada {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(to bottom right, #f8f9f5, #e8edd9, #d4e0b8);
}

.tarjeta-auth {
  background: var(--color-tarjeta);
  border-radius: var(--radio-tarjeta);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
}

.estado-confirmacion {
  text-align: center;
}

.icono-correo {
  font-size: 3rem;
  background: #f0f4e8;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.estado-confirmacion h2 {
  font-family: var(--fuente-encabezados);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.descripcion {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.btn-primario {
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  background-color: var(--color-primario);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
}

.btn-primario:hover {
  background-color: var(--color-primario-hover);
}

.btn-enlace {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}
</style>