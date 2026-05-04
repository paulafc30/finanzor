-- =====================================================
-- IMPORT INICIAL: jgarciaperez750@gmail.com
-- Datos extraídos del Finanzor antiguo (Hercules), captura "Marzo 2026"
-- 59 movimientos: 7 ingresos + 52 gastos
-- Las fechas se reparten en marzo/abril/mayo 2026 según occurred_on real
--
-- INSTRUCCIONES:
-- 1. El usuario tiene que haberse registrado antes en Finanzor (con Google
--    o email/contraseña). Da igual cuándo, solo tiene que existir su cuenta.
-- 2. Pega TODO este script en el SQL Editor de Supabase y dale a Run.
-- 3. Si ya tenía movimientos importados antes, el script aborta para no
--    duplicar. En ese caso, bórralos primero o avísame y hacemos un script
--    de "reset" antes de reimportar.
-- =====================================================

DO $$
DECLARE
  v_user_id uuid;
  v_cat_vivienda   uuid;
  v_cat_ahorro     uuid;
  v_cat_comida     uuid;
  v_cat_gimnasio   uuid;
  v_cat_salud      uuid;
  v_cat_caprichos  uuid;
  v_cat_transporte uuid;
  v_cat_ocio       uuid;
  v_cat_otros      uuid;
BEGIN
  -- 1. Buscar user_id por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jgarciaperez750@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe un usuario con email jgarciaperez750@gmail.com. Que se registre primero en la app.';
  END IF;

  -- 2. Guarda anti-duplicado: abortar si ya tiene movimientos
  IF EXISTS (SELECT 1 FROM public.transactions WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'El usuario ya tiene movimientos cargados. Bórralos antes de re-importar.';
  END IF;

  -- 3. Resolver IDs de categorías default del usuario
  SELECT id INTO v_cat_vivienda   FROM public.categories WHERE user_id = v_user_id AND name = 'Vivienda';
  SELECT id INTO v_cat_ahorro     FROM public.categories WHERE user_id = v_user_id AND name = 'Ahorro';
  SELECT id INTO v_cat_comida     FROM public.categories WHERE user_id = v_user_id AND name = 'Comida';
  SELECT id INTO v_cat_gimnasio   FROM public.categories WHERE user_id = v_user_id AND name = 'Gimnasio';
  SELECT id INTO v_cat_salud      FROM public.categories WHERE user_id = v_user_id AND name = 'Salud';
  SELECT id INTO v_cat_caprichos  FROM public.categories WHERE user_id = v_user_id AND name = 'Caprichos';
  SELECT id INTO v_cat_transporte FROM public.categories WHERE user_id = v_user_id AND name = 'Transporte';
  SELECT id INTO v_cat_ocio       FROM public.categories WHERE user_id = v_user_id AND name = 'Ocio';
  SELECT id INTO v_cat_otros      FROM public.categories WHERE user_id = v_user_id AND name = 'Otros';

  IF v_cat_otros IS NULL THEN
    RAISE EXCEPTION 'No se encontraron las categorías por defecto. ¿Se ejecutó el trigger de seed al crear el usuario?';
  END IF;

  -- 4. Insertar todos los movimientos
  -- Categorías re-mapeadas desde "Otros" (en Hercules todo era Otros) según contexto.
  -- Importes, descripciones y fechas se mantienen exactamente igual al original.
  INSERT INTO public.transactions
    (user_id, type, amount, description, category_id, occurred_on)
  VALUES
    -- ===== Mayo 2026 =====
    (v_user_id, 'expense',   30.00, 'Gym',                         v_cat_gimnasio,   '2026-05-04'),
    (v_user_id, 'expense',  337.15, 'Alquiler',                    v_cat_vivienda,   '2026-05-04'),
    (v_user_id, 'income',  1051.33, 'Nomina',                      NULL,             '2026-05-04'),
    (v_user_id, 'expense',   88.00, 'Gastos Madrid',               v_cat_otros,      '2026-05-04'),

    -- ===== Abril 2026 =====
    (v_user_id, 'income',    50.00, 'Dinero de mamá',              NULL,             '2026-04-30'),
    (v_user_id, 'expense',   10.00, 'Brawlpass',                   v_cat_ocio,       '2026-04-30'),
    (v_user_id, 'income',    25.00, 'Abuela',                      NULL,             '2026-04-30'),
    (v_user_id, 'expense',   12.00, 'Peluquero',                   v_cat_caprichos,  '2026-04-30'),
    (v_user_id, 'expense',   14.00, 'Blablacar',                   v_cat_transporte, '2026-04-28'),
    (v_user_id, 'expense',   12.00, 'Kfc',                         v_cat_comida,     '2026-04-26'),
    (v_user_id, 'expense',   99.00, 'Gasoil',                      v_cat_transporte, '2026-04-26'),
    (v_user_id, 'expense',   17.19, 'Compra chino',                v_cat_otros,      '2026-04-25'),
    (v_user_id, 'expense',   12.40, 'Compra carrefour',            v_cat_comida,     '2026-04-21'),
    (v_user_id, 'expense',   35.00, 'Luz',                         v_cat_vivienda,   '2026-04-20'),
    (v_user_id, 'expense',   20.00, 'Compra',                      v_cat_comida,     '2026-04-19'),
    (v_user_id, 'expense',    7.00, 'Cosas chino',                 v_cat_otros,      '2026-04-18'),
    (v_user_id, 'expense',   21.60, 'Pedido rosarios',             v_cat_otros,      '2026-04-18'),
    (v_user_id, 'expense',    1.30, 'Parking Fuengirola',          v_cat_transporte, '2026-04-18'),
    (v_user_id, 'expense',   16.30, 'Hamburguesa marvelous',       v_cat_comida,     '2026-04-18'),
    (v_user_id, 'expense',   12.72, 'Condones y lubricante',       v_cat_salud,      '2026-04-18'),
    (v_user_id, 'expense',   32.00, 'Pantalones cortos carrefour', v_cat_caprichos,  '2026-04-18'),
    (v_user_id, 'expense',   11.99, 'Hotwheels premium',           v_cat_caprichos,  '2026-04-18'),
    (v_user_id, 'expense',    5.00, 'Hotwheels',                   v_cat_caprichos,  '2026-04-17'),
    (v_user_id, 'expense',    2.50, 'Monster',                     v_cat_comida,     '2026-04-17'),
    (v_user_id, 'expense',  122.00, 'Piso Madrid',                 v_cat_vivienda,   '2026-04-15'),
    (v_user_id, 'expense',    1.87, 'Crunchy',                     v_cat_ocio,       '2026-04-13'),
    (v_user_id, 'expense',    3.60, 'Spoty',                       v_cat_ocio,       '2026-04-13'),
    (v_user_id, 'expense',    7.00, 'Recreativos minigolf Torremolinos', v_cat_ocio, '2026-04-13'),
    (v_user_id, 'expense',   21.70, 'Five guys',                   v_cat_comida,     '2026-04-12'),
    (v_user_id, 'expense',    1.80, 'Monster blanco',              v_cat_comida,     '2026-04-12'),
    (v_user_id, 'expense',   10.00, 'Battlepass r6',               v_cat_ocio,       '2026-04-11'),
    (v_user_id, 'expense',    3.00, 'Lavar coche',                 v_cat_transporte, '2026-04-10'),
    (v_user_id, 'expense',    3.60, 'Agua',                        v_cat_vivienda,   '2026-04-10'),
    (v_user_id, 'expense',    2.70, 'Pan',                         v_cat_comida,     '2026-04-07'),
    (v_user_id, 'expense',   34.00, 'Mercadona',                   v_cat_comida,     '2026-04-06'),
    (v_user_id, 'expense',   60.00, 'Gasoil laguna',               v_cat_transporte, '2026-04-05'),
    (v_user_id, 'expense',   30.00, 'Gasoil pegotillo',            v_cat_transporte, '2026-04-05'),
    (v_user_id, 'expense',    5.00, 'Copa',                        v_cat_ocio,       '2026-04-05'),
    (v_user_id, 'expense',   18.10, 'Cena',                        v_cat_ocio,       '2026-04-05'),
    (v_user_id, 'expense',   11.90, 'Cena y copa',                 v_cat_ocio,       '2026-04-04'),
    (v_user_id, 'income',    50.00, 'Regalo abuela',               NULL,             '2026-04-03'),
    (v_user_id, 'expense',   10.00, 'Copas',                       v_cat_ocio,       '2026-04-03'),
    (v_user_id, 'expense',   14.00, 'Cena sevillano',              v_cat_ocio,       '2026-04-02'),
    (v_user_id, 'expense',    8.00, 'Alcohol',                     v_cat_ocio,       '2026-04-02'),
    (v_user_id, 'expense',    8.00, 'Domino''s',                   v_cat_comida,     '2026-04-01'),
    (v_user_id, 'expense',    1.90, 'Café',                        v_cat_comida,     '2026-04-01'),
    (v_user_id, 'expense',  388.00, 'Alquiler y deuda Paula',      v_cat_vivienda,   '2026-04-01'),
    (v_user_id, 'expense',    6.90, 'Cena argentino',              v_cat_ocio,       '2026-04-01'),

    -- ===== Marzo 2026 =====
    (v_user_id, 'expense',    5.00, 'Horwi',                       v_cat_otros,      '2026-03-31'),
    (v_user_id, 'expense',    5.00, 'Cervezas pi',                 v_cat_ocio,       '2026-03-31'),
    (v_user_id, 'income',  1091.00, 'Nomina',                      NULL,             '2026-03-31'),
    (v_user_id, 'expense',   15.30, 'Pelu',                        v_cat_caprichos,  '2026-03-31'),
    (v_user_id, 'expense',   42.00, 'Gasoil',                      v_cat_transporte, '2026-03-28'),
    (v_user_id, 'expense',    2.03, 'Recarga',                     v_cat_otros,      '2026-03-25'),
    (v_user_id, 'income',    20.00, 'Bizum Paula gasoil',          NULL,             '2026-03-25'),
    (v_user_id, 'expense',   30.02, 'Compra',                      v_cat_comida,     '2026-03-25'),
    (v_user_id, 'expense',   12.50, 'Compra chino',                v_cat_otros,      '2026-03-22'),
    (v_user_id, 'expense',   23.00, 'Medicinas',                   v_cat_salud,      '2026-03-20'),
    (v_user_id, 'income',   104.85, 'Resto de mes',                NULL,             '2026-03-18');

  RAISE NOTICE 'Importados 59 movimientos para %', v_user_id;
END $$;
