/*
  Warnings:

  - Added the required column `updatedAt` to the `channel_connections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "channel_connections" ADD COLUMN     "displayLabel" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
