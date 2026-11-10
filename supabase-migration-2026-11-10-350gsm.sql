-- Wayne, 2026-11-10: add 350gsm paper weight (caliper 0.34mm).
insert into gsm (gsm, mm)
select 350, 0.34
where not exists (select 1 from gsm where gsm = 350);
