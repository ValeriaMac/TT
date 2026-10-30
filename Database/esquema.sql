-- =====================================================================
-- Esquema de la base de datos — Aplicación web para personas con dislexia
-- Proyecto Supabase: APP_Dislexia (PostgreSQL)
--
-- Refleja la base REAL después de la migración "mascotas -> insignias":
--   * insignias / usuario_insignias (con la bandera "activa")
--   * ya no existe usuarios.mascota_activa_id (se quitó el bucle)
--
-- Uso: correrlo completo en un proyecto NUEVO (SQL Editor de Supabase).
-- No incluye: el contenido de banco_preguntas (365 filas) ni las URLs de
-- las imágenes (las llena Backend/src/scripts/subirImagenesFinales.js).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) USUARIOS Y CONFIGURACIÓN
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id                         SERIAL PRIMARY KEY,
    nombre                     VARCHAR NOT NULL,
    correo                     VARCHAR NOT NULL UNIQUE,
    contrasena_hash            VARCHAR NOT NULL,
    fecha_nacimiento           DATE    NOT NULL,
    es_menor_edad              BOOLEAN DEFAULT false,      -- lo calcula el trigger
    aviso_privacidad_aceptado  BOOLEAN NOT NULL DEFAULT false,
    correo_tutor               VARCHAR,
    fecha_registro             TIMESTAMP DEFAULT now(),
    token_recuperacion         VARCHAR,
    token_recuperacion_vence   TIMESTAMP,
    correo_verificado          BOOLEAN DEFAULT false,
    token_verificacion         VARCHAR,
    tutor_confirmo             BOOLEAN DEFAULT false,
    token_tutor                VARCHAR
);

CREATE TABLE configuracion_visual (
    id                         SERIAL PRIMARY KEY,
    usuario_id                 INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
    tipografia                 VARCHAR DEFAULT 'OpenDyslexic',
    tamano_fuente              INTEGER DEFAULT 16 CHECK (tamano_fuente >= 12 AND tamano_fuente <= 24),
    color_fondo                VARCHAR DEFAULT '#FFFFFF',
    color_texto                VARCHAR DEFAULT '#000000',
    espaciado                  VARCHAR DEFAULT 'normal',
    resaltado_letras_confusas  BOOLEAN DEFAULT true,
    fecha_actualizacion        TIMESTAMP DEFAULT now(),
    espaciado_letras           NUMERIC DEFAULT 0.02,
    espaciado_palabras         NUMERIC DEFAULT 0.10,
    espaciado_lineas           NUMERIC DEFAULT 1.60,
    letras_resaltadas          JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE plantillas (
    id                         SERIAL PRIMARY KEY,
    usuario_id                 INTEGER NOT NULL REFERENCES usuarios(id),
    nombre                     VARCHAR NOT NULL,
    tipografia                 VARCHAR NOT NULL,
    tamano_fuente              INTEGER NOT NULL CHECK (tamano_fuente >= 12 AND tamano_fuente <= 24),
    color_fondo                VARCHAR NOT NULL,
    color_texto                VARCHAR NOT NULL,
    espaciado                  VARCHAR,
    resaltado_letras_confusas  BOOLEAN DEFAULT true,
    fecha_creacion             TIMESTAMP DEFAULT now(),
    espaciado_letras           NUMERIC DEFAULT 0.02,
    espaciado_palabras         NUMERIC DEFAULT 0.10,
    espaciado_lineas           NUMERIC DEFAULT 1.60,
    letras_resaltadas          JSONB DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------
-- 2) DOCUMENTOS Y LECTURA
-- ---------------------------------------------------------------------
-- Textos creados en el módulo de escritura
CREATE TABLE documentos_texto (
    id                   SERIAL PRIMARY KEY,
    usuario_id           INTEGER NOT NULL REFERENCES usuarios(id),
    titulo               VARCHAR NOT NULL DEFAULT 'Sin título',
    contenido            TEXT    NOT NULL DEFAULT '',
    fecha_creacion       TIMESTAMP DEFAULT now(),
    fecha_actualizacion  TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_documentos_texto_usuario
    ON documentos_texto (usuario_id, fecha_actualizacion DESC);

-- Libros EPUB que el usuario ha abierto (para las recompensas de lectura)
CREATE TABLE usuario_libros_abiertos (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
    nombre_archivo  VARCHAR NOT NULL,
    fecha_apertura  TIMESTAMP DEFAULT now(),
    UNIQUE (usuario_id, nombre_archivo)
);

-- Registro de archivos subidos (tabla heredada; hoy los EPUB se manejan
-- directo en Supabase Storage, bucket "epubs")
CREATE TABLE documentos (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
    nombre_archivo  VARCHAR NOT NULL,
    ruta_storage    VARCHAR NOT NULL,
    tamano_kb       INTEGER,
    fecha_subida    TIMESTAMP DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3) EJERCICIOS
-- ---------------------------------------------------------------------
CREATE TABLE ejercicios (
    id           SERIAL PRIMARY KEY,
    clave        VARCHAR NOT NULL UNIQUE,
    nombre       VARCHAR NOT NULL,
    categoria    VARCHAR NOT NULL,
    descripcion  TEXT
);

CREATE TABLE niveles (
    id                  SERIAL PRIMARY KEY,
    ejercicio_id        INTEGER NOT NULL REFERENCES ejercicios(id),
    numero_nivel        INTEGER NOT NULL,
    cantidad_elementos  INTEGER NOT NULL DEFAULT 5,
    UNIQUE (ejercicio_id, numero_nivel)
);

CREATE TABLE banco_preguntas (
    id                  SERIAL PRIMARY KEY,
    nivel_id            INTEGER NOT NULL REFERENCES niveles(id),
    enunciado           TEXT    NOT NULL,
    opciones            JSONB,
    respuesta_correcta  VARCHAR NOT NULL,
    fecha_creacion      TIMESTAMP DEFAULT now()
);

CREATE TABLE resultados_ejercicio (
    id                SERIAL PRIMARY KEY,
    usuario_id        INTEGER NOT NULL REFERENCES usuarios(id),
    ejercicio_id      INTEGER NOT NULL REFERENCES ejercicios(id),
    nivel_id          INTEGER REFERENCES niveles(id),
    puntos_obtenidos  INTEGER DEFAULT 0,
    aciertos          INTEGER DEFAULT 0,
    errores           INTEGER DEFAULT 0,
    fecha             TIMESTAMP DEFAULT now()
);

CREATE TABLE progreso_general (
    usuario_id        INTEGER PRIMARY KEY REFERENCES usuarios(id),
    puntos_totales    INTEGER DEFAULT 0,
    racha_actual      INTEGER DEFAULT 0,
    racha_maxima      INTEGER DEFAULT 0,
    ultima_actividad  DATE
);

-- ---------------------------------------------------------------------
-- 4) INSIGNIAS (las mascotas) Y ACCESORIOS — RF_20
-- ---------------------------------------------------------------------
-- Catálogo de insignias (mascotas)
CREATE TABLE insignias (
    id                       SERIAL PRIMARY KEY,
    clave                    VARCHAR NOT NULL UNIQUE,
    nombre                   VARCHAR NOT NULL,
    descripcion              TEXT,
    emoji_marcador           VARCHAR,
    imagen_url               TEXT,
    categoria                VARCHAR NOT NULL,
    condicion_ejercicio      VARCHAR,
    condicion_racha_dias     INTEGER,
    condicion_libros_leidos  INTEGER,
    condicion_nivel          INTEGER
);

-- Insignias obtenidas por cada usuario; "activa" marca la que se muestra
CREATE TABLE usuario_insignias (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
    insignia_id     INTEGER NOT NULL REFERENCES insignias(id),
    fecha_obtenida  TIMESTAMP DEFAULT now(),
    activa          BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (usuario_id, insignia_id)
);
-- Solo una insignia activa por usuario
CREATE UNIQUE INDEX uq_usuario_insignia_activa
    ON usuario_insignias (usuario_id) WHERE activa;

-- Catálogo de accesorios
CREATE TABLE accesorios (
    id                             SERIAL PRIMARY KEY,
    clave                          VARCHAR NOT NULL UNIQUE,
    nombre                         VARCHAR NOT NULL,
    descripcion                    TEXT,
    emoji_marcador                 VARCHAR,
    imagen_url                     TEXT,
    categoria                      VARCHAR NOT NULL,
    condicion_ejercicio            VARCHAR,
    condicion_libros_leidos        INTEGER,
    condicion_documentos_escritos  INTEGER,
    condicion_puntos_totales       INTEGER,
    condicion_variedad_ejercicios  BOOLEAN DEFAULT false,
    condicion_nivel                INTEGER
);

CREATE TABLE usuario_accesorios (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
    accesorio_id    INTEGER NOT NULL REFERENCES accesorios(id),
    fecha_obtenida  TIMESTAMP DEFAULT now(),
    equipado        BOOLEAN DEFAULT false,
    UNIQUE (usuario_id, accesorio_id)
);

-- ---------------------------------------------------------------------
-- 5) FUNCIONES Y TRIGGERS
-- ---------------------------------------------------------------------
-- Máximo 3 plantillas por usuario (RN_04)
CREATE OR REPLACE FUNCTION validar_limite_plantillas()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF (SELECT COUNT(*) FROM plantillas WHERE usuario_id = NEW.usuario_id) >= 3 THEN
        RAISE EXCEPTION 'Límite de 3 plantillas alcanzado';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_limite_plantillas
    BEFORE INSERT ON plantillas
    FOR EACH ROW EXECUTE FUNCTION validar_limite_plantillas();

-- Calcula si el usuario es menor de edad y exige correo de tutor
CREATE OR REPLACE FUNCTION validar_y_calcular_tutor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.es_menor_edad := NEW.fecha_nacimiento > (CURRENT_DATE - INTERVAL '18 years');

    IF NEW.es_menor_edad AND (NEW.correo_tutor IS NULL OR NEW.correo_tutor = '') THEN
        RAISE EXCEPTION 'Los usuarios menores de edad requieren correo de un tutor';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_tutor
    BEFORE INSERT OR UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION validar_y_calcular_tutor();

-- ---------------------------------------------------------------------
-- 6) SEGURIDAD (RLS)
-- El backend usa la llave de servicio, por eso no hay políticas: con RLS
-- activo y sin políticas, nadie más puede leer ni escribir estas tablas.
-- ---------------------------------------------------------------------
ALTER TABLE usuarios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_visual    ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_texto        ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_libros_abiertos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ejercicios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_preguntas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_ejercicio    ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_general        ENABLE ROW LEVEL SECURITY;
ALTER TABLE insignias               ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_insignias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE accesorios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_accesorios      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 7) DATOS INICIALES
-- ---------------------------------------------------------------------
INSERT INTO ejercicios (clave, nombre, categoria, descripcion) VALUES
 ('CU-EJ-01', 'Texto + trivia',      'comprension',    'Lectura de texto corto con preguntas de opción múltiple'),
 ('CU-EJ-02', 'Cronómetro',          'fluidez',        'Lectura en voz alta contra tiempo esperado'),
 ('CU-EJ-03', 'Atrapa el error',     'ortografia',     'Identificar y corregir palabras mal escritas'),
 ('CU-EJ-04', 'Tarjetas de letras',  'diferenciacion', 'Clasificar letras similares deslizando tarjetas'),
 ('CU-EJ-05', 'Lluvia de letras',    'diferenciacion', 'Seleccionar la letra indicada mientras caen letras similares');

-- Niveles por ejercicio, 5 elementos por nivel.
-- OJO: en la base real Cronómetro (CU-EJ-02) tiene solo 3 niveles; los demás tienen 5.
INSERT INTO niveles (ejercicio_id, numero_nivel, cantidad_elementos)
SELECT e.id, n, 5
  FROM ejercicios e, generate_series(1, 5) AS n
 WHERE NOT (e.clave = 'CU-EJ-02' AND n > 3);

-- Catálogo de insignias (mascotas). imagen_url se llena con el script de Cloudinary.
INSERT INTO insignias (clave, nombre, descripcion, emoji_marcador, categoria, condicion_ejercicio, condicion_racha_dias, condicion_libros_leidos, condicion_nivel) VALUES
 ('mascota_07_buho',     'Buho',     'Tu primer compañero: se gana automáticamente al iniciar sesión por primera vez.', '🦉', 'bienvenida',     NULL,       NULL, NULL, NULL),
 ('mascota_09_pollito',  'Pollito',  'Se gana al completar el Nivel 1 de Texto + trivia.',     'primeros_pasos', 'CU-EJ-01', NULL, NULL, 1),
 ('mascota_05_erizo',    'Erizo',    'Se gana al completar el Nivel 2 de Cronómetro.',         'primeros_pasos', 'CU-EJ-02', NULL, NULL, 2),
 ('mascota_02_zorro',    'Zorro',    'Se gana al completar el Nivel 2 de Atrapa el error.',    'primeros_pasos', 'CU-EJ-03', NULL, NULL, 2),
 ('mascota_12_mapache',  'Mapache',  'Se gana al completar el Nivel 3 de Tarjetas.',           'primeros_pasos', 'CU-EJ-04', NULL, NULL, 3),
 ('mascota_06_pinguino', 'Pinguino', 'Se gana al completar el Nivel 4 de Lluvia.',             'primeros_pasos', 'CU-EJ-05', NULL, NULL, 4),
 ('mascota_03_conejo',   'Conejo',   'Se gana con una racha de 3 días seguidos.',              'constancia',     NULL, 3,  NULL, NULL),
 ('mascota_01_koala',    'Koala',    'Se gana con una racha de 10 días seguidos.',             'constancia',     NULL, 10, NULL, NULL),
 ('mascota_08_lobo',     'Lobo',     'Se gana con una racha de 30 días seguidos.',             'constancia',     NULL, 30, NULL, NULL),
 ('mascota_13_ardilla',  'Ardilla',  'Se gana al abrir 5 libros distintos.',                   'lectura',        NULL, NULL, 5,  NULL),
 ('mascota_04_venado',   'Venado',   'Se gana al abrir 15 libros distintos.',                  'lectura',        NULL, NULL, 15, NULL);

-- Catálogo de accesorios
INSERT INTO accesorios (clave, nombre, descripcion, emoji_marcador, categoria, condicion_ejercicio, condicion_libros_leidos, condicion_documentos_escritos, condicion_puntos_totales, condicion_variedad_ejercicios, condicion_nivel) VALUES
 ('acc_04_lentes',          'Lentes',           'Completaste el Nivel 3 de Texto + trivia.',                     'perfeccion', 'CU-EJ-01', NULL, NULL, NULL, false, 3),
 ('acc_11_lentes',          'Lentes',           'Completaste el Nivel 3 de Cronómetro.',                         'perfeccion', 'CU-EJ-02', NULL, NULL, NULL, false, 3),
 ('acc_17_lentes',          'Lentes',           'Completaste el Nivel 3 de Atrapa el error.',                   'perfeccion', 'CU-EJ-03', NULL, NULL, NULL, false, 3),
 ('acc_20_lentes',          'Lentes',           'Completaste el Nivel 3 de Tarjetas.',                           'perfeccion', 'CU-EJ-04', NULL, NULL, NULL, false, 3),
 ('acc_22_lentes',          'Lentes',           'Completaste el Nivel 3 de Lluvia.',                            'perfeccion', 'CU-EJ-05', NULL, NULL, NULL, false, 3),
 ('acc_14_corona',          'Corona',           'Completaste TODO Texto + trivia (5 niveles x 5 subniveles).',   'maestria',   'CU-EJ-01', NULL, NULL, NULL, false, NULL),
 ('acc_03_birrete',         'Birrete',          'Completaste TODO Cronómetro.',                                  'maestria',   'CU-EJ-02', NULL, NULL, NULL, false, NULL),
 ('acc_10_boina',           'Boina',            'Completaste TODO Atrapa el error.',                             'maestria',   'CU-EJ-03', NULL, NULL, NULL, false, NULL),
 ('acc_05_paliacate',       'Paliacate',        'Completaste TODO Tarjetas.',                                    'maestria',   'CU-EJ-04', NULL, NULL, NULL, false, NULL),
 ('acc_02_bigote',          'Bigote',           'Completaste TODO Lluvia.',                                      'maestria',   'CU-EJ-05', NULL, NULL, NULL, false, NULL),
 ('acc_06_gorros',          'Gorros',           'Escribiste tu primer documento.',                              'escritura',  NULL, NULL, 1,  NULL, false, NULL),
 ('acc_08_gorros',          'Gorros',           'Escribiste 3 documentos.',                                      'escritura',  NULL, NULL, 3,  NULL, false, NULL),
 ('acc_13_gorros',          'Gorros',           'Escribiste 6 documentos.',                                      'escritura',  NULL, NULL, 6,  NULL, false, NULL),
 ('acc_15_gorros',          'Gorros',           'Escribiste 12 documentos.',                                    'escritura',  NULL, NULL, 12, NULL, false, NULL),
 ('acc_16_gorros',          'Gorros',           'Escribiste 25 documentos.',                                    'escritura',  NULL, NULL, 25, NULL, false, NULL),
 ('acc_18_sombrero',        'Sombrero',         'Abriste tu primer libro.',                                      'lectura',    NULL, 1,  NULL, NULL, false, NULL),
 ('acc_19_sombrero',        'Sombrero',         'Abriste 3 libros distintos.',                                   'lectura',    NULL, 3,  NULL, NULL, false, NULL),
 ('acc_12_sombrero',        'Sombrero',         'Abriste 6 libros distintos.',                                   'lectura',    NULL, 6,  NULL, NULL, false, NULL),
 ('acc_07_sombrero_sheriff','Sombrero sheriff', 'Abriste 12 libros distintos.',                                  'lectura',    NULL, 12, NULL, NULL, false, NULL),
 ('acc_09_sombrero_bruja',  'Sombrero bruja',   'Abriste 25 libros distintos.',                                  'lectura',    NULL, 25, NULL, NULL, false, NULL),
 ('acc_01_corbata',         'Corbata',          'Lograste 3 rondas perfectas en cada uno de los 5 ejercicios.',  'variedad',   NULL, NULL, NULL, NULL, true,  NULL),
 ('acc_21_navidad',         'Navidad',          'Acumulaste 2,500 puntos en total.',                             'puntos',     NULL, NULL, NULL, 2500, false, NULL);