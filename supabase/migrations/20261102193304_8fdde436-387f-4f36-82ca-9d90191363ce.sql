-- 1. Hide private serial at column level
REVOKE SELECT ON public.listings FROM anon, authenticated;
GRANT SELECT (id, owner_id, owner_display_name, owner_joined_at, brand, model, reference, price_eur, condition, movement_type, approx_year, description, box_included, papers_included, accessories_notes, approx_location, authenticity_declaration, known_modifications, serial_number_masked, status, review_status, is_demo, published_at, created_at, updated_at, listing_type, part_type, part_origin, part_reference, part_reference_normalized, declared_compatible_with, declared_compatible_normalized, search_text) ON public.listings TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_listing_serial(p_listing_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select l.serial_number_private from public.listings l
  where l.id = p_listing_id and (l.owner_id = auth.uid() or public.is_marketplace_moderator(auth.uid()));
$$;
REVOKE EXECUTE ON FUNCTION public.get_listing_serial(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_serial(uuid) TO authenticated;

-- 2. Notifications with message
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN ('search_alert_match','listing_approved','listing_rejected'));

-- 3. Moderation RPC
CREATE OR REPLACE FUNCTION public.moderate_listing(p_listing_id uuid, p_decision text, p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare v_owner uuid; v_status text; v_msg text := left(trim(coalesce(p_message,'')), 1000);
begin
  if not public.is_marketplace_moderator(auth.uid()) then raise exception 'Solo los moderadores pueden revisar anuncios.'; end if;
  if p_decision not in ('approve','reject') then raise exception 'Decisión no válida.'; end if;
  if p_decision = 'reject' and char_length(v_msg) < 5 then raise exception 'Escribe el motivo del rechazo para el vendedor.'; end if;
  select owner_id into v_owner from public.listings where id = p_listing_id;
  if v_owner is null then raise exception 'Anuncio no encontrado.'; end if;
  v_status := case when p_decision = 'approve' then 'passed_photo_review' else 'rejected' end;
  update public.listings set review_status = v_status where id = p_listing_id;
  insert into public.authenticity_reviews (listing_id, status, method, internal_reasons, public_note, reviewer_id)
  values (p_listing_id, v_status, 'manual_moderator', '', v_msg, auth.uid()::text);
  insert into public.notifications (user_id, kind, listing_id, message)
  values (v_owner, case when p_decision = 'approve' then 'listing_approved' else 'listing_rejected' end, p_listing_id, nullif(v_msg,''));
end; $$;
REVOKE EXECUTE ON FUNCTION public.moderate_listing(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.moderate_listing(uuid, text, text) TO authenticated;

-- 4. Storage policies for listing photos (path: <listing_id>/<file>)
CREATE POLICY "Listing photos readable when listing visible" ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos' AND EXISTS (
  select 1 from public.listings l where l.id::text = (storage.foldername(name))[1]
  and ((l.status in ('published','sold') and l.review_status <> 'rejected') or l.owner_id = auth.uid() or public.is_marketplace_moderator(auth.uid()))));
CREATE POLICY "Owners upload listing photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-photos' AND EXISTS (
  select 1 from public.listings l where l.id::text = (storage.foldername(name))[1] and l.owner_id = auth.uid()));
CREATE POLICY "Owners delete listing photos" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'listing-photos' AND EXISTS (
  select 1 from public.listings l where l.id::text = (storage.foldername(name))[1] and l.owner_id = auth.uid()));