-- Order system integrity migration
-- Run once against the production Neon database before deploying the new API.

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS mrp NUMERIC;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS batch_no TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS expiry_date TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx
  ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON public.order_items (order_id);

-- Keep order numbers unique even if older data was created without the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique
  ON public.orders (order_number);
