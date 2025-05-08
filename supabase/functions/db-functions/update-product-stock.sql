
CREATE OR REPLACE FUNCTION public.update_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock FROM products WHERE id = p_product_id;
    
    -- Update stock (ensure it never goes below 0)
    UPDATE products 
    SET stock = GREATEST(0, current_stock + p_quantity) 
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
