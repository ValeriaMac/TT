import { computed } from 'vue';
import { useConfiguracionStore } from '../store/configuracion.store';

export function useEstilosPersonalizacion() {
    const configuracionStore = useConfiguracionStore();

    const estilosPersonalizacion = computed(() => {
        const config = configuracionStore.config;

        if (!config) {
            return {
                fontFamily: 'OpenDyslexic',
                fontSize: '16pt',
                backgroundColor: '#FFFFFF',
                color: '#000000',
                letterSpacing: '0.02em',
                wordSpacing: '0.1em',
                lineHeight: 1.6,
            };
        }

        return {
            fontFamily: config.tipografia,
            fontSize: `${config.tamano_fuente}pt`,
            backgroundColor: config.color_fondo,
            color: config.color_texto,
            letterSpacing: `${config.espaciado_letras ?? 0.02}em`,
            wordSpacing: `${config.espaciado_palabras ?? 0.1}em`,
            lineHeight: config.espaciado_lineas ?? 1.6,
        };
    });

    // Envuelve en <span> las letras/números que el usuario marcó para resaltar,
    // usando el color que asignó a cada uno. Se usa en textos cortos como la vista previa.
    function resaltarCaracteres(texto, mapaColores) {
        if (!mapaColores || Object.keys(mapaColores).length === 0) return texto;

        return texto
            .split('')
            .map((caracter) => {
                const color = mapaColores[caracter.toLowerCase()];
                return color
                    ? `<span style="color:${color}; font-weight:600;">${caracter}</span>`
                    : caracter;
            })
            .join('');
    }

    return { estilosPersonalizacion, resaltarCaracteres };
}