-- Site-wide public contact: reach@thehormoneessentials.com
UPDATE public.pages
SET body_md = REPLACE(body_md, 'hello@thehormoneessentials.com', 'reach@thehormoneessentials.com')
WHERE body_md LIKE '%hello@thehormoneessentials.com%';

UPDATE public.pages
SET body_md = REPLACE(body_md, 'noreply@thehormoneessentials.com', 'reach@thehormoneessentials.com')
WHERE body_md LIKE '%noreply@thehormoneessentials.com%';
