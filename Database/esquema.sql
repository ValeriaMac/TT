-- ============================================
-- ESQUEMA 1 DE BASE DE DATOS 
-- ============================================

-- Usuarios (actor Lector) — RF_01, RF_02
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    es_menor_edad BOOLEAN DEFAULT FALSE,
    aviso_privacidad_aceptado BOOLEAN NOT NULL DEFAULT FALSE,
    correo_tutor VARCHAR(150),  -- obligatorio solo si es_menor_edad = TRUE
    fecha_registro TIMESTAMP DEFAULT NOW()
);

-- Regla de negocio: calcular si es menor de edad y validar correo del tutor
CREATE OR REPLACE FUNCTION validar_y_calcular_tutor()
RETURNS TRIGGER AS $$
BEGIN
    -- Determinar si es menor de edad al momento del registro/actualización
    NEW.es_menor_edad := NEW.fecha_nacimiento > (CURRENT_DATE - INTERVAL '18 years');

    IF NEW.es_menor_edad AND (NEW.correo_tutor IS NULL OR NEW.correo_tutor = '') THEN
        RAISE EXCEPTION 'Los usuarios menores de edad requieren correo de un tutor';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_tutor
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION validar_y_calcular_tutor();

-- Configuración visual ACTIVA (una por usuario) — RF_05, RF_06, RF_07
CREATE TABLE configuracion_visual (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipografia VARCHAR(50) DEFAULT 'OpenDyslexic',
    tamano_fuente INTEGER DEFAULT 16 CHECK (tamano_fuente BETWEEN 12 AND 24),
    color_fondo VARCHAR(20) DEFAULT '#FFFFFF',
    color_texto VARCHAR(20) DEFAULT '#000000',
    espaciado VARCHAR(20) DEFAULT 'normal',
    resaltado_letras_confusas BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Plantillas guardadas (máximo 3 por usuario) — RF_08, RN_04
CREATE TABLE plantillas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    tipografia VARCHAR(50) NOT NULL,
    tamano_fuente INTEGER NOT NULL CHECK (tamano_fuente BETWEEN 12 AND 24),
    color_fondo VARCHAR(20) NOT NULL,
    color_texto VARCHAR(20) NOT NULL,
    espaciado VARCHAR(20) NOT NULL,
    resaltado_letras_confusas BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION validar_limite_plantillas()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM plantillas WHERE usuario_id = NEW.usuario_id) >= 3 THEN
        RAISE EXCEPTION 'Límite de 3 plantillas alcanzado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limite_plantillas
BEFORE INSERT ON plantillas
FOR EACH ROW EXECUTE FUNCTION validar_limite_plantillas();

-- Documentos EPUB — RF_12, RN_10
CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_storage VARCHAR(500) NOT NULL,
    tamano_kb INTEGER,
    fecha_subida TIMESTAMP DEFAULT NOW()
);

-- Catálogo de ejercicios — RF_15 a RF_18
CREATE TABLE ejercicios (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Niveles por ejercicio
CREATE TABLE niveles (
    id SERIAL PRIMARY KEY,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    numero_nivel INTEGER NOT NULL,
    cantidad_elementos INTEGER NOT NULL DEFAULT 5,
    UNIQUE (ejercicio_id, numero_nivel)
);

-- Banco de preguntas/contenido
CREATE TABLE banco_preguntas (
    id SERIAL PRIMARY KEY,
    nivel_id INTEGER NOT NULL REFERENCES niveles(id) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    opciones JSONB,
    respuesta_correcta VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Resultados de cada intento — RF_19
CREATE TABLE resultados_ejercicio (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES ejercicios(id),
    nivel_id INTEGER REFERENCES niveles(id),
    puntos_obtenidos INTEGER DEFAULT 0,
    aciertos INTEGER DEFAULT 0,
    errores INTEGER DEFAULT 0,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Catálogo de insignias — RF_20
CREATE TABLE insignias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    icono_url VARCHAR(500),
    condicion VARCHAR(255) NOT NULL
);

-- Insignias desbloqueadas por usuario
CREATE TABLE usuario_insignias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    insignia_id INTEGER NOT NULL REFERENCES insignias(id),
    fecha_obtenida TIMESTAMP DEFAULT NOW(),
    UNIQUE (usuario_id, insignia_id)
);

-- Progreso general / racha — RF_04
CREATE TABLE progreso_general (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    puntos_totales INTEGER DEFAULT 0,
    racha_actual INTEGER DEFAULT 0,
    racha_maxima INTEGER DEFAULT 0,
    ultima_actividad DATE
);

-- ============================================
-- DATOS INICIALES (catálogo)
-- ============================================

INSERT INTO ejercicios (clave, nombre, categoria, descripcion) VALUES
('CU-EJ-01', 'Texto + trivia', 'comprension', 'Lectura de texto corto con preguntas de opción múltiple'),
('CU-EJ-02', 'Cronómetro', 'fluidez', 'Lectura en voz alta contra tiempo esperado'),
('CU-EJ-03', 'Atrapa el error', 'ortografia', 'Identificar y corregir palabras mal escritas'),
('CU-EJ-04', 'Tarjetas de letras', 'diferenciacion', 'Clasificar letras similares deslizando tarjetas'),
('CU-EJ-05', 'Lluvia de letras', 'diferenciacion', 'Seleccionar la letra indicada mientras caen letras similares');

INSERT INTO niveles (ejercicio_id, numero_nivel, cantidad_elementos)
SELECT id, nivel, 5
FROM ejercicios, generate_series(1,3) AS nivel;

INSERT INTO insignias (nombre, descripcion, condicion) VALUES
('Primer paso', 'Completaste tu primer ejercicio', 'Completar 1 ejercicio de cualquier categoría'),
('Racha de 3', 'Practicaste 3 días seguidos', 'racha_actual >= 3'),
('Racha de 7', 'Practicaste 7 días seguidos', 'racha_actual >= 7'),
('Ronda perfecta', 'Completaste un ejercicio sin errores', 'errores = 0 en un resultado_ejercicio'),
('Lector veloz', 'Superaste el tiempo esperado en Cronómetro', 'Resultado favorable en CU-EJ-02'),
('Cazador de errores', 'Corregiste 20 errores ortográficos en total', 'Suma de aciertos en CU-EJ-03 >= 20'),
('Explorador', 'Probaste los 5 ejercicios al menos una vez', 'Registro en resultados_ejercicio para las 5 claves'),
('100 puntos', 'Alcanzaste 100 puntos totales', 'puntos_totales >= 100');
