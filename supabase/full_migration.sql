-- Arcana Cloud - Schema Inicial (Fase 0)
-- Roadmap Consolidado Julio 2026
-- Aislamiento por tarotista_id en todas las tablas de datos

-- ============================================================
-- 1. ORGANIZACION (plataforma, una sola fila)
-- ============================================================
CREATE TABLE organizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TAROTISTA (tenant principal - unidad de suscripcion)
-- ============================================================
CREATE TABLE tarotista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id UUID REFERENCES organizacion(id),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  plan TEXT NOT NULL DEFAULT 'S' CHECK (plan IN ('S', 'M', 'L')),
  suscripcion_activa BOOLEAN NOT NULL DEFAULT false,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CONSULTANTE (clientes del tarotista)
-- ============================================================
CREATE TABLE consultante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultante_tarotista ON consultante(tarotista_id);

-- ============================================================
-- 4. SESION
-- ============================================================
CREATE TABLE sesion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  consultante_id UUID NOT NULL REFERENCES consultante(id) ON DELETE CASCADE,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completada', 'cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sesion_tarotista ON sesion(tarotista_id);
CREATE INDEX idx_sesion_consultante ON sesion(consultante_id);

-- ============================================================
-- 5. TIRADA (tirada de cartas dentro de una sesion)
-- ============================================================
CREATE TABLE tirada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  pregunta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tirada_sesion ON tirada(sesion_id);
CREATE INDEX idx_tirada_tarotista ON tirada(tarotista_id);

-- ============================================================
-- 6. CARTA (carta individual en una tirada)
-- ============================================================
CREATE TABLE carta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tirada_id UUID NOT NULL REFERENCES tirada(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  posicion INT NOT NULL,
  nombre_carta TEXT NOT NULL,
  es_invertida BOOLEAN NOT NULL DEFAULT false,
  significado_general TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_carta_tirada ON carta(tirada_id);
CREATE INDEX idx_carta_tarotista ON carta(tarotista_id);

-- ============================================================
-- 7. INTERPRETACION (interpretacion IA de cada carta)
-- ============================================================
CREATE TABLE interpretacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id UUID NOT NULL REFERENCES carta(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  creado_por TEXT NOT NULL DEFAULT 'sistema' CHECK (creado_por IN ('sistema', 'tarotista')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interpretacion_carta ON interpretacion(carta_id);
CREATE INDEX idx_interpretacion_tarotista ON interpretacion(tarotista_id);

-- ============================================================
-- 8. MEMORIA (memoria estructurada del consultante)
-- ============================================================
CREATE TABLE memoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultante_id UUID NOT NULL REFERENCES consultante(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('creencia', 'situacion', 'hipotesis', 'rasgo', 'evento')),
  contenido TEXT NOT NULL,
  sesion_origen_id UUID REFERENCES sesion(id) ON DELETE SET NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memoria_consultante ON memoria(consultante_id);
CREATE INDEX idx_memoria_tarotista ON memoria(tarotista_id);

-- ============================================================
-- 9. RESUMEN (resumen de sesion)
-- ============================================================
CREATE TABLE resumen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumen_sesion ON resumen(sesion_id);
CREATE INDEX idx_resumen_tarotista ON resumen(tarotista_id);

-- ============================================================
-- 10. PERFIL_PERSONA (personalizacion de IA con versionado)
-- ============================================================
CREATE TABLE perfil_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID NOT NULL REFERENCES tarotista(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  nombre_persona TEXT NOT NULL,
  tono TEXT NOT NULL,
  frases_caracteristicas TEXT,
  estilo_cierre TEXT,
  activa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tarotista_id, version)
);

CREATE INDEX idx_perfil_tarotista ON perfil_persona(tarotista_id);

-- ============================================================
-- 11. AKE (Arcana Knowledge Encyclopedia - las 78 cartas)
-- ============================================================
CREATE TABLE ake_carta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  numero INT,
  arcano TEXT NOT NULL CHECK (arcano IN ('mayor', 'menor')),
  palo TEXT CHECK (palo IN ('copas', 'espadas', 'bastos', 'oros')),
  significado_general TEXT NOT NULL,
  significado_amor TEXT,
  significado_trabajo TEXT,
  significado_salud TEXT,
  significado_invertido TEXT,
  keywords TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. USUARIO (para auth interna del equipo)
-- ============================================================
CREATE TABLE usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarotista_id UUID REFERENCES tarotista(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'tarotista' CHECK (rol IN ('admin', 'tarotista', 'soporte')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FUNCION: actualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizacion FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tarotista FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultante FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sesion FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON interpretacion FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON memoria FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON perfil_persona FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ake_carta FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Arcana Cloud - Seed AKE: Las 78 Cartas del Tarot
-- Arcano Mayor: 22 cartas (0-21)
-- Arcano Menor: 56 cartas (14 por palo: 10 numeradas + 4 figuras)

-- ============================================================
-- ARCANOS MAYORES
-- ============================================================
INSERT INTO ake_carta (nombre, numero, arcano, significado_general, significado_amor, significado_trabajo, significado_salud, significado_invertido, keywords) VALUES
('El Loco', 0, 'mayor', 'Nuevos comienzos, espontaneidad, libertad. Invita a tomar riesgos y seguir el corazón sin miedo al qué dirán.', 'Relación nueva y emocionante, o necesidad de liberarse de una relación estancada. Amor sin ataduras.', 'Nuevo proyecto, cambio de carrera, emprender algo sin un plan definido. Confianza en el proceso.', 'Buena salud general, pero cuidado con comportamientos imprudentes. Energía renovada.', 'Imprudencia, riesgo innecesario, ingenuidad. Tomar decisiones sin pensar en consecuencias.', 'nuevos comienzos,espontaneidad,libertad,aventura'),
('El Mago', 1, 'mayor', 'Poder personal, habilidad, creatividad. Tienes todas las herramientas que necesitas para lograr tus metas.', 'Capacidad de seducción, carisma. Relación donde hay química y comunicación fluida.', 'Momento ideal para iniciar proyectos. Tienes el talento y los recursos. Confía en tu habilidad.', 'Vitalidad, energía. Capacidad de sanación. Buen momento para tratamientos.', 'Manipulación, talento desperdiciado, inseguridad. Usar el poder para engañar.', 'poder personal,creatividad,habilidad,manifestación'),
('La Sacerdotisa', 2, 'mayor', 'Intuición, misterio, sabiduría interior. Confía en tu voz interna más que en la lógica.', 'Relación con conexión espiritual profunda. Secretos o verdades no dichas. Intuición femenina.', 'Confía en tu instinto profesional. Información oculta por revelarse. Paciencia.', 'Conexión mente-cuerpo. Ciclos femeninos. Salud intuitiva.', 'Secretos guardados, desconexión de la intuición. Represión emocional.', 'intuición,misterio,sabiduría interior,introspección'),
('La Emperatriz', 3, 'mayor', 'Abundancia, fertilidad, naturaleza. Cosechas lo que sembraste. Creatividad en flor.', 'Relación fértil y amorosa. Embarazo posible. Amor en plenitud y abundancia.', 'Crecimiento profesional, abundancia, proyecto que da frutos. Creatividad aplicada.', 'Embarazo, fertilidad. Salud femenina. Conexión con la naturaleza.', 'Dependencia, creatividad bloqueada. Descuido de uno mismo.', 'abundancia,fertilidad,naturaleza,creatividad'),
('El Emperador', 4, 'mayor', 'Autoridad, estructura, estabilidad. Poder establecido. Liderazgo y disciplina.', 'Relación tradicional o formal. Figura paterna. Pareja estable y protectora.', 'Autoridad, liderazgo, jerarquía. Ascenso o posición de poder. Empresa estable.', 'Estructura ósea, postura. Salud que requiere disciplina y rutina.', 'Tiranía, rigidez, abuso de poder. Falta de disciplina.', 'autoridad,estructura,estabilidad,liderazgo'),
('El Hierofante', 5, 'mayor', 'Tradición, espiritualidad, enseñanza. Guía espiritual. Conformidad con normas establecidas.', 'Relación tradicional, matrimonio, compromiso formal. Pareja con valores compartidos.', 'Mentoría, enseñanza. Empresa tradicional. Consejo de un experto.', 'Salud convencional, medicina tradicional. Bienestar espiritual.', 'Rebelión, dogmatismo, rigidez de pensamiento. Desafío a la autoridad.', 'tradición,espiritualidad,enseñanza,conformidad'),
('Los Enamorados', 6, 'mayor', 'Amor, unión, decisiones del corazón. Elección importante entre dos caminos.', 'Relación significativa, alma gemela. Decisión amorosa importante. Unión profunda.', 'Elección profesional importante. Asociación. Decisión alineada con valores.', 'Salud del corazón. Decisiones sobre tratamientos.', 'Desequilibrio, indecisión, ruptura. Evitar compromiso.', 'amor,unión,decisiones,elección'),
('El Carro', 7, 'mayor', 'Victoria, determinación, voluntad. Superar obstáculos con enfoque y disciplina.', 'Relación que supera desafíos. Pasión intensa. Pareja que avanza junta.', 'Éxito profesional tras esfuerzo. Meta alcanzada. Avance decidido.', 'Recuperación, fuerza física. Voluntad de sanar.', 'Falta de dirección, agresión, pérdida de control. Voluntad dispersa.', 'victoria,determinación,voluntad,superación'),
('La Fuerza', 8, 'mayor', 'Fortaleza interior, coraje, compasión. Dominio de las emociones con amor y paciencia.', 'Relación basada en respeto y compasión. Superar crisis con amor.', 'Persistencia, paciencia. Liderar con empatía. Superar desafíos laborales.', 'Recuperación, sistema inmunológico. Fortaleza mental.', 'Inseguridad, duda, baja autoestima. Brutalidad.', 'fortaleza interior,coraje,compasión,paciencia'),
('El Ermitaño', 9, 'mayor', 'Soledad, introspección, sabiduría. Busca respuestas dentro de ti. Momento de retiro.', 'Tiempo a solas necesario. Relación que necesita espacio. Búsqueda interior.', 'Trabajo independiente, investigación. Consejo de un mentor. Tiempo de reflexión.', 'Necesidad de descanso, chequeo médico. Salud mental, introspección.', 'Aislamiento excesivo, paranoia. Negarse a recibir ayuda.', 'soledad,introspección,sabiduría,retiro'),
('La Rueda de la Fortuna', 10, 'mayor', 'Cambio, ciclos, destino. Lo que sube baja y lo que baja sube. Ciclo inevitable.', 'Cambio en la relación. Destino girando. Encuentro o separación inesperada.', 'Ascenso, caída, ciclo profesional. Oportunidad del destino. Cambio de rumbo.', 'Altibajos. Ciclos de salud. Karma.', 'Mala suerte, resistencia al cambio. Estancamiento.', 'cambio,ciclos,destino,fortuna'),
('La Justicia', 11, 'mayor', 'Justicia, verdad, equilibrio. Acciones tienen consecuencias. Decisiones objetivas.', 'Relación justa y equilibrada. Decisiones legales sobre la relación. Verdad.', 'Contratos, juicios, decisiones justas. Ascenso merecido. Evaluación objetiva.', 'Equilibrio corporal. Decisiones médicas. Salud legal.', 'Injusticia, deshonestidad, desequilibrio. Evitar responsabilidad.', 'justicia,verdad,equilibrio,consecuencias'),
('El Colgado', 12, 'mayor', 'Sacrificio, nueva perspectiva, pausa. Ver el mundo desde otro ángulo. Espera activa.', 'Relación en pausa. Sacrificio por amor. Necesidad de soltar el control.', 'Proyecto en espera. Sacrificio necesario. Cambio de perspectiva profesional.', 'Recuperación lenta. Necesidad de reposo. Terapias alternativas.', 'Martirio innecesario, resistencia al cambio. Estancamiento.', 'sacrificio,nueva perspectiva,pausa,entrega'),
('La Muerte', 13, 'mayor', 'Transformación, final, renacimiento. Ciclo que termina para que algo nuevo nazca.', 'Fin de relación, pero transformación, no destrucción. Renacer amoroso.', 'Fin de ciclo laboral. Renovación profesional. Cambio profundo.', 'Renovación celular. Cirugía. Sanación profunda.', 'Estancamiento, miedo al cambio. Resistencia a dejar ir.', 'transformación,final,renacimiento,cambio'),
('La Templanza', 14, 'mayor', 'Equilibrio, moderación, paciencia. Encontrar el punto medio. Fluir con armonía.', 'Relación equilibrada y armoniosa. Pareja que se complementa. Paciencia.', 'Balance trabajo-vida. Colaboración. Progreso constante sin prisas.', 'Equilibrio saludable. Moderación. Sanación gradual.', 'Desequilibrio, excesos, impaciencia. Falta de armonía.', 'equilibrio,moderación,paciencia,armonía'),
('El Diablo', 15, 'mayor', 'Atadura, adicción, materialismo. Lo que te esclaviza. Sombras y deseos.', 'Relación tóxica, dependencia emocional. Pasión destructiva. Atadura.', 'Ambición desmedida, estrés laboral. Atado al dinero o poder.', 'Adicciones, trastornos. Salud comprometida por excesos.', 'Liberación, romper cadenas, superar adicción. Recuperar poder.', 'atadura,adicción,materialismo,sombras'),
('La Torre', 16, 'mayor', 'Caída repentina, revelación, quiebre. Lo que parecía sólido se derrumba para renovarse.', 'Ruptura repentina, revelación dolorosa. Relación que se destruye para reconstruir.', 'Crisis profesional, despido, quiebra. Oportunidad de reconstruir.', 'Enfermedad repentina, accidente. Crisis que obliga a cambiar hábitos.', 'Reconstrucción, liberación, nuevo comienzo tras la crisis.', 'caída,revelación,quiebre,crisis'),
('La Estrella', 17, 'mayor', 'Esperanza, inspiración, serenidad. Luz que guía. Conexión espiritual y renovación.', 'Relación espiritual, esperanza amorosa. Sanación tras ruptura.', 'Inspiración creativa. Proyecto iluminado. Guía profesional.', 'Sanación, bienestar, conexión espiritual. Salud mental positiva.', 'Desesperanza, desconexión, falta de fe. Bloqueo creativo.', 'esperanza,inspiración,serenidad,renovación'),
('La Luna', 18, 'mayor', 'Miedo, ilusión, subconsciente. No todo es lo que parece. Confía en tu intuición.', 'Inseguridad en la relación. Celos, engaño. Relación confusa o secreta.', 'Proyecto incierto. Advertencia de engaño. Confusión profesional.', 'Salud mental, ansiedad, sueño. Ciclos hormonales.', 'Claridad, superar miedos, verdad revelada.', 'miedo,ilusión,subconsciente,intuición'),
('El Sol', 19, 'mayor', 'Alegría, éxito, vitalidad. Claridad y plenitud. Todo brilla en tu camino.', 'Relación feliz y plena. Amor radiante. Pareja que disfruta la vida juntos.', 'Éxito profesional, reconocimiento, logro. Proyecto brillante.', 'Salud excelente, vitalidad, energía. Bienestar total.', 'Felicidad bloqueada, éxito temporal. Optimismo excesivo.', 'alegría,éxito,vitalidad,plenitud'),
('El Juicio', 20, 'mayor', 'Despertar, renovación, llamado interior. Eres llamado a un propósito mayor.', 'Renovación de la relación. Segunda oportunidad. Decisión importante de pareja.', 'Llamado profesional, cambio de carrera. Evaluación, juicio final.', 'Renacimiento, recuperación milagrosa. Salud renovada.', 'Autocrítica excesiva, duda. Negarse a escuchar el llamado.', 'despertar,renovación,llamado,propósito'),
('El Mundo', 21, 'mayor', 'Completitud, logro, viaje. Ciclo completado con éxito. Satisfacción y realización.', 'Relación completa y satisfactoria. Unión exitosa. Ciclo amoroso cumplido.', 'Proyecto culminado, éxito total. Meta alcanzada. Expansión global.', 'Plenitud física y mental. Bienestar completo.', 'Falta de cierre, retraso. Meta no alcanzada.', 'completitud,logro,viaje,realización')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- ARCANOS MENORES - PALO DE COPAS (Agua, Emociones)
-- ============================================================
INSERT INTO ake_carta (nombre, numero, arcano, palo, significado_general, significado_amor, significado_trabajo, significado_salud, significado_invertido, keywords) VALUES
('As de Copas', 1, 'menor', 'copas', 'Amor nuevo, plenitud emocional, apertura del corazón. Comienzo de una experiencia emocional profunda.', 'Nuevo amor, declaración, romance floreciente. Corazón abierto.', 'Proyecto creativo, nueva oportunidad laboral con carga emocional positiva.', 'Salud emocional equilibrada. Buen momento para sanar heridas.', 'Bloqueo emocional, amor no correspondido. Oportunidad perdida.', 'amor,plenitud,emociones,nuevo comienzo'),
('Dos de Copas', 2, 'menor', 'copas', 'Unión, conexión, amor recíproco. Alianza entre dos personas.', 'Pareja establecida, relación equilibrada. Encuentro amoroso significativo.', 'Asociación exitosa, colaboración, alianza profesional.', 'Armonía en relaciones. Bienestar emocional compartido.', 'Desequilibrio en la relación, ruptura, desconexión.', 'unión,conexión,amor recíproco,alianza'),
('Tres de Copas', 3, 'menor', 'copas', 'Celebración, amistad, comunidad. Alegría compartida con seres queridos.', 'Vida social activa en pareja. Amistad que florece en amor.', 'Trabajo en equipo, celebración de logros. Ambiente laboral positivo.', 'Recuperación con apoyo social. Bienestar en grupo.', 'Excesos, fiesta vacía, chisme. Aislamiento social.', 'celebración,amistad,comunidad,alegría'),
('Cuatro de Copas', 4, 'menor', 'copas', 'Meditación, apatía, contemplación. Insatisfacción con lo que tienes. Soñar despierto.', 'Insatisfacción en la relación. Buscar algo más. Oportunidad amorosa ignorada.', 'Aburrimiento laboral, falta de motivación. Nueva oportunidad que no ves.', 'Apatía, depresión ligera. Necesidad de cambiar rutina.', 'Despertar, nueva oportunidad, acción. Dejar la queja.', 'meditación,apatía,contemplación,insatisfacción'),
('Cinco de Copas', 5, 'menor', 'copas', 'Pérdida, duelo, arrepentimiento. Mirar atrás con tristeza, pero hay esperanza.', 'Duelo amoroso, separación, pérdida de la relación. Arrepentimiento.', 'Proyecto fallido, pérdida profesional. Lección aprendida.', 'Duelo, pérdida de salud. Proceso de sanación.', 'Aceptación, superación, dejar ir. Encontrar paz.', 'pérdida,duelo,arrepentimiento,tristeza'),
('Seis de Copas', 6, 'menor', 'copas', 'Nostalgia, recuerdos, infancia. Conexión con el pasado, regalos, generosidad.', 'Reencuentro del pasado. Amor de la infancia. Relación con dulzura.', 'Proyecto nostálgico, mentoría. Cliente recurrente.', 'Cuidado, sanación suave. Medicina natural.', 'Vivir en el pasado, estancamiento. Negarse a crecer.', 'nostalgia,recuerdos,infancia,generosidad'),
('Siete de Copas', 7, 'menor', 'copas', 'Ilusiones, fantasía, múltiples opciones. Demasiadas posiciones, dificultad para elegir.', 'Fantasías amorosas, expectativas irreales. Varias opciones amorosas.', 'Muchas oportunidades laborales. Falta de enfoque. Proyectos poco realistas.', 'Sueños, imaginación. Salud mental, confusión.', 'Claridad, enfoque, decisión realista. Dejar fantasías.', 'ilusiones,fantasía,opciones,confusión'),
('Ocho de Copas', 8, 'menor', 'copas', 'Abandono, búsqueda, dejar atrás. Alejarse de lo conocido en busca de algo mejor.', 'Dejar una relación insatisfactoria. Buscar algo más profundo.', 'Renunciar a un trabajo. Buscar un propósito mayor.', 'Dejar hábitos dañinos. Búsqueda de bienestar.', 'Regreso, miedo al cambio. Peregrinaje incompleto.', 'abandono,búsqueda,dejar atrás,cambio'),
('Nueve de Copas', 9, 'menor', 'copas', 'Satisfacción, deseo cumplido, bienestar. Todo lo que deseabas se ha manifestado.', 'Relación plena, deseos amorosos cumplidos. Felicidad compartida.', 'Éxito profesional, meta alcanzada. Satisfacción laboral.', 'Salud óptima, bienestar general. Plenitud.', 'Insatisfacción, deseos no cumplidos. Arrogancia.', 'satisfacción,deseo cumplido,bienestar,plenitud'),
('Diez de Copas', 10, 'menor', 'copas', 'Felicidad plena, armonía familiar, amor incondicional. La felicidad completa.', 'Relación perfecta, familia feliz. Amor incondicional. Alma gemela.', 'Ambiente laboral armonioso. Empresa familiar exitosa.', 'Salud de toda la familia. Bienestar colectivo.', 'Disputa familiar, hogar roto. Felicidad aparente.', 'felicidad plena,armonía familiar,amor incondicional'),
('Sota de Copas', 11, 'menor', 'copas', 'Mensajero del amor, creatividad, intuición. Juventud emocional, oferta romántica.', 'Declaración de amor, invitación romántica. Noticia amorosa.', 'Oferta creativa, propuesta artística. Idea innovadora.', 'Noticia positiva de salud. Sanación emocional.', 'Inmadurez emocional, noticia falsa. Creatividad bloqueada.', 'mensajero,creatividad,intuición,romance'),
('Caballero de Copas', 12, 'menor', 'copas', 'Romántico, soñador, propuesta. Llegada de una oportunidad romántica o creativa.', 'Pretendiente romántico, propuesta elegante. Idealista en el amor.', 'Propuesta creativa, oferta artística. Persona con visión.', 'Sanación a través del arte. Terapia emocional.', 'Engaño romántico, celos. Promesas vacías, manipulación.', 'romántico,soñador,propuesta,idealista'),
('Reina de Copas', 13, 'menor', 'copas', 'Empatía, intuición, cuidado emocional. Mujer madura emocionalmente que cuida y nutre.', 'Pareja empática y amorosa. Mujer emocionalmente madura.', 'Liderazgo empático. Trabajo con personas. Consejera.', 'Cuidado de la salud emocional. Sanación.', 'Dependencia emocional, codependencia. Manipulación emocional.', 'empatía,intuición,cuidado,compasión'),
('Rey de Copas', 14, 'menor', 'copas', 'Sabiduría emocional, control, diplomacia. Hombre maduro que domina sus emociones.', 'Pareja estable emocionalmente. Hombre que sabe amar con madurez.', 'Líder compasivo, diplomático. Consejero profesional.', 'Equilibrio emocional y físico. Madurez en salud.', 'Represión emocional, manipulación, frialdad.', 'sabiduría emocional,control,diplomacia,madurez')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- ARCANOS MENORES - PALO DE ESPADAS (Aire, Mente)
-- ============================================================
INSERT INTO ake_carta (nombre, numero, arcano, palo, significado_general, significado_invertido, keywords) VALUES
('As de Espadas', 1, 'menor', 'espadas', 'Claridad mental, verdad, justicia. Corte de la confusión. Idea brillante.', 'Confusión, mala comunicación. Verdad dolorosa ignorada.', 'claridad,verdad,justicia,idea'),
('Dos de Espadas', 2, 'menor', 'espadas', 'Decisión difícil, punto muerto. No querer ver la verdad. Emociones vs razón.', 'Parálisis por análisis. Verdad liberadora. Decisión inevitable.', 'decisión,dilema,punto muerto,bloqueo'),
('Tres de Espadas', 3, 'menor', 'espadas', 'Dolor, traición, corazón roto. Sufrimiento emocional necesario para crecer.', 'Sanación, superar dolor. Aceptación del sufrimiento.', 'dolor,traición,corazón roto,sufrimiento'),
('Cuatro de Espadas', 4, 'menor', 'espadas', 'Descanso, meditación, recuperación. Pausa necesaria para recargar fuerzas.', 'Retiro prolongado, agotamiento. Incapacidad de descansar.', 'descanso,meditación,recuperación,pausa'),
('Cinco de Espadas', 5, 'menor', 'espadas', 'Conflicto, derrota, tensión. Ganar a costa de otros. Batalla innecesaria.', 'Derrota merecida, reconciliación. Aprender de la pérdida.', 'conflicto,derrota,tensión,disputa'),
('Seis de Espadas', 6, 'menor', 'espadas', 'Transición, dejar atrás, viaje. Mudanza hacia aguas más tranquilas.', 'Transición difícil, resistencia al cambio. Mudanza forzada.', 'transición,viaje,dejar atrás,superación'),
('Siete de Espadas', 7, 'menor', 'espadas', 'Engaño, estrategia, astucia. No todo es lo que parece. Actuar con inteligencia.', 'Autoengaño, mentira descubierta. Conciencia culpable.', 'engaño,estrategia,astucia,sigilo'),
('Ocho de Espadas', 8, 'menor', 'espadas', 'Restricción, miedo, sentirse atrapado. Limitaciones autoimpuestas.', 'Liberación, claridad, superación de miedos. Nueva perspectiva.', 'restricción,miedo,atrapado,limitación'),
('Nueve de Espadas', 9, 'menor', 'espadas', 'Ansiedad, pesadillas, preocupación extrema. Miedo irracional que nubla la mente.', 'Recuperación, alivio, apoyo. Superar la ansiedad.', 'ansiedad,pesadillas,preocupación,miedo'),
('Diez de Espadas', 10, 'menor', 'espadas', 'Final doloroso, traición, derrota total. El punto más bajo, solo queda subir.', 'Recuperación, renacimiento, dejar ir. Fin de un ciclo.', 'final,dolor,derrota,renacimiento'),
('Sota de Espadas', 11, 'menor', 'espadas', 'Curiosidad, comunicación, verdad. Nuevas ideas, búsqueda de conocimiento.', 'Cinismo, malas noticias. Verdad a medias.', 'curiosidad,comunicación,verdad,idea'),
('Caballero de Espadas', 12, 'menor', 'espadas', 'Impulso, ambición, acción rápida. Perseguir metas con determinación audaz.', 'Agresión imprudente, conflicto. Falta de dirección.', 'impulso,ambición,acción,determinación'),
('Reina de Espadas', 13, 'menor', 'espadas', 'Claridad, independencia, comunicación directa. Mujer de mente aguda y palabra franca.', 'Frialdad, amargura, crueldad. Comunicación hiriente.', 'claridad,independencia,comunicación,franqueza'),
('Rey de Espadas', 14, 'menor', 'espadas', 'Autoridad intelectual, verdad, ética. Hombre de principios y mente analítica.', 'Abuso de poder intelectual, tiranía. Manipulación con palabras.', 'autoridad,verdad,ética,análisis')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- ARCANOS MENORES - PALO DE BASTOS (Fuego, Acción)
-- ============================================================
INSERT INTO ake_carta (nombre, numero, arcano, palo, significado_general, significado_invertido, keywords) VALUES
('As de Bastos', 1, 'menor', 'bastos', 'Inspiración, nuevo proyecto, energía creativa. Chispa de creación y aventura.', 'Falta de motivación, proyecto estancado. Idea sin ejecución.', 'inspiración,creatividad,nuevo proyecto,energía'),
('Dos de Bastos', 2, 'menor', 'bastos', 'Planificación, decisión, visión de futuro. Mirar hacia adelante y planificar.', 'Miedo a lo desconocido, falta de plan. Indecisión.', 'planificación,decisión,visión,futuro'),
('Tres de Bastos', 3, 'menor', 'bastos', 'Expansión, crecimiento, exploración. Proyecto que se expande, mirar horizontes lejanos.', 'Obstáculos, demoras, falta de avance. Proyecto limitado.', 'expansión,crecimiento,exploración,avance'),
('Cuatro de Bastos', 4, 'menor', 'bastos', 'Celebración, hogar, armonía. Logro celebrado en comunidad. Base estable.', 'Inestabilidad, falta de celebración. Hogar en conflicto.', 'celebración,hogar,armonía,logro'),
('Cinco de Bastos', 5, 'menor', 'bastos', 'Competencia, conflicto, desafío. Rivalidad que impulsa a mejorar.', 'Evitar el conflicto, acuerdo. Competencia desleal.', 'competencia,conflicto,desafío,rivalidad'),
('Seis de Bastos', 6, 'menor', 'bastos', 'Victoria, reconocimiento, éxito público. Logro celebrado por otros.', 'Falta de reconocimiento, caída pública. Arrogancia.', 'victoria,reconocimiento,éxito,público'),
('Siete de Bastos', 7, 'menor', 'bastos', 'Defensa, competencia, perseverancia. Defender tu posición ante desafíos.', 'Sentirse abrumado, rendirse. Defensa débil.', 'defensa,competencia,perseverancia,desafío'),
('Ocho de Bastos', 8, 'menor', 'bastos', 'Velocidad, movimiento, noticias rápidas. Acción acelerada, cambios repentinos.', 'Retrasos, frustración. Lentitud en avance.', 'velocidad,movimiento,noticias,cambio'),
('Nueve de Bastos', 9, 'menor', 'bastos', 'Resiliencia, persistencia, última línea de defensa. No rendirse ante la adversidad.', 'Agotamiento, paranoia. Negarse a recibir ayuda.', 'resiliencia,persistencia,defensa,resistencia'),
('Diez de Bastos', 10, 'menor', 'bastos', 'Carga pesada, responsabilidad excesiva. Llevar demasiado peso solo.', 'Dejar la carga, delegar. Agotamiento extremo.', 'carga,responsabilidad,estrés,agotamiento'),
('Sota de Bastos', 11, 'menor', 'bastos', 'Entusiasmo, exploración, noticia emocionante. Juventud aventurera, nuevo comienzo.', 'Falta de dirección, entusiasmo apagado. Idea sin respaldo.', 'entusiasmo,exploración,noticia,nuevo comienzo'),
('Caballero de Bastos', 12, 'menor', 'bastos', 'Aventura, pasión, acción impulsiva. Perseguir sueños con energía ardiente.', 'Impaciencia, imprudencia, acciones sin pensar. Proyecto abandonado.', 'aventura,pasión,acción,impulso'),
('Reina de Bastos', 13, 'menor', 'bastos', 'Carisma, confianza, determinación. Mujer audaz que inspira y lidera con pasión.', 'Celos, inseguridad, falta de confianza. Energía dispersa.', 'carisma,confianza,determinación,liderazgo'),
('Rey de Bastos', 14, 'menor', 'bastos', 'Liderazgo visionario, emprendimiento. Hombre de acción que inspira y crea.', 'Arrogancia, impulsividad. Líder que no escucha.', 'liderazgo,visión,emprendimiento,acción')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- ARCANOS MENORES - PALO DE OROS (Tierra, Material)
-- ============================================================
INSERT INTO ake_carta (nombre, numero, arcano, palo, significado_general, significado_invertido, keywords) VALUES
('As de Oros', 1, 'menor', 'oros', 'Prosperidad, nuevo trabajo, oportunidad financiera. Semilla de abundancia material.', 'Oportunidad perdida, mala inversión. Falta de prosperidad.', 'prosperidad,trabajo,oportunidad,abundancia'),
('Dos de Oros', 2, 'menor', 'oros', 'Equilibrio, adaptación, múltiples prioridades. Manejar varias responsabilidades a la vez.', 'Desequilibrio financiero, sobrecarga. Incapacidad de priorizar.', 'equilibrio,adaptación,prioridades,cambio'),
('Tres de Oros', 3, 'menor', 'oros', 'Trabajo en equipo, aprendizaje, artesanía. Colaboración para construir algo valioso.', 'Falta de trabajo en equipo, mediocridad. Proyecto mal ejecutado.', 'trabajo en equipo,aprendizaje,artesanía,calidad'),
('Cuatro de Oros', 4, 'menor', 'oros', 'Seguridad, ahorro, control. Conservar lo que tienes, pero cuidado con la avaricia.', 'Avaricia, posesividad. Miedo a perder lo material.', 'seguridad,ahorro,control,estabilidad'),
('Cinco de Oros', 5, 'menor', 'oros', 'Dificultad económica, escasez, aislamiento. Momento de carencia, pero hay ayuda disponible.', 'Recuperación financiera, encontrar ayuda. Fin de la escasez.', 'dificultad,economía,escasez,aislamiento'),
('Seis de Oros', 6, 'menor', 'oros', 'Generosidad, caridad, compartir. Dar y recibir con equilibrio. Ayuda desinteresada.', 'Desigualdad, deuda, manipulación con dinero. Condiciones injustas.', 'generosidad,caridad,compartir,equilibrio'),
('Siete de Oros', 7, 'menor', 'oros', 'Inversión, paciencia, cosechar lo sembrado. Esperar resultados del esfuerzo.', 'Pérdida de inversión, impaciencia. Esfuerzo no recompensado.', 'inversión,paciencia,cosecha,evaluación'),
('Ocho de Oros', 8, 'menor', 'oros', 'Diligencia, aprendizaje, maestría. Trabajo dedicado para perfeccionar una habilidad.', 'Trabajo sin pasión, mediocridad. Falta de progreso.', 'diligencia,aprendizaje,maestría,dedicación'),
('Nueve de Oros', 9, 'menor', 'oros', 'Lujo, abundancia, autosuficiencia. Prosperidad alcanzada por mérito propio.', 'Inseguridad financiera, soledad material. Dependencia.', 'lujo,abundancia,autosuficiencia,prosperidad'),
('Diez de Oros', 10, 'menor', 'oros', 'Legado, herencia, familia. Prosperidad generacional. Empresa familiar estable.', 'Pérdida de herencia, quiebra familiar. Ruptura del legado.', 'legado,herencia,familia,prosperidad'),
('Sota de Oros', 11, 'menor', 'oros', 'Ambición, estudio, nueva oportunidad laboral. Joven estudiante o aprendiz dedicado.', 'Falta de ambición, pereza. Oportunidad desperdiciada.', 'ambición,estudio,oportunidad,aprendizaje'),
('Caballero de Oros', 12, 'menor', 'oros', 'Responsabilidad, perseverancia, trabajo constante. Avance lento pero seguro hacia la meta.', 'Pereza, estancamiento. Falta de progreso por terquedad.', 'responsabilidad,perseverancia,trabajo,constancia'),
('Reina de Oros', 13, 'menor', 'oros', 'Abundancia, practicidad, nutrición. Mujer que provee estabilidad y confort material.', 'Descuido material, dependencia. Valores materiales sobre espirituales.', 'abundancia,practicidad,nutrición,estabilidad'),
('Rey de Oros', 14, 'menor', 'oros', 'Éxito financiero, liderazgo empresarial. Hombre de negocios exitoso y generoso.', 'Avaricia, materialismo excesivo. Mal manejo financiero.', 'éxito,finanzas,liderazgo,generosidad')
ON CONFLICT (nombre) DO NOTHING;
