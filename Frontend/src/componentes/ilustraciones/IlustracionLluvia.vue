<!--
  Demo animada de "Lluvia de letras".
  4 cuadros en bucle:
  1) caen varias letras y hay 3 corazones (vidas)
  2) el usuario atrapa la letra correcta ("b") y aparece el ✓
  3) caen letras otra vez
  4) el usuario atrapa una letra equivocada ("d"), aparece ✗ y pierde un corazón
  Y vuelve a empezar. Todo con CSS, sin JavaScript.
-->
<template>
  <div class="demo-lluvia" aria-hidden="true">
    <p class="meta">Atrapa la letra: <strong>b</strong></p>

    <div class="escenario">
      <!-- Cuadro 1: letras cayendo, vidas completas -->
      <div class="cuadro cuadro-1">
        <div class="vidas">❤️❤️❤️</div>
        <div class="letras">
          <span class="letra" style="left: 15%; top: 20%;">d</span>
          <span class="letra letra-objetivo" style="left: 45%; top: 45%;">b</span>
          <span class="letra" style="left: 75%; top: 15%;">p</span>
        </div>
      </div>

      <!-- Cuadro 2: atrapa la correcta -->
      <div class="cuadro cuadro-2">
        <div class="vidas">❤️❤️❤️</div>
        <div class="letras">
          <span class="letra letra-objetivo resaltada" style="left: 45%; top: 45%;">b</span>
        </div>
        <span class="cursor" style="left: 45%; top: 45%;">👆</span>
        <span class="resultado resultado-bien">✓</span>
      </div>

      <!-- Cuadro 3: caen letras de nuevo -->
      <div class="cuadro cuadro-3">
        <div class="vidas">❤️❤️❤️</div>
        <div class="letras">
          <span class="letra" style="left: 20%; top: 30%;">g</span>
          <span class="letra" style="left: 50%; top: 20%;">d</span>
          <span class="letra letra-objetivo" style="left: 72%; top: 48%;">b</span>
        </div>
      </div>

      <!-- Cuadro 4: atrapa la equivocada, pierde un corazón -->
      <div class="cuadro cuadro-4">
        <div class="vidas">❤️❤️🤍</div>
        <div class="letras">
          <span class="letra resaltada-error" style="left: 50%; top: 20%;">d</span>
        </div>
        <span class="cursor" style="left: 50%; top: 20%;">👆</span>
        <span class="resultado resultado-mal">✗</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Demo decorativa: no recibe props ni emite eventos, solo se anima sola con CSS.
</script>

<style scoped>
.demo-lluvia {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

.meta {
  text-align: center;
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: var(--color-texto, inherit);
}

.escenario {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 16px;
  background: var(--color-fondo-suave, rgba(37, 99, 235, 0.06));
  overflow: hidden;
}

.cuadro {
  position: absolute;
  inset: 0;
  opacity: 0;
  padding: 10px;
  box-sizing: border-box;
}

.vidas {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 1rem;
}

.letras {
  position: absolute;
  inset: 0;
}

.letra {
  position: absolute;
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--color-texto-suave, #888);
  transform: translate(-50%, -50%);
}

.letra-objetivo {
  color: var(--color-primario);
}

.letra.resaltada {
  color: var(--color-exito, #16a34a);
}

.letra.resaltada-error {
  color: var(--color-error, #dc2626);
}

.cursor {
  position: absolute;
  font-size: 1.6rem;
  transform: translate(-50%, 10%);
}

.resultado {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.8rem;
  font-weight: bold;
}

.resultado-bien {
  color: var(--color-exito, #16a34a);
}

.resultado-mal {
  color: var(--color-error, #dc2626);
}

/* Cada cuadro aparece y desaparece en su propio turno, como fotogramas de un GIF */
.cuadro-1 { animation: turno-1 8s infinite; }
.cuadro-2 { animation: turno-2 8s infinite; }
.cuadro-3 { animation: turno-3 8s infinite; }
.cuadro-4 { animation: turno-4 8s infinite; }

@keyframes turno-1 { 0%, 23% { opacity: 1; } 25%, 100% { opacity: 0; } }
@keyframes turno-2 { 0%, 25% { opacity: 0; } 27%, 48% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes turno-3 { 0%, 50% { opacity: 0; } 52%, 73% { opacity: 1; } 75%, 100% { opacity: 0; } }
@keyframes turno-4 { 0%, 75% { opacity: 0; } 77%, 98% { opacity: 1; } 100% { opacity: 0; } }

/* Si el usuario prefiere menos movimiento, se queda fijo en el primer cuadro */
@media (prefers-reduced-motion: reduce) {
  .cuadro { animation: none !important; opacity: 0; }
  .cuadro-1 { opacity: 1; }
}
</style>
