<!-- componentes/MascotaConAccesorios.vue -->
<!-- Muestra la mascota y, encima, las imágenes de los accesorios equipados.
     Cada accesorio se coloca según su tipo (gorro en la cabeza, lentes en
     los ojos, corbata abajo...). Los valores están en la tabla POSICIONES
     del <script>, se pueden ajustar ahí sin tocar la base de datos. -->
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
      class="accesorio-img"
      :style="estiloAccesorio(accesorio)"
      :src="accesorio.imagen_url"
      :alt="accesorio.nombre"
    />
  </div>
</template>

<script setup>
// ===== Dónde se coloca cada accesorio =====
// top:   distancia desde arriba de la mascota, en % (negativo = sobresale)
// ancho: tamaño del accesorio, en % del ancho de la mascota
// left:  centro horizontal, en % (50 = justo en medio)
// Se busca por la clave del accesorio (ej. "acc_06_gorros"); si no hay una
// específica, se usa la del tipo (por una palabra de la clave) y, si
// tampoco, la de "defecto".
const POSICIONES = {
  // ===== Por tipo (palabra que aparece en la clave) =====
  corona:    { top: -6,  ancho: 52, left: 50 },
  birrete:   { top: -8,  ancho: 68, left: 50 },
  boina:     { top: -2,  ancho: 62, left: 50 },
  paliacate: { top: 0,   ancho: 64, left: 50 },
  gorros:    { top: -4,  ancho: 58, left: 50 },
  sombrero:  { top: -10, ancho: 76, left: 50 },  // incluye sheriff y bruja
  navidad:   { top: -4,  ancho: 60, left: 50 },
  lentes:    { top: 32,  ancho: 58, left: 50 },
  bigote:    { top: 52,  ancho: 36, left: 50 },
  corbata:   { top: 68,  ancho: 38, left: 50 },  // lo más parecido a una bufanda

  // ===== Por accesorio en particular (le gana al tipo) =====
  // Descomenta una línea y cambia los números para mover solo ese accesorio.
  // acc_04_lentes:  { top: 32, ancho: 58, left: 50 },
  // acc_11_lentes:  { top: 32, ancho: 58, left: 50 },
  // acc_17_lentes:  { top: 32, ancho: 58, left: 50 },
  // acc_20_lentes:  { top: 32, ancho: 58, left: 50 },
  // acc_22_lentes:  { top: 32, ancho: 58, left: 50 },
  // acc_06_gorros:  { top: -4, ancho: 58, left: 50 },
  // acc_08_gorros:  { top: -4, ancho: 58, left: 50 },
  // acc_13_gorros:  { top: -4, ancho: 58, left: 50 },
  // acc_15_gorros:  { top: -4, ancho: 58, left: 50 },
  // acc_16_gorros:  { top: -4, ancho: 58, left: 50 },
  // acc_12_sombrero:         { top: -10, ancho: 76, left: 50 },
  // acc_18_sombrero:         { top: -10, ancho: 76, left: 50 },
  // acc_19_sombrero:         { top: -10, ancho: 76, left: 50 },
  // acc_07_sombrero_sheriff: { top: -10, ancho: 76, left: 50 },
  // acc_09_sombrero_bruja:   { top: -14, ancho: 76, left: 50 },
  // acc_14_corona:    { top: -6, ancho: 52, left: 50 },
  // acc_03_birrete:   { top: -8, ancho: 68, left: 50 },
  // acc_10_boina:     { top: -2, ancho: 62, left: 50 },
  // acc_05_paliacate: { top: 0,  ancho: 64, left: 50 },
  // acc_02_bigote:    { top: 52, ancho: 36, left: 50 },
  // acc_01_corbata:   { top: 68, ancho: 38, left: 50 },
  // acc_21_navidad:   { top: -4, ancho: 60, left: 50 },

  defecto: { top: 20, ancho: 60, left: 50 },
};

function posicionDe(accesorio) {
  const clave = accesorio.clave || '';
  if (POSICIONES[clave]) return POSICIONES[clave];
  const tipo = Object.keys(POSICIONES).find((k) => k !== 'defecto' && clave.includes(k));
  return tipo ? POSICIONES[tipo] : POSICIONES.defecto;
}

function estiloAccesorio(accesorio) {
  const pos = posicionDe(accesorio);
  return {
    top: pos.top + '%',
    left: pos.left + '%',
    width: pos.ancho + '%',
  };
}

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

/* El accesorio mide un % del ancho de la mascota y se centra en su "left" */
.accesorio-img {
  position: absolute;
  height: auto;
  transform: translateX(-50%);
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