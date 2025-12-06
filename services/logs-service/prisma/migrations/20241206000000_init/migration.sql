-- CreateTable
CREATE TABLE
    "logs" (
        "id" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "service_name" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "user_id" TEXT,
        "details" JSONB,
        "ip_address" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE INDEX "logs_service_name_idx" ON "logs" ("service_name");

-- CreateIndex
CREATE INDEX "logs_action_idx" ON "logs" ("action");

-- CreateIndex
CREATE INDEX "logs_user_id_idx" ON "logs" ("user_id");

-- CreateIndex
CREATE INDEX "logs_timestamp_idx" ON "logs" ("timestamp");