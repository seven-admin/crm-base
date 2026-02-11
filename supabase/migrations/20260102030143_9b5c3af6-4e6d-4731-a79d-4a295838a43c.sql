-- Add RLS policy for imobiliárias to view their linked clients
CREATE POLICY "Imobiliárias can view linked clientes" 
ON public.clientes 
FOR SELECT
USING (
  imobiliaria_id IN (
    SELECT i.id
    FROM imobiliarias i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = auth.uid()
  )
);

-- Add RLS policy for imobiliárias to update their linked clients
CREATE POLICY "Imobiliárias can update linked clientes" 
ON public.clientes 
FOR UPDATE
USING (
  imobiliaria_id IN (
    SELECT i.id
    FROM imobiliarias i
    JOIN profiles p ON p.email = i.email
    WHERE p.id = auth.uid()
  )
);