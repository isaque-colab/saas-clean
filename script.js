const body = document.body;
const landing = document.querySelector('.page-shell');
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const authTitle = document.getElementById('auth-title');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const authMessage = document.getElementById('auth-message');
const appContent = document.getElementById('app-content');
const transactionDialog = document.getElementById('transaction-dialog');
const storageKeys = {
  accounts: 'fluxo-demo-accounts',
  session: 'fluxo-demo-session',
  theme: 'fluxo-theme',
  transactions: 'fluxo-demo-transactions',
  budgets: 'fluxo-demo-budgets',
  goals: 'fluxo-demo-goals',
};

const viewTitles = {
  dashboard: 'Visão geral',
  transactions: 'Lançamentos',
  budgets: 'Orçamentos',
  goals: 'Metas',
  reports: 'Relatórios',
  settings: 'Configurações',
};

let activeView = 'dashboard';
let transactionFilter = '';

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getAccounts = () => readStorage(storageKeys.accounts, {});
const getEmail = () => localStorage.getItem(storageKeys.session);
const getProfile = () => (getEmail() ? getAccounts()[getEmail()] : null);
const getTransactions = () => readStorage(storageKeys.transactions, {});
const getBudgets = () => readStorage(storageKeys.budgets, {});
const getGoals = () => readStorage(storageKeys.goals, {});
const currentDate = () => new Date().toISOString().slice(0, 10);
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const transactionsForUser = () => getTransactions()[getEmail()] || [];
const budgetsForUser = () => getBudgets()[getEmail()] || [
  { category: 'Operação', limit: 12000, spent: 7800 },
  { category: 'Marketing', limit: 6000, spent: 4250 },
  { category: 'Pessoal', limit: 18000, spent: 14300 },
];
const goalsForUser = () => getGoals()[getEmail()] || [
  { title: 'Reserva de emergência', target: 30000, saved: 18400, due: 'Dez 2026' },
  { title: 'Novo equipamento', target: 12000, saved: 7350, due: 'Nov 2026' },
];

const saveTransactions = (transactions) => {
  const allTransactions = getTransactions();
  allTransactions[getEmail()] = transactions;
  writeStorage(storageKeys.transactions, allTransactions);
};

const saveBudgets = (budgets) => {
  const allBudgets = getBudgets();
  allBudgets[getEmail()] = budgets;
  writeStorage(storageKeys.budgets, allBudgets);
};

const saveGoals = (goals) => {
  const allGoals = getGoals();
  allGoals[getEmail()] = goals;
  writeStorage(storageKeys.goals, allGoals);
};

const seedTransactions = () => {
  const transactions = getTransactions();
  if (transactions[getEmail()]) return;

  const today = new Date();
  const dateOffset = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  };

  transactions[getEmail()] = [
    { id: crypto.randomUUID(), title: 'Projeto Aurora', category: 'Vendas', type: 'income', amount: 12800, date: dateOffset(1) },
    { id: crypto.randomUUID(), title: 'Serviços em nuvem', category: 'Infraestrutura', type: 'expense', amount: 1280, date: dateOffset(2) },
    { id: crypto.randomUUID(), title: 'Campanha de aquisição', category: 'Marketing', type: 'expense', amount: 2450, date: dateOffset(4) },
    { id: crypto.randomUUID(), title: 'Consultoria financeira', category: 'Operação', type: 'income', amount: 6400, date: dateOffset(6) },
    { id: crypto.randomUUID(), title: 'Folha de pagamento', category: 'Pessoal', type: 'expense', amount: 8200, date: dateOffset(8) },
  ];
  writeStorage(storageKeys.transactions, transactions);
};

const openAuth = (mode) => {
  landing.hidden = mode !== 'landing';
  authScreen.hidden = mode === 'landing';
  appShell.hidden = true;
  authMessage.textContent = '';

  if (mode === 'landing') return;
  const isSignup = mode === 'signup';
  signupForm.hidden = !isSignup;
  loginForm.hidden = isSignup;
  authTitle.textContent = isSignup ? 'Crie seu espaço financeiro.' : 'Bom ter você de volta.';
  document.getElementById('auth-switch-copy').textContent = isSignup ? 'Já tem um espaço neste navegador?' : 'Ainda não tem um espaço?';
  document.getElementById('auth-switch').textContent = isSignup ? 'Entrar' : 'Criar conta';
  document.getElementById('auth-switch').dataset.screen = isSignup ? 'login' : 'signup';
};

const showApp = () => {
  const profile = getProfile();
  if (!profile) {
    openAuth('login');
    return;
  }

  landing.hidden = true;
  authScreen.hidden = true;
  appShell.hidden = false;
  document.getElementById('workspace-name').textContent = profile.company || 'Meu espaço';
  document.getElementById('user-name').textContent = profile.name;
  document.getElementById('user-email').textContent = profile.email;
  document.getElementById('user-avatar').textContent = profile.name.slice(0, 1).toUpperCase();
  activeView = 'dashboard';
  renderApp();
};

const registerAccount = ({ name, email, company }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAccounts();
  if (accounts[normalizedEmail]) {
    authMessage.textContent = 'Já existe um espaço com este e-mail neste navegador. Entre ou use outro e-mail.';
    return;
  }

  accounts[normalizedEmail] = {
    name: name.trim(),
    email: normalizedEmail,
    company: company.trim() || 'Meu espaço',
  };
  writeStorage(storageKeys.accounts, accounts);
  localStorage.setItem(storageKeys.session, normalizedEmail);
  seedTransactions();
  showApp();
};

const signedAmount = (transaction) => `${transaction.type === 'income' ? '+' : '−'} ${money(transaction.amount)}`;

const transactionRows = (transactions, showActions = false) => {
  if (!transactions.length) {
    return '<tr><td colspan="5" class="empty-state">Nenhum lançamento encontrado.</td></tr>';
  }

  return transactions.map((transaction) => `
    <tr>
      <td><span class="transaction-name"><span class="transaction-dot ${transaction.type}"></span><strong>${escapeHtml(transaction.title)}</strong></span></td>
      <td><span class="category-tag">${escapeHtml(transaction.category)}</span></td>
      <td>${new Intl.DateTimeFormat('pt-BR').format(new Date(`${transaction.date}T12:00:00`))}</td>
      <td class="amount ${transaction.type}">${signedAmount(transaction)}</td>
      <td>${showActions ? `<button class="text-button delete-transaction" type="button" data-delete-transaction="${escapeHtml(transaction.id)}">Remover</button>` : '<span class="status-label">Concluído</span>'}</td>
    </tr>
  `).join('');
};

const dashboardView = () => {
  const transactions = transactionsForUser();
  const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const bars = [38, 53, 43, 71, 57, 86, 66];

  return `
    <div class="welcome-row"><div><span class="eyebrow">Resumo financeiro</span><h2>Bom dia, ${escapeHtml(getProfile().name.split(' ')[0])}.</h2><p>Acompanhe o ritmo do seu negócio.</p></div><button class="btn btn-secondary" type="button" data-view="reports">Ver relatórios <span aria-hidden="true">→</span></button></div>
    <section class="metric-grid">
      <article class="metric-card"><span>Saldo no período</span><span class="metric-mark green">↗</span><strong>${money(income - expenses)}</strong><small class="positive-copy">Receitas menos despesas registradas</small></article>
      <article class="metric-card"><span>Receitas</span><span class="metric-mark blue">↑</span><strong>${money(income)}</strong><small>Entradas demonstrativas</small></article>
      <article class="metric-card"><span>Despesas</span><span class="metric-mark coral">↓</span><strong>${money(expenses)}</strong><small>Saídas demonstrativas</small></article>
      <article class="metric-card"><span>Lançamentos</span><span class="metric-mark yellow">#</span><strong>${transactions.length}</strong><small>Movimentações registradas</small></article>
    </section>
    <section class="dashboard-grid">
      <article class="app-panel cashflow-panel"><div class="panel-heading"><div><h3>Fluxo de caixa</h3><p>Movimentações recentes</p></div><select aria-label="Período do fluxo"><option>Esta semana</option><option>Este mês</option></select></div><div class="chart-legend"><span><i class="legend-income"></i>Receitas</span><span><i class="legend-expense"></i>Despesas</span></div><div class="cashflow-chart">${bars.map((height, index) => `<div class="chart-column"><div class="chart-bar-pair"><span class="chart-bar income-bar" style="--bar-height:${height}%"></span><span class="chart-bar expense-bar" style="--bar-height:${Math.max(22, height - 24)}%"></span></div><small>${days[index]}</small></div>`).join('')}</div></article>
      <article class="app-panel budget-summary"><div class="panel-heading"><div><h3>Orçamento utilizado</h3><p>Visão geral do mês</p></div><button class="icon-button" data-view="budgets" type="button" aria-label="Abrir orçamentos">→</button></div>${budgetsForUser().slice(0, 3).map((budget) => `<div class="budget-line"><div class="budget-line-head"><span>${escapeHtml(budget.category)}</span><strong>${Math.round((budget.spent / budget.limit) * 100)}%</strong></div><div class="progress-track"><span style="width:${Math.min(100, (budget.spent / budget.limit) * 100)}%"></span></div><small>${money(budget.spent)} de ${money(budget.limit)}</small></div>`).join('')}</article>
    </section>
    <section class="app-panel recent-panel"><div class="panel-heading"><div><h3>Últimos lançamentos</h3><p>Atividade financeira do espaço</p></div><button class="text-button" type="button" data-view="transactions">Ver todos <span aria-hidden="true">→</span></button></div><div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>${transactionRows(recent)}</tbody></table></div></section>
  `;
};

const transactionsView = () => {
  const query = transactionFilter.toLowerCase();
  const filtered = [...transactionsForUser()].sort((a, b) => b.date.localeCompare(a.date)).filter((item) => `${item.title} ${item.category} ${item.type}`.toLowerCase().includes(query));
  return `
    <div class="view-heading"><div><span class="eyebrow">Movimentações</span><h2>Todos os lançamentos</h2><p>Organize receitas e despesas do seu espaço.</p></div><button class="btn btn-primary" type="button" data-add-transaction>＋ Novo lançamento</button></div>
    <section class="app-panel"><div class="table-toolbar"><label class="search-field"><span aria-hidden="true">⌕</span><input id="transaction-search" type="search" placeholder="Buscar por descrição ou categoria" value="${escapeHtml(transactionFilter)}" /></label><span class="muted-copy">${filtered.length} registros</span></div><div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th><th>Ação</th></tr></thead><tbody>${transactionRows(filtered, true)}</tbody></table></div></section>
  `;
};

const budgetsView = () => `
  <div class="view-heading"><div><span class="eyebrow">Planejamento</span><h2>Orçamentos</h2><p>Defina limites e acompanhe os gastos por categoria.</p></div></div>
  <section class="budget-card-grid">${budgetsForUser().map((budget) => {
    const percent = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
    return `<article class="app-panel budget-card"><div class="budget-card-heading"><span class="category-symbol">${escapeHtml(budget.category.slice(0, 1))}</span><button class="icon-button" aria-label="Mais opções" type="button">···</button></div><span class="muted-copy">${escapeHtml(budget.category)}</span><strong>${money(budget.spent)} <small>de ${money(budget.limit)}</small></strong><div class="progress-track ${percent > 90 ? 'over-limit' : ''}"><span style="width:${percent}%"></span></div><div class="budget-line-head"><small>${percent}% utilizado</small><small>${money(Math.max(0, budget.limit - budget.spent))} restante</small></div></article>`;
  }).join('')}</section>
  <section class="app-panel create-panel"><div><h3>Novo orçamento</h3><p>Adicione um limite para outra categoria.</p></div><form id="budget-form" class="inline-form"><label class="sr-only" for="budget-category">Categoria</label><input id="budget-category" name="category" required maxlength="30" placeholder="Categoria" /><label class="sr-only" for="budget-limit">Limite mensal</label><input id="budget-limit" name="limit" type="number" min="1" step="0.01" required placeholder="Limite em R$" /><button class="btn btn-primary" type="submit">Adicionar</button></form></section>
`;

const goalsView = () => `
  <div class="view-heading"><div><span class="eyebrow">Objetivos</span><h2>Metas financeiras</h2><p>Transforme planos em progresso visível.</p></div></div>
  <section class="goal-grid">${goalsForUser().map((goal, index) => {
    const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
    return `<article class="app-panel goal-card"><div class="goal-card-top"><span class="goal-icon">${index % 2 ? '↗' : '◎'}</span><span class="status-label">${escapeHtml(goal.due || 'Sem prazo')}</span></div><h3>${escapeHtml(goal.title)}</h3><p>Acumule recursos sem perder o controle do caixa.</p><div class="goal-progress-copy"><strong>${money(goal.saved)}</strong><span>${percent}%</span></div><div class="progress-track"><span style="width:${percent}%"></span></div><small>Meta de ${money(goal.target)}</small></article>`;
  }).join('')}</section>
  <section class="app-panel create-panel"><div><h3>Criar meta</h3><p>Defina um objetivo e o valor desejado.</p></div><form id="goal-form" class="inline-form"><label class="sr-only" for="goal-title">Nome da meta</label><input id="goal-title" name="title" required maxlength="50" placeholder="Nome da meta" /><label class="sr-only" for="goal-target">Valor alvo</label><input id="goal-target" name="target" type="number" min="1" step="0.01" required placeholder="Valor alvo em R$" /><button class="btn btn-primary" type="submit">Criar meta</button></form></section>
`;

const reportsView = () => {
  const transactions = transactionsForUser();
  const income = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);
  const categoryTotals = transactions.filter((item) => item.type === 'expense').reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + Number(item.amount);
    return totals;
  }, {});
  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categories.map(([, amount]) => amount));

  return `
    <div class="view-heading"><div><span class="eyebrow">Análise</span><h2>Relatórios financeiros</h2><p>Uma leitura simples das movimentações registradas.</p></div><button class="btn btn-secondary" type="button" onclick="window.print()">Imprimir relatório</button></div>
    <section class="metric-grid report-metrics"><article class="metric-card"><span>Receita total</span><strong>${money(income)}</strong><small>Período demonstrativo</small></article><article class="metric-card"><span>Despesas totais</span><strong>${money(expenses)}</strong><small>Período demonstrativo</small></article><article class="metric-card"><span>Resultado líquido</span><strong>${money(income - expenses)}</strong><small>Receitas menos despesas</small></article></section>
    <section class="app-panel report-panel"><div class="panel-heading"><div><h3>Despesas por categoria</h3><p>Distribuição dos lançamentos registrados</p></div></div>${categories.length ? categories.map(([category, amount]) => `<div class="report-category"><div class="budget-line-head"><span>${escapeHtml(category)}</span><strong>${money(amount)}</strong></div><div class="progress-track"><span style="width:${Math.round((amount / maxCategory) * 100)}%"></span></div></div>`).join('') : '<p class="empty-state">Adicione despesas para visualizar a distribuição.</p>'}</section>
  `;
};

const settingsView = () => {
  const profile = getProfile();
  return `
    <div class="view-heading"><div><span class="eyebrow">Seu espaço</span><h2>Configurações</h2><p>Personalize os dados deste perfil de demonstração.</p></div></div>
    <section class="app-panel settings-panel"><form id="settings-form" class="settings-form"><div class="settings-section"><h3>Perfil</h3><p>Os dados ficam somente neste navegador.</p><label for="settings-name">Nome</label><input id="settings-name" name="name" required value="${escapeHtml(profile.name)}" /><label for="settings-company">Empresa ou workspace</label><input id="settings-company" name="company" value="${escapeHtml(profile.company)}" /></div><div class="settings-section"><h3>Aparência</h3><p>Escolha o tema da interface.</p><div class="theme-choice"><span>Claro ou escuro</span><button class="theme-toggle" type="button" aria-label="Alternar tema"><span class="theme-toggle__icon">☀️</span></button></div></div><button class="btn btn-primary" type="submit">Salvar alterações</button><p class="form-message" id="settings-message" role="status"></p></form></section>
  `;
};

const renderApp = () => {
  const title = viewTitles[activeView] || viewTitles.dashboard;
  document.getElementById('app-page-title').textContent = title;
  document.getElementById('current-section-name').textContent = title;
  document.querySelectorAll('.app-nav-link[data-view]').forEach((link) => link.classList.toggle('is-active', link.dataset.view === activeView));

  const views = {
    dashboard: dashboardView,
    transactions: transactionsView,
    budgets: budgetsView,
    goals: goalsView,
    reports: reportsView,
    settings: settingsView,
  };
  appContent.innerHTML = views[activeView]();
};

const createDemoAccount = () => {
  const email = 'demo@fluxo.local';
  const accounts = getAccounts();
  accounts[email] = { name: 'Conta demonstração', email, company: 'Fluxo Demo' };
  writeStorage(storageKeys.accounts, accounts);
  localStorage.setItem(storageKeys.session, email);
  seedTransactions();
  showApp();
};

document.querySelectorAll('.theme-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const isLight = body.classList.toggle('light');
    localStorage.setItem(storageKeys.theme, isLight ? 'light' : 'dark');
    document.querySelectorAll('.theme-toggle__icon').forEach((icon) => { icon.textContent = isLight ? '🌙' : '☀️'; });
  });
});

document.addEventListener('click', (event) => {
  const screenButton = event.target.closest('[data-screen]');
  if (screenButton) openAuth(screenButton.dataset.screen);

  const viewButton = event.target.closest('[data-view]');
  if (viewButton && getProfile()) {
    activeView = viewButton.dataset.view;
    transactionFilter = '';
    renderApp();
  }

  if (event.target.closest('[data-demo-login]')) createDemoAccount();
  if (event.target.closest('[data-logout]')) {
    localStorage.removeItem(storageKeys.session);
    landing.hidden = false;
    authScreen.hidden = true;
    appShell.hidden = true;
  }
  if (event.target.closest('[data-add-transaction]')) {
    document.getElementById('entry-date').value = currentDate();
    transactionDialog.showModal();
  }
  if (event.target.closest('[data-close-dialog]')) transactionDialog.close();

  const deleteButton = event.target.closest('[data-delete-transaction]');
  if (deleteButton) {
    saveTransactions(transactionsForUser().filter((item) => item.id !== deleteButton.dataset.deleteTransaction));
    renderApp();
  }
});

document.getElementById('auth-switch').addEventListener('click', (event) => openAuth(event.currentTarget.dataset.screen));

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  registerAccount(Object.fromEntries(new FormData(signupForm)));
});

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(loginForm).get('email').trim().toLowerCase();
  if (!getAccounts()[email]) {
    authMessage.textContent = 'Não encontrei esse espaço neste navegador. Crie um espaço ou explore a demonstração.';
    return;
  }
  localStorage.setItem(storageKeys.session, email);
  showApp();
});

document.querySelector('.lead-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  if (!name || !email) return;
  openAuth('signup');
  document.getElementById('signup-name').value = name;
  document.getElementById('signup-email').value = email;
  document.getElementById('signup-company').focus();
});

document.getElementById('transaction-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = Object.fromEntries(new FormData(event.currentTarget));
  const transactions = transactionsForUser();
  transactions.unshift({ ...entry, id: crypto.randomUUID(), amount: Number(entry.amount) });
  saveTransactions(transactions);
  transactionDialog.close();
  event.currentTarget.reset();
  renderApp();
});

appContent.addEventListener('input', (event) => {
  if (event.target.id !== 'transaction-search') return;
  transactionFilter = event.target.value;
  const selectionStart = event.target.selectionStart;
  renderApp();
  const search = document.getElementById('transaction-search');
  search.focus();
  search.setSelectionRange(selectionStart, selectionStart);
});

appContent.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(event.target));

  if (event.target.id === 'budget-form') {
    const budgets = budgetsForUser();
    budgets.push({ category: formData.category.trim(), limit: Number(formData.limit), spent: 0 });
    saveBudgets(budgets);
    renderApp();
  }

  if (event.target.id === 'goal-form') {
    const goals = goalsForUser();
    goals.push({ title: formData.title.trim(), target: Number(formData.target), saved: 0, due: 'Sem prazo' });
    saveGoals(goals);
    renderApp();
  }

  if (event.target.id === 'settings-form') {
    const email = getEmail();
    const accounts = getAccounts();
    accounts[email] = { ...accounts[email], name: formData.name.trim(), company: formData.company.trim() || 'Meu espaço' };
    writeStorage(storageKeys.accounts, accounts);
    document.getElementById('workspace-name').textContent = accounts[email].company;
    document.getElementById('user-name').textContent = accounts[email].name;
    document.getElementById('user-avatar').textContent = accounts[email].name.slice(0, 1).toUpperCase();
    document.getElementById('settings-message').textContent = 'Alterações salvas neste navegador.';
  }
});

const savedTheme = localStorage.getItem(storageKeys.theme);
if (savedTheme === 'light') body.classList.add('light');
document.querySelectorAll('.theme-toggle__icon').forEach((icon) => { icon.textContent = savedTheme === 'light' ? '🌙' : '☀️'; });

document.getElementById('year').textContent = new Date().getFullYear();
if (getProfile()) showApp();
