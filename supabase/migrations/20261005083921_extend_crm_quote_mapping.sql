begin;

create or replace function public.save_crm_document_mapping_v1(
  p_lead_id uuid,
  p_quote_id uuid,
  p_receipt_id uuid,
  p_mapping_method text,
  p_mapping_confidence numeric default null,
  p_mapping_evidence jsonb default '{}'::jsonb,
  p_mark_won boolean default false
)
returns public.crm_lead_document_mappings
language plpgsql security invoker set search_path = ''
as $$
declare
  result public.crm_lead_document_mappings;
begin
  if coalesce((select private.current_staff_role()), '') not in ('owner', 'admin', 'sales') then
    raise exception 'forbidden';
  end if;

  -- A quote mapping is created before payment; extend that row when its receipt arrives.
  if p_quote_id is not null then
    insert into public.crm_lead_document_mappings as existing (
      lead_id, quote_id, receipt_id, mapping_method, mapping_confidence, mapping_evidence, mapped_by
    ) values (
      p_lead_id, p_quote_id, p_receipt_id, p_mapping_method, p_mapping_confidence,
      coalesce(p_mapping_evidence, '{}'::jsonb), auth.uid()
    )
    on conflict (quote_id) where quote_id is not null do update set
      lead_id = excluded.lead_id,
      receipt_id = coalesce(excluded.receipt_id, existing.receipt_id),
      mapping_method = excluded.mapping_method,
      mapping_confidence = excluded.mapping_confidence,
      mapping_evidence = excluded.mapping_evidence,
      mapped_by = auth.uid()
    where existing.receipt_id is null
      or excluded.receipt_id is null
      or existing.receipt_id = excluded.receipt_id
    returning * into result;
    if not found then
      raise exception 'quote already has a different receipt';
    end if;
  else
    insert into public.crm_lead_document_mappings (
      lead_id, quote_id, receipt_id, mapping_method, mapping_confidence, mapping_evidence, mapped_by
    ) values (
      p_lead_id, p_quote_id, p_receipt_id, p_mapping_method, p_mapping_confidence,
      coalesce(p_mapping_evidence, '{}'::jsonb), auth.uid()
    )
    on conflict (receipt_id) where receipt_id is not null do update set
      lead_id = excluded.lead_id,
      mapping_method = excluded.mapping_method,
      mapping_confidence = excluded.mapping_confidence,
      mapping_evidence = excluded.mapping_evidence,
      mapped_by = auth.uid()
    returning * into result;
  end if;

  if p_mark_won then
    if p_receipt_id is null then raise exception 'Closed Won requires a receipt mapping'; end if;
    update public.crm_leads set lead_status = 'closed_won' where lead_id = p_lead_id;
  end if;
  return result;
end;
$$;

revoke all on function public.save_crm_document_mapping_v1(uuid, uuid, uuid, text, numeric, jsonb, boolean) from public, anon;
grant execute on function public.save_crm_document_mapping_v1(uuid, uuid, uuid, text, numeric, jsonb, boolean) to authenticated, service_role;

commit;
