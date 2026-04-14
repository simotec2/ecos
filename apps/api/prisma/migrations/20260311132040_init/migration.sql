/*
  Warnings:

  - You are about to drop the column `usuarioEmpresaEmail` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioEmpresaNombre` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioEmpresaTelefono` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `answerOption` on the `EvaluationAnswer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rut]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" REAL,
    "resultJson" TEXT,
    "reportText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EvaluationSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvaluationResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvaluationResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "razonSocial" TEXT,
    "rut" TEXT,
    "direccion" TEXT,
    "giro" TEXT,
    "contactoNombre" TEXT,
    "contactoTelefono" TEXT,
    "contactoEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Company" ("contactoEmail", "contactoNombre", "contactoTelefono", "createdAt", "direccion", "giro", "id", "name", "razonSocial", "rut") SELECT "contactoEmail", "contactoNombre", "contactoTelefono", "createdAt", "direccion", "giro", "id", "name", "razonSocial", "rut" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_rut_key" ON "Company"("rut");
CREATE TABLE "new_Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "questionsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Evaluation" ("code", "createdAt", "description", "id", "name", "questionsJson") SELECT "code", "createdAt", "description", "id", "name", "questionsJson" FROM "Evaluation";
DROP TABLE "Evaluation";
ALTER TABLE "new_Evaluation" RENAME TO "Evaluation";
CREATE UNIQUE INDEX "Evaluation_code_key" ON "Evaluation"("code");
CREATE TABLE "new_EvaluationAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "competent" BOOLEAN,
    "aiScore" REAL,
    "aiAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvaluationAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "EvaluationSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvaluationAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "EvaluationQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EvaluationAnswer" ("answerText", "createdAt", "id", "questionId", "sessionId") SELECT "answerText", "createdAt", "id", "questionId", "sessionId" FROM "EvaluationAnswer";
DROP TABLE "EvaluationAnswer";
ALTER TABLE "new_EvaluationAnswer" RENAME TO "EvaluationAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Participant_rut_key" ON "Participant"("rut");
