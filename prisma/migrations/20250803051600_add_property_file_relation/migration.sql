/*
  Warnings:

  - The values [STUDIO] on the enum `PropertyType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PropertyType_new" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'PLOT');
ALTER TABLE "public"."Property" ALTER COLUMN "propertyType" TYPE "public"."PropertyType_new" USING ("propertyType"::text::"public"."PropertyType_new");
ALTER TYPE "public"."PropertyType" RENAME TO "PropertyType_old";
ALTER TYPE "public"."PropertyType_new" RENAME TO "PropertyType";
DROP TYPE "public"."PropertyType_old";
COMMIT;

-- CreateTable
CREATE TABLE "public"."PropertyFile" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PropertyFile" ADD CONSTRAINT "PropertyFile_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
