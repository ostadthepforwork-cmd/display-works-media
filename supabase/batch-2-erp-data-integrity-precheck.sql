-- Batch 2 production checkpoint. Read-only: this file performs no writes.

select doc_no,
       count(*) as historical_rows,
       count(*) filter (where deleted is not true) as active_rows
from public.erp_documents
group by doc_no
having count(*) > 1
order by doc_no;

select status,
       coalesce(payment_status, '<NULL>') as payment_status,
       count(*) as rows,
       count(*) filter (where payment_amount is null or payment_amount = 0) as missing_payment_amount_rows
from public.erp_documents
where status = 'paid'
group by status, payment_status
order by payment_status;

select coalesce(payment_status, '<NULL>') as payment_status,
       count(*) as rows
from public.erp_documents
group by payment_status
order by payment_status;

select count(*) filter (where cost_snapshot = 0) as zero_cost_snapshots,
       count(*) filter (where cost_snapshot is null) as null_cost_snapshots,
       count(*) filter (where nullif(btrim(name), '') is null) as blank_item_names
from public.erp_document_items;

with candidates as (
  select i.document_id,
         i.id as item_id,
         i.name as snapshot_product_name,
         count(p.id) as exact_match_count,
         min(p.id::text)::uuid as proposed_product_id,
         min(p.name) as current_product_name
  from public.erp_document_items i
  left join public.erp_products p
    on lower(btrim(p.name)) = lower(btrim(i.name))
  group by i.document_id, i.id, i.name
)
select document_id,
       item_id,
       snapshot_product_name,
       proposed_product_id,
       current_product_name,
       case
         when nullif(btrim(snapshot_product_name), '') is null then 'blank snapshot name'
         when exact_match_count = 1 then 'exact normalized name; unambiguous'
         when exact_match_count > 1 then 'ambiguous exact normalized name'
         else 'unmatched'
       end as confidence_reason
from candidates
order by document_id, item_id;

with candidates as (
  select i.document_id,
         i.id as item_id,
         i.supplier_name as snapshot_supplier_name,
         count(s.id) as exact_match_count,
         min(s.id::text)::uuid as proposed_supplier_id,
         min(s.name) as current_supplier_name
  from public.erp_document_items i
  left join public.erp_suppliers s
    on lower(btrim(s.name)) = lower(btrim(i.supplier_name))
  where nullif(btrim(i.supplier_name), '') is not null
  group by i.document_id, i.id, i.supplier_name
)
select document_id,
       item_id,
       snapshot_supplier_name,
       proposed_supplier_id,
       current_supplier_name,
       case
         when exact_match_count = 1 then 'exact normalized name; unambiguous'
         when exact_match_count > 1 then 'ambiguous exact normalized name'
         else 'unmatched'
       end as confidence_reason
from candidates
order by document_id, item_id;

select child.id as document_id,
       child.type as document_type,
       child.order_id as parent_document_id,
       parent.type as parent_document_type,
       (parent.id is null) as broken_link,
       (child.id = child.order_id) as self_link
from public.erp_documents child
left join public.erp_documents parent on parent.id = child.order_id
where child.order_id is not null
order by child.created_at, child.id;
