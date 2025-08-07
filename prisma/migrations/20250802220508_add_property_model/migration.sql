/*
  Warnings:

  - You are about to drop the column `contactPhone` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `forType` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."File" DROP CONSTRAINT "File_propertyId_fkey";

-- DropIndex
DROP INDEX "public"."Property_price_idx";

-- AlterTable
ALTER TABLE "public"."Property" DROP COLUMN "contactPhone",
ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "areaUnit" TEXT,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "forType" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."File";
