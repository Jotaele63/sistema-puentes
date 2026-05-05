-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_logs_auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "tablaAfectada" TEXT,
    "registroId" TEXT,
    "cambios" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_logs_auditoria" ("accion", "cambios", "id", "ipAddress", "registroId", "tablaAfectada", "timestamp", "userAgent", "usuarioId") SELECT "accion", "cambios", "id", "ipAddress", "registroId", "tablaAfectada", "timestamp", "userAgent", "usuarioId" FROM "logs_auditoria";
DROP TABLE "logs_auditoria";
ALTER TABLE "new_logs_auditoria" RENAME TO "logs_auditoria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
