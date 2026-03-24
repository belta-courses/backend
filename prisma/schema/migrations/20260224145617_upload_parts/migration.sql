-- CreateTable
CREATE TABLE "UploadedPart" (
    "id" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "etag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadRecordId" TEXT NOT NULL,

    CONSTRAINT "UploadedPart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadedPart_uploadRecordId_partNumber_key" ON "UploadedPart"("uploadRecordId", "partNumber");

-- AddForeignKey
ALTER TABLE "UploadedPart" ADD CONSTRAINT "UploadedPart_uploadRecordId_fkey" FOREIGN KEY ("uploadRecordId") REFERENCES "MultiPartUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
