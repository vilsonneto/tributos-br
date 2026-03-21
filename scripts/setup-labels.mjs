/**
 * Script para criar/atualizar labels do repositorio tributos-br.
 * Usa fetch() nativo do Node 18+.
 *
 * Uso:
 *   GITHUB_TOKEN=ghp_xxx node scripts/setup-labels.mjs
 *
 * O que faz:
 *   1. Busca todos os labels existentes no repo
 *   2. Para cada label alvo: PATCH se existe, POST se nao existe
 *   3. Deleta o label "npm"
 *   4. Imprime resumo
 */

const OWNER = 'vilsonneto';
const REPO = 'tributos-br';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Erro: defina GITHUB_TOKEN como variavel de ambiente.');
  console.error('Uso: GITHUB_TOKEN=ghp_xxx node scripts/setup-labels.mjs');
  process.exit(1);
}

const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}/labels`;

const HEADERS = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};

// ─── Definicao dos 29 labels ───────────────────────────────────────────

const LABELS = [
  // Tipo (6)
  { name: 'feat', color: '0E8A16', description: 'Nova funcionalidade' },
  { name: 'fix', color: 'D73A4A', description: 'Correcao de bug' },
  { name: 'test', color: '0075CA', description: 'Testes' },
  { name: 'docs', color: 'CFD3D7', description: 'Documentacao' },
  { name: 'chore', color: 'FEF2C0', description: 'Tarefas de manutencao' },
  { name: 'refactor', color: 'D876E3', description: 'Refatoracao sem mudanca de comportamento' },

  // Camada (5)
  { name: 'camada-0', color: 'E4A118', description: 'Precisao Decimal' },
  { name: 'camada-1', color: '0E8A16', description: 'Calculo Puro' },
  { name: 'camada-2', color: '0075CA', description: 'Operacao Comercial' },
  { name: 'camada-3', color: 'D876E3', description: 'Output NF-e' },
  { name: 'camada-4', color: 'D73A4A', description: 'Reforma Tributaria' },

  // Dominio (9)
  { name: 'precision', color: 'BFD4F2', description: 'Motor de precisao decimal' },
  { name: 'icms', color: 'BFD4F2', description: 'Imposto ICMS' },
  { name: 'ipi', color: 'BFD4F2', description: 'Imposto IPI' },
  { name: 'st', color: 'BFD4F2', description: 'Substituicao Tributaria' },
  { name: 'difal', color: 'BFD4F2', description: 'Diferencial de aliquota' },
  { name: 'mva', color: 'BFD4F2', description: 'Margem de Valor Agregado' },
  { name: 'cbs', color: 'BFD4F2', description: 'Contribuicao sobre Bens e Servicos' },
  { name: 'ibs', color: 'BFD4F2', description: 'Imposto sobre Bens e Servicos' },
  { name: 'nfe', color: 'BFD4F2', description: 'Nota Fiscal Eletronica' },

  // Status (4)
  { name: 'infra', color: 'D4C5F9', description: 'Infraestrutura do projeto' },
  { name: 'ci', color: 'D4C5F9', description: 'Integracao continua' },
  { name: 'breaking-change', color: 'B60205', description: 'Mudanca incompativel' },
  { name: 'good first issue', color: '7057FF', description: 'Boa para iniciantes' },

  // Extra (4)
  { name: 'core', color: 'FBCA04', description: 'Nucleo do motor de calculo' },
  { name: 'operation', color: 'FBCA04', description: 'Operacao comercial' },
  { name: 'reform', color: 'FBCA04', description: 'Reforma Tributaria' },
  { name: 'fecop', color: 'FBCA04', description: 'Fundo de Combate a Pobreza' },
];

const LABELS_TO_DELETE = ['npm'];

// ─── Funcoes auxiliares ────────────────────────────────────────────────

async function fetchExistingLabels() {
  const labels = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${BASE_URL}?per_page=100&page=${page}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`GET labels falhou: ${res.status} ${await res.text()}`);
    const data = await res.json();
    if (data.length === 0) break;
    labels.push(...data);
    page++;
  }
  return labels;
}

async function createLabel(label) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(label),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${label.name} falhou: ${res.status} ${text}`);
  }
  return 'CRIADO';
}

async function updateLabel(label) {
  const url = `${BASE_URL}/${encodeURIComponent(label.name)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ color: label.color, description: label.description }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${label.name} falhou: ${res.status} ${text}`);
  }
  return 'ATUALIZADO';
}

async function deleteLabel(name) {
  const url = `${BASE_URL}/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (res.status === 404) return 'NAO ENCONTRADO';
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${name} falhou: ${res.status} ${text}`);
  }
  return 'DELETADO';
}

// ─── Execucao principal ────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Setup Labels: ${OWNER}/${REPO} ===\n`);

  // 1. Buscar labels existentes
  console.log('Buscando labels existentes...');
  const existing = await fetchExistingLabels();
  const existingNames = new Set(existing.map((l) => l.name));
  console.log(`  ${existing.length} labels encontrados\n`);

  // 2. Criar ou atualizar cada label
  console.log('--- Criando/atualizando labels ---');
  const results = [];

  for (const label of LABELS) {
    try {
      let action;
      if (existingNames.has(label.name)) {
        action = await updateLabel(label);
      } else {
        action = await createLabel(label);
      }
      results.push({ name: label.name, color: `#${label.color}`, action });
      console.log(`  ${action.padEnd(11)} #${label.color}  ${label.name}`);
    } catch (err) {
      results.push({ name: label.name, color: `#${label.color}`, action: 'ERRO' });
      console.error(`  ERRO       ${label.name}: ${err.message}`);
    }
  }

  // 3. Deletar labels indesejados
  console.log('\n--- Deletando labels ---');
  for (const name of LABELS_TO_DELETE) {
    try {
      const action = await deleteLabel(name);
      console.log(`  ${action.padEnd(11)} ${name}`);
    } catch (err) {
      console.error(`  ERRO       ${name}: ${err.message}`);
    }
  }

  // 4. Resumo
  const criados = results.filter((r) => r.action === 'CRIADO').length;
  const atualizados = results.filter((r) => r.action === 'ATUALIZADO').length;
  const erros = results.filter((r) => r.action === 'ERRO').length;

  console.log(`\n=== Resumo ===`);
  console.log(`  Criados:     ${criados}`);
  console.log(`  Atualizados: ${atualizados}`);
  console.log(`  Erros:       ${erros}`);
  console.log(`  Deletados:   ${LABELS_TO_DELETE.length}`);
  console.log(`  Total:       ${results.length} labels processados\n`);

  if (erros > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
