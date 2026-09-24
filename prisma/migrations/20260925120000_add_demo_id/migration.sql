-- AlterTable: отдельный идентификатор для публичной демо-ссылки — раньше
-- /demo/[uuid] использовал Order.id, из-за чего демо-ссылка раскрывала
-- адрес настоящего квеста /q/[uuid].
ALTER TABLE "Order" ADD COLUMN "demoId" TEXT;

-- Заполняем существующие заказы (новые получают значение от Prisma Client).
UPDATE "Order" SET "demoId" = gen_random_uuid()::text WHERE "demoId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "demoId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_demoId_key" ON "Order"("demoId");
