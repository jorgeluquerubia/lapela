#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    remote: { type: 'boolean', default: false },
    strict: { type: 'boolean', default: true }
  },
  strict: false
});

console.log('[Schema Validation] Analizando cobertura de columnas y migraciones...');

// 1. Analizar migraciones locales
const migrationsDir = path.resolve('supabase/migrations');
if (!fs.existsSync(migrationsDir)) {
  console.error(`[Schema Validation] Directorio de migraciones no encontrado: ${migrationsDir}`);
  process.exit(1);
}

const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
console.log(`[Schema Validation] ${migrationFiles.length} archivos de migración encontrados.`);

const knownTables = new Map(); // tableName -> Set<columnName>

function ensureTable(tableName) {
  const norm = tableName.replace(/^public\./, '').toLowerCase();
  if (!knownTables.has(norm)) {
    knownTables.set(norm, new Set());
  }
  return knownTables.get(norm);
}

// SQL types to match column definitions
const SQL_TYPES = '(?:uuid|text(?:\\[\\])?|varchar|integer|smallint|bigint|boolean|timestamptz|timestamp(?:\\s+with(?:out)?\\s+time\\s+zone)?|jsonb|json|numeric|date|tsvector)';

for (const file of migrationFiles) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

  // Regex para CREATE TABLE [public.]table_name ( ... )
  const createMatches = content.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi);
  for (const match of createMatches) {
    const table = match[1];
    const body = match[2];
    const cols = ensureTable(table);

    // Buscar nombres de columnas seguidos de un tipo SQL
    const colRegex = new RegExp(`(?:^|[,\\n])\\s*(?!constraint\\b|primary\\s+key\\b|foreign\\s+key\\b|unique\\b|check\\b)([a-zA-Z0-9_]+)\\s+${SQL_TYPES}`, 'gi');
    for (const colMatch of body.matchAll(colRegex)) {
      cols.add(colMatch[1].toLowerCase());
    }
  }

  // Regex para ALTER TABLE [public.]table_name ADD COLUMN [IF NOT EXISTS] col_name
  const alterMatches = content.matchAll(/alter\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)/gi);
  for (const match of alterMatches) {
    const table = match[1];
    const col = match[2];
    ensureTable(table).add(col.toLowerCase());
  }
}

// 2. Extraer publicFields de src/models/marketplace.ts
const modelPath = path.resolve('src/models/marketplace.ts');
if (!fs.existsSync(modelPath)) {
  console.error(`[Schema Validation] Modelo de marketplace no encontrado: ${modelPath}`);
  process.exit(1);
}

const modelContent = fs.readFileSync(modelPath, 'utf8');
const publicFieldsMatch = modelContent.match(/publicFields\s*=\s*['"`]([^'"`]+)['"`]/);

if (!publicFieldsMatch) {
  console.error('[Schema Validation] No se pudo encontrar publicFields en src/models/marketplace.ts');
  process.exit(1);
}

const publicFields = publicFieldsMatch[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
console.log(`[Schema Validation] Columnas consultadas en publicFields (lp_listings): [${publicFields.join(', ')}]`);

// Verificar contra esquema local
const listingCols = knownTables.get('lp_listings') || new Set();
const missingInLocalMigrations = publicFields.filter(col => !listingCols.has(col));

if (missingInLocalMigrations.length > 0) {
  console.error(`[Schema Validation] ERROR CRÍTICO: El código consulta columnas de lp_listings que NO están declaradas en ninguna migración local:`);
  console.error(`  -> Columnas ausentes: ${missingInLocalMigrations.join(', ')}`);
  process.exit(1);
} else {
  console.log('[Schema Validation] OK: Todas las columnas de publicFields están respaldadas por migraciones locales.');
}

// 3. Si se solicita o hay credenciales, verificar contra la base de datos remota
async function checkRemote() {
  let token = process.env.SUPABASE_ACCESS_TOKEN;
  let projectRef = process.env.SUPABASE_PROJECT_REF || 'buzmbigpgsrzjrkzidmr';

  // Intentar leer token de .kiro/settings/mcp.json si existe
  const mcpPath = path.resolve('.kiro/settings/mcp.json');
  if (!token && fs.existsSync(mcpPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
      const args = config.mcpServers?.supabase?.args || [];
      const idx = args.indexOf('--access-token');
      if (idx !== -1) token = args[idx + 1];
    } catch {}
  }

  if (!token) {
    if (values.remote) {
      console.error('[Schema Validation] ERROR: Se requirió validación remota pero no se proporcionó SUPABASE_ACCESS_TOKEN');
      process.exit(1);
    }
    console.log('[Schema Validation] Validación remota omitida (sin credenciales de administración).');
    return;
  }

  console.log('[Schema Validation] Verificando columnas contra la base de datos remota en Supabase...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lp_listings';"
    })
  });

  if (!res.ok) {
    console.error(`[Schema Validation] Error al consultar esquema remoto: HTTP ${res.status}`);
    if (values.remote) process.exit(1);
    return;
  }

  const rows = await res.json();
  const remoteCols = new Set((rows || []).map(r => r.column_name.toLowerCase()));

  const missingInRemote = publicFields.filter(col => !remoteCols.has(col));
  if (missingInRemote.length > 0) {
    console.error(`[Schema Validation] BLOQUEO DE DESPLIEGUE: Columnas consultadas en código NO existen en la base de datos remota:`);
    console.error(`  -> Columnas ausentes en producción: ${missingInRemote.join(', ')}`);
    console.error(`  -> Aplica la migración correspondiente antes de desplegar código.`);
    process.exit(1);
  }

  console.log('[Schema Validation] ÉXITO: Todas las columnas consultadas en código existen en la base de datos remota.');
}

await checkRemote();
console.log('[Schema Validation] Validación completada sin incidencias.');
