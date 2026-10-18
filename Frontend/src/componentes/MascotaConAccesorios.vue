<!-- componentes/MascotaConAccesorios.vue -->
<!-- Muestra la mascota y, encima, las imágenes de los accesorios equipados.
     Las imágenes de los accesorios deben ser PNG transparentes del MISMO
     tamaño que la imagen de la mascota, para que se alineen solas. -->
<template>
  <div class="mascota-contenedor" :style="{ width: tamano + 'px', height: tamano + 'px' }">
    <!-- Mascota -->
    <img
      v-if="mascota?.imagen_url"
      class="capa mascota-img"
      :src="mascota.imagen_url"
      :alt="mascota.nombre"
    />
    <span v-else class="mascota-emoji" :style="{ fontSize: tamano * 0.8 + 'px' }">
      {{ mascota?.emoji_marcador || '🦉' }}
    </span>

    <!-- Accesorios puestos (uno encima de otro) -->
    <img
      v-for="accesorio in accesorios"
      :key="accesorio.id"
      class="capa accesorio-img"
      :src="accesorio.imagen_url"
      :alt="accesorio.nombre"
    />
  </div>
</template>

<script setup>
defineProps({
  mascota: { type: Object, default: null },
  accesorios: { type: Array, default: () => [] },
  tamano: { type: Number, default: 96 },
});
</script>

<style scoped>
.mascota-contenedor {
  position: relative;
  display: inline-block;
}

/* Todas las imágenes ocupan el mismo cuadro y se apilan */
.capa {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.mascota-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>