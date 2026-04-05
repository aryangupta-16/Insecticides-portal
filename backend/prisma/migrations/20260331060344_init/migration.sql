-- CreateTable
CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL DEFAULT 'Queued for processing',
    "errorReport" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyData" (
    "id" TEXT NOT NULL,
    "vp" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zm" TEXT NOT NULL,
    "concernedStaff" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sales" DECIMAL(18,2) NOT NULL,
    "totalOutstanding" DECIMAL(18,2) NOT NULL,
    "aging0To90" DECIMAL(18,2) NOT NULL,
    "aging91To120" DECIMAL(18,2) NOT NULL,
    "aging121To150" DECIMAL(18,2) NOT NULL,
    "aging151To180" DECIMAL(18,2) NOT NULL,
    "agingAbove180" DECIMAL(18,2) NOT NULL,
    "rowSequence" INTEGER NOT NULL,
    "uploadBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "rowSequence" INTEGER NOT NULL,
    "zmComment" TEXT NOT NULL DEFAULT '',
    "concernedStaffComment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadBatch_month_year_idx" ON "UploadBatch"("month", "year");

-- CreateIndex
CREATE INDEX "MonthlyData_month_year_idx" ON "MonthlyData"("month", "year");

-- CreateIndex
CREATE INDEX "MonthlyData_state_idx" ON "MonthlyData"("state");

-- CreateIndex
CREATE INDEX "MonthlyData_zm_idx" ON "MonthlyData"("zm");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyData_month_year_rowSequence_key" ON "MonthlyData"("month", "year", "rowSequence");

-- CreateIndex
CREATE INDEX "Comment_month_year_idx" ON "Comment"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_month_year_rowSequence_key" ON "Comment"("month", "year", "rowSequence");

-- AddForeignKey
ALTER TABLE "MonthlyData" ADD CONSTRAINT "MonthlyData_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
