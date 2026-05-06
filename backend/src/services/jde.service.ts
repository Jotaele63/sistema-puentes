import sql from 'mssql';

const jdeConfig: sql.config = {
  server:   process.env.JDE_SERVER   || 'JDESQLPD.cuyonet.com',
  user:     process.env.JDE_USER     || 'PQCLECTURA',
  password: process.env.JDE_PASSWORD || 'PQCLECTURA',
  database: process.env.JDE_DATABASE || undefined,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  connectionTimeout: 8000,
  requestTimeout:    8000,
};

let pool: sql.ConnectionPool | null = null;

async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  pool = await new sql.ConnectionPool(jdeConfig).connect();
  pool.on('error', () => { pool = null; }); // reset on error
  return pool;
}

export interface EquipoJDE {
  valid:       boolean;
  descripcion?: string;
  apid?:       string;
  error?:      string;
}

export async function validarEquipoJDE(equipoId: string): Promise<EquipoJDE> {
  try {
    const db = await getPool();
    const result = await db.request()
      .input('id', sql.VarChar(50), equipoId.trim())
      .query(`
        SELECT TOP 1
          RTRIM(APID)   AS APID,
          RTRIM(APDL01) AS DESCRIPCION
        FROM F1201
        WHERE RTRIM(APID) = @id
      `);

    if (result.recordset.length > 0) {
      return {
        valid:       true,
        apid:        result.recordset[0].APID,
        descripcion: result.recordset[0].DESCRIPCION,
      };
    }
    return { valid: false };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[JDE] Error de conexión:', msg);
    return { valid: false, error: 'JDE_UNAVAILABLE' };
  }
}
