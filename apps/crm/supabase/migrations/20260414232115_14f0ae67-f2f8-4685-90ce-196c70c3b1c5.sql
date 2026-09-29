
DROP POLICY "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
