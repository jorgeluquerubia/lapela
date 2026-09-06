import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const specsDir = join(root, 'specs');
const allowedTypes = new Set([
  'FEATURE',
  'FIX',
  'INFRA',
  'SECURITY',
  'TECH-DEBT',
  'EXPERIMENT',
  'OPS',
  'DOC',
]);
const allowedStatuses = new Set([
  'DRAFT',
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'IMPLEMENTED',
  'VERIFIED',
  'CANCELLED',
]);
const allowedPriorities = new Set(['P0', 'P1', 'P2', 'P3']);
const idPrefixByType = new Map([
  ['FEATURE', 'FEAT'],
  ['FIX', 'FIX'],
  ['INFRA', 'INFRA'],
  ['SECURITY', 'SEC'],
  ['TECH-DEBT', 'DEBT'],
  ['EXPERIMENT', 'EXP'],
  ['OPS', 'OPS'],
  ['DOC', 'DOC'],
]);
const requiredFields = [
  'id',
  'type',
  'status',
  'priority',
  'requested_at',
  'requested_by',
  'source',
  'owner',
  'github_issue',
  'related_specs',
  'dependencies',
  'cross_cutting_concerns',
];
const errors = [];

function fail(message) {
  errors.push(message);
}

function parseFrontmatter(content, file) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    fail(`${file}: falta el frontmatter delimitado por ---.`);
    return {};
  }

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const field = line.match(/^([a-z_]+):\s*(.*)$/);
    if (field) data[field[1]] = field[2].trim();
  }
  return data;
}

function assertUniqueMarkers(content, file, pattern, label) {
  const found = [...content.matchAll(pattern)].map((match) => match[1]);
  const seen = new Set();
  for (const id of found) {
    if (seen.has(id)) fail(`${file}: ${label} duplicado: ${id}.`);
    seen.add(id);
  }
  return found;
}

const specFiles = readdirSync(specsDir)
  .filter((name) => /^LP-[A-Z-]+-\d{3}-.+\.md$/.test(name))
  .sort();
const specs = new Map();

for (const fileName of specFiles) {
  const file = `specs/${fileName}`;
  const content = readFileSync(join(specsDir, fileName), 'utf8');
  const metadata = parseFrontmatter(content, file);

  for (const field of requiredFields) {
    if (!(field in metadata) || metadata[field] === '') {
      fail(`${file}: falta el campo obligatorio '${field}'.`);
    }
  }

  const id = metadata.id;
  if (!/^LP-(FEAT|FIX|INFRA|SEC|DEBT|EXP|OPS|DOC)-\d{3}$/.test(id ?? '')) {
    fail(`${file}: ID inválido '${id ?? ''}'.`);
  }
  if (id && specs.has(id)) fail(`${file}: ID duplicado '${id}'.`);
  if (id) specs.set(id, { file, metadata, content });

  if (id && !fileName.startsWith(`${id}-`)) {
    fail(`${file}: el nombre del archivo no comienza por '${id}-'.`);
  }
  if (id && !content.includes(`# ${id} ·`)) {
    fail(`${file}: el título H1 no contiene '${id} ·'.`);
  }
  if (!allowedTypes.has(metadata.type)) fail(`${file}: tipo no permitido '${metadata.type ?? ''}'.`);
  const expectedPrefix = idPrefixByType.get(metadata.type);
  if (id && expectedPrefix && !id.startsWith(`LP-${expectedPrefix}-`)) {
    fail(`${file}: el ID '${id}' no corresponde al tipo '${metadata.type}' (prefijo esperado: ${expectedPrefix}).`);
  }
  if (!allowedStatuses.has(metadata.status)) fail(`${file}: estado no permitido '${metadata.status ?? ''}'.`);
  if (!allowedPriorities.has(metadata.priority)) fail(`${file}: prioridad no permitida '${metadata.priority ?? ''}'.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.requested_at ?? '')) {
    fail(`${file}: requested_at debe usar YYYY-MM-DD.`);
  }
  const validIssueUrl = /^https:\/\/github\.com\/jorgeluquerubia\/lapela\/issues\/\d+$/.test(metadata.github_issue ?? '');
  if (metadata.github_issue !== 'pending' && !validIssueUrl) {
    fail(`${file}: github_issue debe ser una URL de issue de La Pela o 'pending'.`);
  }
  if (['VERIFIED', 'CANCELLED'].includes(metadata.status) && !validIssueUrl) {
    fail(`${file}: una ficha ${metadata.status} debe tener una GitHub Issue enlazada.`);
  }

  const acceptanceCriteria = assertUniqueMarkers(
    content,
    file,
    /^- \[[ xX]\] `(AC-\d{2})`/gm,
    'criterio de aceptación',
  );
  if (acceptanceCriteria.length === 0) fail(`${file}: no contiene criterios de aceptación AC-XX.`);
  if (metadata.status === 'VERIFIED' && /^- \[ \] `AC-\d{2}`/m.test(content)) {
    fail(`${file}: no puede estar VERIFIED con criterios de aceptación pendientes.`);
  }

  assertUniqueMarkers(
    content,
    file,
    /^- `(RF-\d{2}|RNF-\d{2}|RN-\d{2}|REQ-\d{2}|RULE-\d{2})`/gm,
    'identificador de requisito',
  );
}

const registryPath = join(root, 'SPEC_REGISTRY.md');
const registryContent = readFileSync(registryPath, 'utf8');
const registry = new Map();

for (const line of registryContent.split(/\r?\n/)) {
  if (!/^\| `LP-/.test(line)) continue;
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  const id = cells[0]?.replaceAll('`', '');
  const type = cells[1]?.replaceAll('`', '');
  const status = cells[3]?.replaceAll('`', '');
  const priority = cells[4]?.replaceAll('`', '');
  const requestedAt = cells[5];
  const link = cells[6]?.match(/\]\(([^)]+)\)/)?.[1];

  if (!id) continue;
  if (registry.has(id)) fail(`SPEC_REGISTRY.md: ID duplicado '${id}'.`);
  registry.set(id, { type, status, priority, requestedAt, link });
}

for (const [id, spec] of specs) {
  const row = registry.get(id);
  if (!row) {
    fail(`${spec.file}: '${id}' no está incluido en SPEC_REGISTRY.md.`);
    continue;
  }
  const comparisons = [
    ['type', row.type, spec.metadata.type],
    ['status', row.status, spec.metadata.status],
    ['priority', row.priority, spec.metadata.priority],
    ['requested_at', row.requestedAt, spec.metadata.requested_at],
  ];
  for (const [field, registryValue, specValue] of comparisons) {
    if (registryValue !== specValue) {
      fail(`SPEC_REGISTRY.md: ${id} tiene ${field}='${registryValue}', pero ${spec.file} declara '${specValue}'.`);
    }
  }
  if (row.link !== spec.file) {
    fail(`SPEC_REGISTRY.md: ${id} enlaza '${row.link ?? ''}', se esperaba '${spec.file}'.`);
  }
}

for (const id of registry.keys()) {
  if (!specs.has(id)) fail(`SPEC_REGISTRY.md: '${id}' no tiene una ficha en specs/.`);
}

for (const [id, spec] of specs) {
  const related = spec.metadata.related_specs
    ?.replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  for (const relatedId of related) {
    if (!specs.has(relatedId)) fail(`${spec.file}: related_specs referencia '${relatedId}', que no existe.`);
    if (relatedId === id) fail(`${spec.file}: related_specs no puede referenciar la propia ficha.`);
  }
}

const markdownFiles = [
  'AGENTS.md',
  'ANALISIS_FUNCIONAL.md',
  'CLAUDE.md',
  'GEMINI.md',
  'PROJECT_CONTEXT.md',
  'README.md',
  'SPEC_REGISTRY.md',
  '.github/copilot-instructions.md',
  ...readdirSync(specsDir).filter((name) => name.endsWith('.md')).map((name) => `specs/${name}`),
];

for (const file of markdownFiles) {
  const absoluteFile = join(root, file);
  if (!existsSync(absoluteFile)) {
    fail(`${file}: el documento canónico no existe.`);
    continue;
  }
  const content = readFileSync(absoluteFile, 'utf8');
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
    target = target.split('#', 1)[0];
    if (!target || /^(?:[a-z]+:|\/)/i.test(target)) continue;
    let decodedTarget = target;
    try {
      decodedTarget = decodeURIComponent(target);
    } catch {
      fail(`${file}: enlace local con codificación inválida '${target}'.`);
      continue;
    }
    const resolved = resolve(dirname(absoluteFile), decodedTarget);
    if (!existsSync(resolved)) fail(`${file}: enlace local roto '${target}'.`);
  }
}

const changedFromIndex = process.argv.indexOf('--changed-from');
if (changedFromIndex !== -1) {
  const base = process.argv[changedFromIndex + 1];
  if (!base) {
    fail(`--changed-from requiere un SHA o referencia Git.`);
  } else if (/^0+$/.test(base)) {
    console.log('Control de cambios omitido: el evento no tiene commit base.');
  } else {
    try {
      execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { cwd: root, stdio: 'ignore' });
      const changedFiles = execFileSync('git', ['diff', '--name-only', base, '--'], {
        cwd: root,
        encoding: 'utf8',
      }).trim().split(/\r?\n/).filter(Boolean);
      const implementationChanged = changedFiles.some((file) =>
        /^(src\/|supabase\/|public\/|package(?:-lock)?\.json$|next\.config\.|middleware\.|tsconfig\.json$|tailwind\.config\.|\.github\/workflows\/)/.test(file),
      );
      const specChanged = changedFiles.some((file) => /^specs\/LP-.+\.md$/.test(file));
      const registryChanged = changedFiles.includes('SPEC_REGISTRY.md');

      if (implementationChanged && !specChanged) {
        fail(`Cambios de implementación sin actualizar una ficha en specs/LP-*.md.`);
      }
      if (implementationChanged && !registryChanged) {
        fail(`Cambios de implementación sin actualizar SPEC_REGISTRY.md.`);
      }
    } catch (error) {
      if (error.status === 128) fail(`No se puede resolver la referencia Git '${base}'.`);
      else throw error;
    }
  }
}

if (errors.length > 0) {
  console.error(`Validación de specs fallida (${errors.length} error${errors.length === 1 ? '' : 'es'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Specs válidas: ${specs.size} fichas registradas y ${markdownFiles.length} documentos enlazados.`);
