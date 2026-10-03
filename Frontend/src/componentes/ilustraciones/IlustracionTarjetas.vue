<template>
  <div class="demo-tarjetas" aria-hidden="true">
    <p class="meta">Encuentra la letra: <strong>b</strong></p>

    <div class="escenario">
      <!-- Cuadro 1: tarjeta objetivo y sus dos botones de respuesta -->
      <div class="cuadro cuadro-1">
        <div class="tarjeta">b</div>
        <div class="opciones">
          <span class="opcion">b</span>
          <span class="opcion">d</span>
        </div>
      </div>

      <!-- Cuadro 2: flecha señala el botón correcto -->
      <div class="cuadro cuadro-2">
        <div class="tarjeta">b</div>
        <div class="opciones">
          <span class="opcion correcta">b</span>
          <span class="opcion">d</span>
        </div>
        <span class="flecha flecha-izquierda">⬅️</span>
        <span class="resultado resultado-bien">✓</span>
      </div>

      <!-- Cuadro 3: vuelve al estado inicial -->
      <div class="cuadro cuadro-3">
        <div class="tarjeta">b</div>
        <div class="opciones">
          <span class="opcion">b</span>
          <span class="opcion">d</span>
        </div>
      </div>

      <!-- Cuadro 4: flecha señala el botón incorrecto -->
      <div class="cuadro cuadro-4">
        <div class="tarjeta">b</div>
        <div class="opciones">
          <span class="opcion">b</span>
          <span class="opcion incorrecta">d</span>
        </div>
        <span class="flecha flecha-derecha">➡️</span>
        <span class="resultado resultado-mal">✗</span>
      </div>

      <!-- Cuadro 5: vuelve a intentar -->
      <div class="cuadro cuadro-5">
        <div class="tarjeta">b</div>
        <span class="aviso">Intenta de nuevo</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// Demo decorativa: no recibe props ni emite eventos, solo se anima sola con CSS.
</script>

<style scoped>
.demo-tarjetas {
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  padding: 12px;
  box-sizing: border-box;
}

.tarjeta {
  width: 60px;
  height: 72px;
  border-radius: 10px;
  background: var(--color-primario);
  color: white;
  font-size: 1.8rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.opciones {
  display: flex;
  gap: 14px;
}

.opcion {
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid var(--color-texto-suave, #ccc);
  border-radius: 8px;
  padding: 4px 16px;
  color: var(--color-texto-suave, #888);
}

.opcion.correcta {
  border-color: var(--color-exito, #16a34a);
  background: rgba(22, 163, 74, 0.15);
  color: var(--color-exito, #16a34a);
}

.opcion.incorrecta {
  border-color: var(--color-error, #dc2626);
  background: rgba(220, 38, 38, 0.1);
  color: var(--color-error, #dc2626);
}

.flecha {
  position: absolute;
  bottom: 28px;
  font-size: 1.4rem;
  animation: rebote-flecha 0.8s ease-in-out infinite;
}

.flecha-izquierda {
  left: 32%;
}

.flecha-derecha {
  right: 32%;
}

@keyframes rebote-flecha {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.resultado {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 1.6rem;
  font-weight: bold;
}

.resultado-bien {
  color: var(--color-exito, #16a34a);
}

.resultado-mal {
  color: var(--color-error, #dc2626);
}

.aviso {
  font-size: 0.85rem;
  color: var(--color-texto-suave, #888);
}

/* Cada cuadro aparece y desaparece en su propio turno, como fotogramas de un GIF */
.cuadro-1 { animation: turno-1 10s infinite; }
.cuadro-2 { animation: turno-2 10s infinite; }
.cuadro-3 { animation: turno-3 10s infinite; }
.cuadro-4 { animation: turno-4 10s infinite; }
.cuadro-5 { animation: turno-5 10s infinite; }

@keyframes turno-1 { 0%, 18% { opacity: 1; } 20%, 100% { opacity: 0; } }
@keyframes turno-2 { 0%, 20% { opacity: 0; } 22%, 38% { opacity: 1; } 40%, 100% { opacity: 0; } }
@keyframes turno-3 { 0%, 40% { opacity: 0; } 42%, 58% { opacity: 1; } 60%, 100% { opacity: 0; } }
@keyframes turno-4 { 0%, 60% { opacity: 0; } 62%, 78% { opacity: 1; } 80%, 100% { opacity: 0; } }
@keyframes turno-5 { 0%, 80% { opacity: 0; } 82%, 98% { opacity: 1; } 100% { opacity: 0; } }

/* Si el usuario prefiere menos movimiento, se queda fijo en el primer cuadro */
@media (prefers-reduced-motion: reduce) {
  .cuadro { animation: none !important; opacity: 0; }
  .cuadro-1 { opacity: 1; }
  .flecha { animation: none; }
}
</style>