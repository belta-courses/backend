-- CreateTable
CREATE TABLE "MultiPartUpload" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "partsCount" INTEGER NOT NULL,
    "partsCompleted" INTEGER NOT NULL DEFAULT 0,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "MultiPartUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MultiPartUpload_fileId_key" ON "MultiPartUpload"("fileId");

-- AddForeignKey
ALTER TABLE "MultiPartUpload" ADD CONSTRAINT "MultiPartUpload_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
