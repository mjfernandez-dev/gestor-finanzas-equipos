-- Agrega columna expense_group_id a transactions
-- Esta columna agrupa los débitos creados en una misma acción de "Crear Gasto".
-- Los créditos (pagos) pueden referenciarla para indicar qué gasto están saldando.

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS expense_group_id uuid;

COMMENT ON COLUMN transactions.expense_group_id IS
'Agrupa los débitos creados en una misma acción de Crear Gasto. Los créditos pueden referenciarlo para indicar qué gasto están pagando.';

CREATE INDEX IF NOT EXISTS idx_transactions_expense_group_id
ON transactions(expense_group_id);
