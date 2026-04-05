/*
  Warnings:

  - You are about to drop the column `concernedStaffComment` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `aging0To90` on the `MonthlyData` table. All the data in the column will be lost.
  - You are about to drop the column `aging91To120` on the `MonthlyData` table. All the data in the column will be lost.
  - You are about to drop the column `agingAbove180` on the `MonthlyData` table. All the data in the column will be lost.
  - You are about to drop the column `concernedStaff` on the `MonthlyData` table. All the data in the column will be lost.
  - You are about to drop the column `sales` on the `MonthlyData` table. All the data in the column will be lost.
  - You are about to drop the column `zm` on the `MonthlyData` table. All the data in the column will be lost.
  - Added the required column `aging181To240` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aging241To365` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aging366To540` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agingAbove540` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `party` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partyId` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staff` to the `MonthlyData` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MonthlyData_zm_idx";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "concernedStaffComment",
ADD COLUMN     "staffComment" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "MonthlyData" DROP COLUMN "aging0To90",
DROP COLUMN "aging91To120",
DROP COLUMN "agingAbove180",
DROP COLUMN "concernedStaff",
DROP COLUMN "sales",
DROP COLUMN "zm",
ADD COLUMN     "aging181To240" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "aging241To365" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "aging366To540" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "agingAbove540" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "party" TEXT NOT NULL,
ADD COLUMN     "partyId" TEXT NOT NULL,
ADD COLUMN     "staff" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MonthlyData_staff_idx" ON "MonthlyData"("staff");

-- CreateIndex
CREATE INDEX "MonthlyData_partyId_idx" ON "MonthlyData"("partyId");
