-- 0008: Economy tuning — starting credits 250k → 1M, update handle_new_user()

-- 1. Update default starting credits
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 1000000;

-- 2. Recreate handle_new_user() with new starting credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, credits)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    COALESCE(new.raw_user_meta_data ->> 'display_name', 'Collector'),
    1000000
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
