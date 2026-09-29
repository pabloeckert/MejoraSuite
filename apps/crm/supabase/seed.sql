-- ============================================================
-- MejoraCRM — Datos de demostración
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Este script inserta datos de prueba para demostrar el CRM.
-- Los UUIDs son fijos para poder referenciar entre tablas.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PERFILES (3 usuarios)
-- ─────────────────────────────────────────────
-- Nota: Los auth.users deben crearse desde Supabase Auth primero.
-- Este script asume que los usuarios ya existen en auth.users
-- con los UUIDs definidos abajo.
--
-- Creá estos usuarios desde el Dashboard → Authentication → Users:
--
--   sindygeisert@gmail.com   → UUID: 790af0a0-b7d4-4edd-bc0b-0dd8cbc2e9ce (admin/dueña)
--   pabloeckert@gmail.com    → UUID: 76561522-9bc2-45aa-82e1-8e7b4a6cf2c7 (admin/dueño)
--   mejoraok@gmail.com       → UUID: eef38352-ce53-468d-8b2a-d0c42fec6b3d (vendedor)
--
-- Password para todos: T@beg2301
--
-- IMPORTANTE: Los UUIDs de auth.users los genera Supabase automáticamente.
-- Después de crear los usuarios, copiá sus UUIDs reales y reemplazá los
-- valores de abajo (a0000000-...) antes de ejecutar este script.

-- Perfiles
INSERT INTO profiles (id, user_id, full_name, avatar_url) VALUES
  ('32c2de42-317d-4aee-baf5-e69a09abd7b2', '790af0a0-b7d4-4edd-bc0b-0dd8cbc2e9ce', 'Sindy Geisert', NULL),
  ('cc7a404a-7562-4240-8858-f87693825e29', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'Pablo Eckert', NULL),
  ('7b744261-8852-4e9f-a065-77ee448ad8fc', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Mejora OK', NULL)
ON CONFLICT (id) DO NOTHING;

-- Roles (admin = dueño, vendedor = vendedor)
INSERT INTO user_roles (id, user_id, role) VALUES
  ('4043126e-00c6-4b9a-a389-01a8b8e77540', '790af0a0-b7d4-4edd-bc0b-0dd8cbc2e9ce', 'admin'),
  ('3aeb2cf0-ff38-46b4-9894-21cfcaf2f08f', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'admin'),
  ('58f927ad-b39c-401c-83d9-36883ba148b9', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'vendedor')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. PRODUCTOS (5 productos del rubro forestal)
-- ─────────────────────────────────────────────
INSERT INTO products (id, name, description, category, unit, unit_label, currency, price, active) VALUES
  ('14f3e1de-1f3b-439b-a933-efc73c8c52bf', 'Pino Elliotis - Semilla',        'Semilla certificada de pino elliotis para vivero',               'Semillas',    'kg',   'Kilogramo',    'ARS', 8500,    true),
  ('449f0657-2828-45ae-a24d-02aa8cf9094c', 'Eucalipto Grandis - Semilla',    'Semilla certificada de eucalipto grandis',                       'Semillas',    'kg',   'Kilogramo',    'ARS', 12000,   true),
  ('7aee65fc-32bf-4f3d-b214-e0e93f5b354b', 'Plancha Pino Paraná 25mm',       'Plancha aserrada de pino paraná, 25mm de espesor',               'Madera',      'm3',   'Metro cúbico', 'ARS', 180000,  true),
  ('efbba8c8-9d25-461d-a2e9-252762ee1aaa', 'Plancha Eucalipto 30mm',         'Plancha aserrada de eucalipto, 30mm de espesor',                 'Madera',      'm3',   'Metro cúbico', 'ARS', 220000,  true),
  ('b2eebe96-031a-42b0-8c26-18a121ff6640', 'Servicio de Manejo Forestal',    'Asesoramiento técnico forestal por hectárea por año',            'Servicios',   'ha',   'Hectárea',     'USD', 150,     true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. CLIENTES (8 clientes)
-- ─────────────────────────────────────────────
INSERT INTO clients (id, name, company, contact_name, whatsapp, email, segment, channel, province, country, location, address, status, assigned_to, notes) VALUES
  ('ba9670d3-590b-4d72-8a49-a2a88cf30bc3', 'Roberto Maidana',      'Forestal Misiones S.A.',   'Roberto Maidana',      '+54 376 4123456', 'roberto@forestalmisiones.com',  'Forestal',     'Referido',       'Misiones', 'Argentina', 'Eldorado',      'Ruta 12 km 8',              'activo',    'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Cliente principal. Compra semillas y madera.'),
  ('0791521a-c8e6-4223-b3ef-a039f034304d', 'Ana Sosa',             'Estancia El Retiro',       'Ana Sosa',             '+54 375 5234567', 'ana@estanciaretiro.com.ar',     'Agropecuario', 'WhatsApp',       'Misiones', 'Argentina', 'Oberá',         'Camino Rural s/n',          'activo',    'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Interesada en reforestación.'),
  ('729e6661-b674-44e5-b14d-16edd5ba4ac7', 'Luis Benítez',         'Maderas del Norte',        'Luis Benítez',         '+54 376 4345678', 'luis@maderasnorte.com',         'Industrial',   'Feria/Evento',   'Misiones', 'Argentina', 'Posadas',       'Av. Corrientes 1234',       'activo',    'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Compra madera aserrada en volumen.'),
  ('fc1513bd-e18c-44c4-85a9-681515bcb323', 'Gabriela Romero',      'Constructora Andes',       'Gabriela Romero',      '+54 376 4456789', 'gaby@constructoraandes.com',    'Construcción', 'Email',          'Misiones', 'Argentina', 'San Martín',    'Belgrano 567',              'potencial',  'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Busca madera para estructuras.'),
  ('a851e4d8-30ac-4b56-b7c5-ad2e86b90bf6', 'Martín Acuña',         'Gobierno de Misiones',     'Martín Acuña',         '+54 376 4567890', 'macuña@misiones.gob.ar',        'Gobierno',     'Reunión presencial', 'Misiones', 'Argentina', 'Posadas',       'Córdoba 1200',              'activo',    'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Licitación de plantines para programa provincial.'),
  ('89ba94c9-c92b-4e60-bf46-29f262ab52ce', 'Silvia Ferreyra',      'Vivero Los Pinos',         'Silvia Ferreyra',      '+54 375 4678901', 'silvia@viverolospinos.com',     'Forestal',     'Redes sociales', 'Misiones', 'Argentina', 'Puerto Iguazú', 'Av. Victoria Aguirre 890',  'activo',    'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Viverista. Compra semillas regularmente.'),
  ('e8525b2c-50d8-456f-b363-c8b4ed3d1f63', 'Diego Morel',          'Agro Semillas S.R.L.',     'Diego Morel',          '+54 375 4789012', 'diego@agrosemillas.com',        'Agropecuario', 'Referido',       'Misiones', 'Argentina', 'Apóstoles',     'San Martín 345',            'potencial',  'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Nuevo contacto. Interesado en eucalipto.'),
  ('94a15ed5-c9a1-4818-b370-67c40e6a297a', 'Laura Cáceres',        'Casa del Parquet',         'Laura Cáceres',        '+54 376 4890123', 'laura@casadelparquet.com',      'Comercio',     'Sitio web',      'Misiones', 'Argentina', 'Candelaria',    'Ruta 12 km 5',              'inactivo',  'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'Dejó de responder hace 2 meses.')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. INTERACCIONES (16 interacciones)
-- ─────────────────────────────────────────────

-- VENTAS CERRADAS (6)
INSERT INTO interactions (id, client_id, user_id, medium, result, total_amount, currency, loss_reason, estimated_loss, next_step, follow_up_date, notes, interaction_date) VALUES
  ('ec8d8e83-354e-4406-b283-cc8fb3f0beb9', 'ba9670d3-590b-4d72-8a49-a2a88cf30bc3', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'venta', 425000,  'ARS', NULL, NULL, 'Coordinar entrega',      '2026-05-10', 'Venta de 50kg semilla pino elliotis',           '2026-04-20'),
  ('5b5545b0-7098-4002-9955-7ac907d43f9d', '89ba94c9-c92b-4e60-bf46-29f262ab52ce', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'venta', 255000,  'ARS', NULL, NULL, 'Confirmar recepción',    '2026-05-05', '30kg semilla pino para vivero',                  '2026-04-22'),
  ('4beb469a-f450-49dc-8c41-e0d4586dd81b', '729e6661-b674-44e5-b14d-16edd5ba4ac7', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'reunion_presencial', 'venta', 540000,  'ARS', NULL, NULL, 'Enviar factura',         '2026-05-08', '3m3 pino paraná para taller',                    '2026-04-18'),
  ('543f01c6-1879-47a2-85b5-072630131c49', 'a851e4d8-30ac-4b56-b7c5-ad2e86b90bf6', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'reunion_presencial', 'venta', 7500,    'USD', NULL, NULL, 'Iniciar proyecto',       '2026-05-15', 'Servicio manejo forestal 50ha programa provincial','2026-04-10'),
  ('b48839c3-e050-425c-b98e-89aa62616590', 'ba9670d3-590b-4d72-8a49-a2a88cf30bc3', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'llamada',        'venta', 660000,  'ARS', NULL, NULL, 'Programar despacho',     '2026-05-12', '3m3 eucalipto para nueva plantación',             '2026-04-25'),
  ('db355c65-ce7b-4d65-9679-08e9f7fcc205', '0791521a-c8e6-4223-b3ef-a039f034304d', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'venta', 340000,  'ARS', NULL, NULL, 'Seguimiento post-venta', '2026-05-20', '40kg semilla eucalipto para campo',              '2026-04-28'),

-- PRESUPUESTOS / VENTAS EN CURSO (4)
  ('252d3e74-b43e-434c-b1a1-7ef48e01a4c7', 'fc1513bd-e18c-44c4-85a9-681515bcb323', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'email',          'presupuesto', 900000,  'ARS', NULL, NULL, 'Esperar respuesta',      '2026-05-08', 'Presupuesto 5m3 pino para estructura',           '2026-05-01'),
  ('34b0d86c-9480-48b5-9d62-b99699cd789f', 'a851e4d8-30ac-4b56-b7c5-ad2e86b90bf6', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'reunion_presencial', 'presupuesto', 15000,  'USD', NULL, NULL, 'Reunión de seguimiento', '2026-05-12', 'Propuesta manejo forestal 100ha',                 '2026-05-02'),
  ('8f2e8adf-5640-473a-872e-9e749abf6468', 'e8525b2c-50d8-456f-b363-c8b4ed3d1f63', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'llamada',        'presupuesto', 170000,  'ARS', NULL, NULL, 'Enviar cotización',      '2026-05-06', '20kg semilla eucalipto + asesoramiento',          '2026-05-01'),
  ('24f5436b-f6e0-4caf-8941-b4fa649d1bb4', '0791521a-c8e6-4223-b3ef-a039f034304d', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'presupuesto', 440000,  'ARS', NULL, NULL, 'Confirmar pedido',       '2026-05-15', '2m3 eucalipto para construcción galpón',          '2026-05-03'),

-- SEGUIMIENTOS PENDIENTES (3)
  ('6f649ab2-bad0-4e71-a08e-e5fbaafc3073', 'ba9670d3-590b-4d72-8a49-a2a88cf30bc3', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'seguimiento', NULL, NULL, NULL, NULL, 'Consultar necesidades',  '2026-05-06', 'Seguimiento post-venta satisfactoria',           '2026-05-02'),
  ('777f79b4-707b-4b4d-92e1-bbcabff338f3', '89ba94c9-c92b-4e60-bf46-29f262ab52ce', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'seguimiento', NULL, NULL, NULL, NULL, 'Ofrecer nueva variedad', '2026-05-09', 'Preguntar si necesita más semillas este mes',     '2026-05-02'),
  ('76253f8e-7b6a-4b1d-bead-041fc3b8af36', '729e6661-b674-44e5-b14d-16edd5ba4ac7', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'llamada',        'seguimiento', NULL, NULL, NULL, NULL, 'Agendar visita',         '2026-05-10', 'Visita a taller para ver stock',                  '2026-05-01'),

-- SEGUIMIENTOS VENCIDOS (3)
  ('a667553e-aa24-420a-90e2-822871f7bd79', 'fc1513bd-e18c-44c4-85a9-681515bcb323', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'llamada',        'seguimiento', NULL, NULL, NULL, NULL, 'Llamar de nuevo',        '2026-04-28', 'No contestó. Reintentar.',                        '2026-04-25'),
  ('29382297-f3de-4f82-9281-618c9308efb0', 'a851e4d8-30ac-4b56-b7c5-ad2e86b90bf6', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'email',          'seguimiento', NULL, NULL, NULL, NULL, 'Reenviar propuesta',     '2026-04-30', 'Pidió más info. Enviar resumen ejecutivo.',       '2026-04-22'),
  ('3a07da90-8155-4959-b4b5-326af58135fb', '94a15ed5-c9a1-4818-b370-67c40e6a297a', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'seguimiento', NULL, NULL, NULL, NULL, 'Verificar interés',      '2026-04-20', 'Cliente inactivo. Último contacto hace 2 meses.', '2026-04-15'),

-- VENTAS PERDIDAS (3)
  ('9d9f7006-4a54-461b-a17d-1e673285952e', 'e8525b2c-50d8-456f-b363-c8b4ed3d1f63', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'llamada',        'no_interesado', NULL, 'ARS', 'Precio', 200000, NULL, NULL, 'Prefirió la competencia por precio más bajo.',    '2026-04-20'),
  ('430e7c7d-997a-4f00-9e9f-f26725d30d63', 'fc1513bd-e18c-44c4-85a9-681515bcb323', 'eef38352-ce53-468d-8b2a-d0c42fec6b3d', 'reunion_presencial', 'no_interesado', NULL, 'ARS', 'Tiempo de entrega', 450000, NULL, NULL, 'Necesitaba para la semana. No llegábamos.',       '2026-04-15'),
  ('35a14b42-5c8c-4cbe-8776-8ed8f6ba7325', '94a15ed5-c9a1-4818-b370-67c40e6a297a', '76561522-9bc2-45aa-82e1-8e7b4a6cf2c7', 'whatsapp',       'no_interesado', NULL, 'ARS', 'Necesidad no confirmada', 350000, NULL, NULL, 'Decidió no renovar piso este año.',              '2026-04-10');

-- ─────────────────────────────────────────────
-- 5. LÍNEAS DE INTERACCIÓN (para ventas y presupuestos)
-- ─────────────────────────────────────────────
INSERT INTO interaction_lines (id, interaction_id, product_id, quantity, unit_price, line_total) VALUES
  -- Venta 1: 50kg pino elliotis
  ('f2e62ef2-6d55-4c0c-a352-1aaafab876e4', 'ec8d8e83-354e-4406-b283-cc8fb3f0beb9', '14f3e1de-1f3b-439b-a933-efc73c8c52bf', 50,  8500,  425000),
  -- Venta 2: 30kg pino elliotis
  ('9a1d80f8-368d-41d7-81f3-92f6e2caf591', '5b5545b0-7098-4002-9955-7ac907d43f9d', '14f3e1de-1f3b-439b-a933-efc73c8c52bf', 30,  8500,  255000),
  -- Venta 3: 3m3 pino paraná
  ('4fe89505-2c18-4c5e-ab0d-c37c6a3ad665', '4beb469a-f450-49dc-8c41-e0d4586dd81b', '7aee65fc-32bf-4f3d-b214-e0e93f5b354b', 3,   180000, 540000),
  -- Venta 5: 3m3 eucalipto
  ('71268f40-bb04-4174-a17d-e097355d8a2a', 'b48839c3-e050-425c-b98e-89aa62616590', 'efbba8c8-9d25-461d-a2e9-252762ee1aaa', 3,   220000, 660000),
  -- Venta 6: 40kg eucalipto
  ('4c5f1d6e-2c8c-4d74-afee-ea2bc5352c46', 'db355c65-ce7b-4d65-9679-08e9f7fcc205', '449f0657-2828-45ae-a24d-02aa8cf9094c', 40,  8500,   340000),
  -- Presupuesto 1: 5m3 pino
  ('0161b849-177a-46e8-a21b-7e298054ad70', '252d3e74-b43e-434c-b1a1-7ef48e01a4c7', '7aee65fc-32bf-4f3d-b214-e0e93f5b354b', 5,   180000, 900000),
  -- Presupuesto 3: 20kg eucalipto + servicio
  ('5270a9cc-c890-4515-ac16-33962b83745c', '8f2e8adf-5640-473a-872e-9e749abf6468', '449f0657-2828-45ae-a24d-02aa8cf9094c', 20,  8500,   170000),
  -- Presupuesto 4: 2m3 eucalipto
  ('2b58f408-dbda-44d9-ae06-c9684c3d09fc', '24f5436b-f6e0-4caf-8941-b4fa649d1bb4', 'efbba8c8-9d25-461d-a2e9-252762ee1aaa', 2,   220000, 440000);

-- ─────────────────────────────────────────────
-- 6. VERIFICACIÓN
-- ─────────────────────────────────────────────
-- Después de ejecutar, verificá con:
-- SELECT count(*) FROM clients;          -- Debe dar 8
-- SELECT count(*) FROM interactions;     -- Debe dar 19
-- SELECT count(*) FROM products;         -- Debe dar 5
-- SELECT count(*) FROM profiles;         -- Debe dar 3
-- SELECT count(*) FROM interaction_lines;-- Debe dar 8
