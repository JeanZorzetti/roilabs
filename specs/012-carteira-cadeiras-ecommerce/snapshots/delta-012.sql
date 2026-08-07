-- DropForeignKey
ALTER TABLE "negocios_originados" DROP CONSTRAINT "negocios_originados_pedido_id_fkey";

-- AlterTable
ALTER TABLE "cadeiras" ADD COLUMN     "da_casa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'vaga',
ADD COLUMN     "exibir_da_casa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repo_url" TEXT,
ADD COLUMN     "site_url" TEXT;

-- AlterTable
ALTER TABLE "negocios_originados" ADD COLUMN     "cliente_ref" TEXT,
ADD COLUMN     "origem" TEXT NOT NULL DEFAULT 'pedido',
ADD COLUMN     "venda_id" TEXT,
ALTER COLUMN "pedido_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "produtos_cadeira" (
    "id" TEXT NOT NULL,
    "cadeira_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "recorrencia" TEXT NOT NULL DEFAULT 'unica',
    "modo_cobranca" TEXT NOT NULL,
    "checkout_url" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_cadeira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas_parceiro" (
    "id" TEXT NOT NULL,
    "parceiro_id" TEXT,
    "gateway" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "pagamento_id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "cliente_doc" TEXT,
    "cliente_ref" TEXT,
    "payload" JSONB NOT NULL,
    "motivo_descarte" TEXT,
    "recebido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_parceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credenciais_gateway" (
    "id" TEXT NOT NULL,
    "parceiro_id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "conta_ref" TEXT NOT NULL,
    "segredo_ref" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credenciais_gateway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_cadeira_cadeira_id_key" ON "produtos_cadeira"("cadeira_id");

-- CreateIndex
CREATE INDEX "vendas_parceiro_parceiro_id_cliente_ref_idx" ON "vendas_parceiro"("parceiro_id", "cliente_ref");

-- CreateIndex
CREATE UNIQUE INDEX "vendas_parceiro_gateway_evento_id_key" ON "vendas_parceiro"("gateway", "evento_id");

-- CreateIndex
CREATE INDEX "credenciais_gateway_parceiro_id_idx" ON "credenciais_gateway"("parceiro_id");

-- CreateIndex
CREATE UNIQUE INDEX "credenciais_gateway_gateway_conta_ref_key" ON "credenciais_gateway"("gateway", "conta_ref");

-- CreateIndex
CREATE UNIQUE INDEX "cadeiras_site_url_key" ON "cadeiras"("site_url");

-- CreateIndex
CREATE INDEX "negocios_originados_parceiro_id_cliente_ref_idx" ON "negocios_originados"("parceiro_id", "cliente_ref");

-- AddForeignKey
ALTER TABLE "produtos_cadeira" ADD CONSTRAINT "produtos_cadeira_cadeira_id_fkey" FOREIGN KEY ("cadeira_id") REFERENCES "cadeiras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_parceiro" ADD CONSTRAINT "vendas_parceiro_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credenciais_gateway" ADD CONSTRAINT "credenciais_gateway_parceiro_id_fkey" FOREIGN KEY ("parceiro_id") REFERENCES "parceiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios_originados" ADD CONSTRAINT "negocios_originados_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocios_originados" ADD CONSTRAINT "negocios_originados_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas_parceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 6.3.0 -> 7.9.1                        │
