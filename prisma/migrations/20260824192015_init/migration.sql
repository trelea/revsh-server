-- CreateEnum
CREATE TYPE "OSPlatform" AS ENUM ('Windows', 'Linux', 'MacOS');

-- CreateEnum
CREATE TYPE "VictimState" AS ENUM ('Online', 'Offline');

-- CreateTable
CREATE TABLE "victims" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "os" "OSPlatform" NOT NULL,
    "os_version" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "public_ip" TEXT NOT NULL,
    "local_ip" TEXT NOT NULL,
    "mac_address" TEXT NOT NULL,
    "state" "VictimState",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "victims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "victims_machine_id_key" ON "victims"("machine_id");

-- CreateIndex
CREATE INDEX "victims_machine_id_idx" ON "victims"("machine_id");
