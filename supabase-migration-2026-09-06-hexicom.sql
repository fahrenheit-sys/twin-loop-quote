-- Hexicom (ePrint) integration — every quote we issue is posted to Hexicom as an
-- Order. Wayne converts the ones that proceed into Jobs, which is where the
-- production work tickets come from.
--
-- The payload is stored on the row so a failed send can be retried from the
-- admin without recomputing the pricing split, which depends on values that only
-- exist in the browser at quote time.

alter table quotes add column if not exists hexicom_status   text;         -- sent | failed | skipped
alter table quotes add column if not exists hexicom_order_no text;         -- Hexicom's order number, once created
alter table quotes add column if not exists hexicom_item_nos text;         -- its per-item numbers, one per work station
alter table quotes add column if not exists hexicom_sent_at  timestamptz;
alter table quotes add column if not exists hexicom_error    text;         -- raw response when a send fails
alter table quotes add column if not exists hexicom_payload  jsonb;        -- exactly what we posted, for retries

-- Binding edge is asked at quote time and printed on the production ticket for
-- wire, plastic spiral and comb binding.
alter table quotes add column if not exists bind_edge text;

create index if not exists quotes_hexicom_status_idx on quotes (hexicom_status);
