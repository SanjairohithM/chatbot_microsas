/*
  Warnings:

  - A unique constraint covering the columns `[user_id,name]` on the table `bots` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bots" ADD COLUMN     "bot_avatar" TEXT,
ADD COLUMN     "bot_avatar_data" BYTEA,
ADD COLUMN     "bot_avatar_type" TEXT,
ADD COLUMN     "wordpress_site_id" TEXT;

-- CreateTable
CREATE TABLE "bot_tokens" (
    "id" SERIAL NOT NULL,
    "bot_id" INTEGER NOT NULL,
    "token_name" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "secret_key" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expires_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "bot_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordpress_sites" (
    "id" TEXT NOT NULL,
    "site_url" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "admin_email" TEXT,
    "wordpress_version" TEXT,
    "access_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sync" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wordpress_sites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bot_tokens_access_token_key" ON "bot_tokens"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "bot_tokens_secret_key_key" ON "bot_tokens"("secret_key");

-- CreateIndex
CREATE INDEX "bot_tokens_bot_id_idx" ON "bot_tokens"("bot_id");

-- CreateIndex
CREATE INDEX "bot_tokens_access_token_idx" ON "bot_tokens"("access_token");

-- CreateIndex
CREATE INDEX "bot_tokens_is_active_idx" ON "bot_tokens"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_sites_site_url_key" ON "wordpress_sites"("site_url");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_sites_access_token_key" ON "wordpress_sites"("access_token");

-- CreateIndex
CREATE INDEX "wordpress_sites_site_url_idx" ON "wordpress_sites"("site_url");

-- CreateIndex
CREATE INDEX "wordpress_sites_access_token_idx" ON "wordpress_sites"("access_token");

-- CreateIndex
CREATE INDEX "wordpress_sites_is_active_idx" ON "wordpress_sites"("is_active");

-- CreateIndex
CREATE INDEX "bots_user_id_idx" ON "bots"("user_id");

-- CreateIndex
CREATE INDEX "bots_status_idx" ON "bots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bots_user_id_name_key" ON "bots"("user_id", "name");

-- AddForeignKey
ALTER TABLE "bots" ADD CONSTRAINT "bots_wordpress_site_id_fkey" FOREIGN KEY ("wordpress_site_id") REFERENCES "wordpress_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_tokens" ADD CONSTRAINT "bot_tokens_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
