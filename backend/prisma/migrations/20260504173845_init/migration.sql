-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notificacionesEmail" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoAcceso" DATETIME
);

-- CreateTable
CREATE TABLE "puentes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroRegistro" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "elementoAForzar" TEXT NOT NULL,
    "equipo" TEXT NOT NULL,
    "necesidadMotivo" TEXT NOT NULL,
    "descripcionDetallada" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'BORRADOR',
    "riesgosIdentificados" TEXT,
    "escenariosEmergencia" TEXT,
    "variablesControl" TEXT,
    "valoresMaxMin" TEXT,
    "medidasContencion" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificadoEn" DATETIME NOT NULL,
    "ejecutadoEn" DATETIME,
    "cerradoEn" DATETIME,
    "proximaRenovacion" DATETIME,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "pdfUrl" TEXT,
    "observaciones" TEXT,
    CONSTRAINT "puentes_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aprobaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puenteId" TEXT NOT NULL,
    "aprobadorId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comentarios" TEXT,
    "firmaDigital" TEXT,
    CONSTRAINT "aprobaciones_puenteId_fkey" FOREIGN KEY ("puenteId") REFERENCES "puentes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "aprobaciones_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "controles_periodicos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puenteId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "sigueSiendoNecesario" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "controles_periodicos_puenteId_fkey" FOREIGN KEY ("puenteId") REFERENCES "puentes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "puenteId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notificaciones_puenteId_fkey" FOREIGN KEY ("puenteId") REFERENCES "puentes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipoAuditoria" TEXT NOT NULL,
    "fechaRealizacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "realizadoPorId" TEXT NOT NULL,
    "puentesRevisados" TEXT NOT NULL,
    "puentesEncontrados" INTEGER NOT NULL,
    "estadoCumplimiento" TEXT NOT NULL,
    "observaciones" TEXT,
    "pdfReporte" TEXT,
    CONSTRAINT "auditorias_realizadoPorId_fkey" FOREIGN KEY ("realizadoPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "tablaAfectada" TEXT,
    "registroId" TEXT,
    "cambios" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "logs_auditoria_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "puentes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "puentes_numeroRegistro_key" ON "puentes"("numeroRegistro");
