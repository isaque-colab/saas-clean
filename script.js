const body = document.body;
const landing = document.querySelector('.page-shell');
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const authTitle = document.getElementById('auth-title');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const resetRequestForm = document.getElementById('reset-request-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const authMessage = document.getElementById('auth-message');
const appContent = document.getElementById('app-content');
const transactionDialog = document.getElementById('transaction-dialog');
const storageKeys = {
  session: 'fluxo-demo-session',
  profile: 'fluxo-demo-profile',
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
let supabaseClient = null;
let backendStatus = 'loading';
let authMode = 'signup';
let isPasswordRecovery = false;
let dataMode = 'demo';
let currentProfile = null;
let transactionData = [];
let budgetData = [];
let goalData = [];

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

      if (event === 'PASSWORD_RECOVERY') {
        isPasswordRecovery = true;
        openAuth('reset-password');
      }
const getEmail = () => localStorage.getItem(storageKeys.session);
const getProfile = () => currentProfile;
const currentDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const transactionsForUser = () => transactionData;
const budgetsForUser = () => budgetData.map((budget) => {
  const period = budget.period_month || currentMonth();
  const spent = dataMode === 'online'
    ? transactionData.filter((item) => item.type === 'expense' && item.category === budget.category && item.date.slice(0, 7) === period).reduce((sum, item) => sum + Number(item.amount), 0)
    : Number(budget.spent || 0);
  return { ...budget, limit: Number(budget.limit_amount ?? budget.limit), spent };
});
const goalsForUser = () => goalData.map((goal) => ({ ...goal, target: Number(goal.target), saved: Number(goal.saved || 0) }));

const seedTransactions = () => {
  const transactions = readStorage(storageKeys.transactions, {});
  if (transactions[getEmail()]) {
    transactionData = transactions[getEmail()];
    return;
  }

  const today = new Date();
  const dateOffset = (days) => {
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  transactionData = [
    { id: crypto.randomUUID(), title: 'Projeto Aurora', category: 'Vendas', type: 'income', amount: 12800, date: dateOffset(1) },
    { id: crypto.randomUUID(), title: 'Serviços em nuvem', category: 'Infraestrutura', type: 'expense', amount: 1280, date: dateOffset(2) },
    { id: crypto.randomUUID(), title: 'Campanha de aquisição', category: 'Marketing', type: 'expense', amount: 2450, date: dateOffset(4) },
    { id: crypto.randomUUID(), title: 'Consultoria financeira', category: 'Operação', type: 'income', amount: 6400, date: dateOffset(6) },
    { id: crypto.randomUUID(), title: 'Folha de pagamento', category: 'Pessoal', type: 'expense', amount: 8200, date: dateOffset(8) },
  ];
  transactions[getEmail()] = transactionData;
  writeStorage(storageKeys.transactions, transactions);
};

const openAuth = (mode) => {
  authMode = mode;
  landing.hidden = mode !== 'landing';
  authScreen.hidden = mode === 'landing';
  appShell.hidden = true;
  authMessage.textContent = '';

  if (mode === 'landing') return;
  const forms = [signupForm, loginForm, resetRequestForm, resetPasswordForm];
  forms.forEach((form) => { form.hidden = true; });
  signupForm.hidden = mode !== 'signup';
  loginForm.hidden = mode !== 'login';
  resetRequestForm.hidden = mode !== 'reset-request';
  resetPasswordForm.hidden = mode !== 'reset-password';
  const isSignup = mode === 'signup';
  const isLogin = mode === 'login';
  authTitle.textContent = isSignup ? 'Crie seu espaço financeiro.' : isLogin ? 'Acesse sua conta.' : mode === 'reset-password' ? 'Defina uma nova senha.' : 'Recupere seu acesso.';
  document.getElementById('auth-switch-copy').textContent = isSignup ? 'Já tem uma conta?' : isLogin ? 'Ainda não tem uma conta?' : '';
  document.getElementById('auth-switch').textContent = isSignup ? 'Entrar' : 'Criar conta';
  document.getElementById('auth-switch').dataset.screen = isSignup ? 'login' : 'signup';
  document.getElementById('auth-switch').hidden = !isSignup && !isLogin;
  document.getElementById('forgot-password').hidden = !isLogin || !supabaseClient;
  document.querySelector('.auth-divider').hidden = mode === 'reset-request' || mode === 'reset-password';
  document.querySelector('[data-demo-login]').hidden = mode === 'reset-request' || mode === 'reset-password';
  if (!supabaseClient && backendStatus === 'missing') {
    authMessage.textContent = 'Cadastro real ainda não está configurado. Use a demonstração ou configure Supabase no Netlify.';
  } else if (!supabaseClient && backendStatus === 'loading') {
    authMessage.textContent = 'Conectando ao serviço de contas...';
  }
};

const showApp = async () => {
  const profile = currentProfile;
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
  document.getElementById('workspace-plan').textContent = dataMode === 'online' ? 'Plano gratuito' : 'Demonstração local';
  const environmentBadge = document.getElementById('environment-badge');
  environmentBadge.textContent = dataMode === 'online' ? '● CONTA ONLINE' : '● DEMO LOCAL';
  environmentBadge.classList.toggle('live-pill', dataMode === 'online');
  activeView = 'dashboard';
  appContent.innerHTML = '<section class="app-panel"><p>Carregando seus dados...</p></section>';
  if (dataMode === 'online') {
    try {
      await loadUserData();
    } catch (error) {
      appContent.innerHTML = `<section class="app-panel setup-error"><h2>Não foi possível carregar seus dados</h2><p>${escapeHtml(error.message)}</p><p>Confira se o esquema SQL do Supabase foi instalado e se as políticas RLS estão ativas.</p></section>`;
      return;
    }
  }
  renderApp();
};

const loadUserData = async () => {
  const results = await Promise.all([
    supabaseClient.from('transactions').select('*').order('date', { ascending: false }),
    supabaseClient.from('budgets').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('goals').select('*').order('created_at', { ascending: false }),
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  [transactionData, budgetData, goalData] = results.map((result) => result.data || []);
};

const activateLiveUser = async (user) => {
  dataMode = 'online';
  currentProfile = {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
    company: user.user_metadata?.company || 'Meu espaço',
    email: user.email || '',
  };
  await showApp();
};

const initializeSupabase = async () => {
  try {
    const response = await fetch('/.netlify/functions/supabase-config', { cache: 'no-store' });
    if (!response.ok) throw new Error('Supabase ainda não foi configurado.');
    const config = await response.json();
    if (!config.configured || !config.url || !config.anonKey) throw new Error('Supabase ainda não foi configurado.');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    backendStatus = 'ready';
    document.getElementById('auth-copy').textContent = 'Seus dados financeiros ficam vinculados à sua conta e protegidos por usuário.';
    document.getElementById('auth-notice').textContent = 'Confirme seu e-mail para ativar a conta. Nunca compartilhe sua senha.';
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') openAuth('reset-password');
      if (event === 'SIGNED_OUT' && dataMode === 'online') {
        currentProfile = null;
        transactionData = [];
        budgetData = [];
        goalData = [];
        dataMode = 'demo';
        landing.hidden = false;
        authScreen.hidden = true;
        appShell.hidden = true;
      }
    });
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user && !isPasswordRecovery) await activateLiveUser(data.session.user);
  } catch (error) {
    backendStatus = 'missing';
    document.getElementById('auth-copy').textContent = 'Crie uma conta para guardar seus dados online. A demonstração continua disponível.';
    document.getElementById('auth-notice').textContent = 'O cadastro online precisa ser ativado pelo administrador do site no Netlify e no Supabase.';
    if (!authScreen.hidden) openAuth(authMode);
  }
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
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      key,
      label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''),
    };
  });
  const dailyTotals = days.map(({ key }) => transactions.reduce((totals, item) => {
    if (item.date !== key) return totals;
    totals[item.type] += Number(item.amount);
    return totals;
  }, { income: 0, expense: 0 }));
  const chartMaximum = Math.max(1, ...dailyTotals.flatMap((day) => [day.income, day.expense]));
  const dashboardBudgets = budgetsForUser().slice(0, 3);

  return `
    <div class="welcome-row"><div><span class="eyebrow">Resumo financeiro</span><h2>Bom dia, ${escapeHtml(getProfile().name.split(' ')[0])}.</h2><p>Acompanhe o ritmo do seu negócio.</p></div><button class="btn btn-secondary" type="button" data-view="reports">Ver relatórios <span aria-hidden="true">→</span></button></div>
    <section class="metric-grid">
      <article class="metric-card"><span>Saldo acumulado</span><span class="metric-mark green">↗</span><strong>${money(income - expenses)}</strong><small class="positive-copy">Receitas menos despesas registradas</small></article>
      <article class="metric-card"><span>Receitas registradas</span><span class="metric-mark blue">↑</span><strong>${money(income)}</strong><small>Total dos lançamentos de receita</small></article>
      <article class="metric-card"><span>Despesas registradas</span><span class="metric-mark coral">↓</span><strong>${money(expenses)}</strong><small>Total dos lançamentos de despesa</small></article>
      <article class="metric-card"><span>Lançamentos</span><span class="metric-mark yellow">#</span><strong>${transactions.length}</strong><small>Movimentações registradas</small></article>
    </section>
    <section class="dashboard-grid">
      <article class="app-panel cashflow-panel"><div class="panel-heading"><div><h3>Fluxo de caixa</h3><p>Últimos sete dias</p></div></div><div class="chart-legend"><span><i class="legend-income"></i>Receitas</span><span><i class="legend-expense"></i>Despesas</span></div><div class="cashflow-chart">${days.map((day, index) => { const totals = dailyTotals[index]; const height = (amount) => amount ? Math.max(5, (amount / chartMaximum) * 100) : 3; return `<div class="chart-column"><div class="chart-bar-pair"><span class="chart-bar income-bar" style="--bar-height:${height(totals.income)}%"></span><span class="chart-bar expense-bar" style="--bar-height:${height(totals.expense)}%"></span></div><small>${escapeHtml(day.label)}</small></div>`; }).join('')}</div></article>
      <article class="app-panel budget-summary"><div class="panel-heading"><div><h3>Orçamento utilizado</h3><p>Mês atual</p></div><button class="icon-button" data-view="budgets" type="button" aria-label="Abrir orçamentos">→</button></div>${dashboardBudgets.length ? dashboardBudgets.map((budget) => `<div class="budget-line"><div class="budget-line-head"><span>${escapeHtml(budget.category)}</span><strong>${Math.round((budget.spent / budget.limit) * 100)}%</strong></div><div class="progress-track"><span style="width:${Math.min(100, (budget.spent / budget.limit) * 100)}%"></span></div><small>${money(budget.spent)} de ${money(budget.limit)}</small></div>`).join('') : '<p class="empty-state">Crie um orçamento para acompanhar os gastos do mês.</p>'}</article>
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

const budgetsView = () => {
  const budgets = budgetsForUser();
  return `
  <div class="view-heading"><div><span class="eyebrow">Planejamento</span><h2>Orçamentos</h2><p>Defina limites e acompanhe os gastos por categoria.</p></div></div>
  <section class="budget-card-grid">${budgets.length ? budgets.map((budget) => {
    const percent = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
    return `<article class="app-panel budget-card"><div class="budget-card-heading"><span class="category-symbol">${escapeHtml(budget.category.slice(0, 1))}</span><button class="icon-button" aria-label="Mais opções" type="button">···</button></div><span class="muted-copy">${escapeHtml(budget.category)}</span><strong>${money(budget.spent)} <small>de ${money(budget.limit)}</small></strong><div class="progress-track ${percent > 90 ? 'over-limit' : ''}"><span style="width:${percent}%"></span></div><div class="budget-line-head"><small>${percent}% utilizado</small><small>${money(Math.max(0, budget.limit - budget.spent))} restante</small></div></article>`;
  }).join('') : '<p class="app-panel empty-state">Você ainda não tem orçamentos neste mês.</p>'}</section>
  <section class="app-panel create-panel"><div><h3>Novo orçamento</h3><p>Adicione um limite para outra categoria.</p></div><form id="budget-form" class="inline-form"><label class="sr-only" for="budget-category">Categoria</label><input id="budget-category" name="category" required maxlength="30" placeholder="Categoria" /><label class="sr-only" for="budget-limit">Limite mensal</label><input id="budget-limit" name="limit" type="number" min="1" step="0.01" required placeholder="Limite em R$" /><button class="btn btn-primary" type="submit">Adicionar</button></form></section>
`;
};

const goalsView = () => {
  const goals = goalsForUser();
  return `
  <div class="view-heading"><div><span class="eyebrow">Objetivos</span><h2>Metas financeiras</h2><p>Transforme planos em progresso visível.</p></div></div>
  <section class="goal-grid">${goals.length ? goals.map((goal, index) => {
    const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100));
    return `<article class="app-panel goal-card"><div class="goal-card-top"><span class="goal-icon">${index % 2 ? '↗' : '◎'}</span><span class="status-label">${escapeHtml(goal.due || 'Sem prazo')}</span></div><h3>${escapeHtml(goal.title)}</h3><p>Acumule recursos sem perder o controle do caixa.</p><div class="goal-progress-copy"><strong>${money(goal.saved)}</strong><span>${percent}%</span></div><div class="progress-track"><span style="width:${percent}%"></span></div><small>Meta de ${money(goal.target)}</small></article>`;
  }).join('') : '<p class="app-panel empty-state">Crie uma meta para acompanhar seu progresso.</p>'}</section>
  <section class="app-panel create-panel"><div><h3>Criar meta</h3><p>Defina um objetivo e o valor desejado.</p></div><form id="goal-form" class="inline-form"><label class="sr-only" for="goal-title">Nome da meta</label><input id="goal-title" name="title" required maxlength="50" placeholder="Nome da meta" /><label class="sr-only" for="goal-target">Valor alvo</label><input id="goal-target" name="target" type="number" min="1" step="0.01" required placeholder="Valor alvo em R$" /><button class="btn btn-primary" type="submit">Criar meta</button></form></section>
`;
};

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

const saveDemoData = (key, value) => {
  const all = readStorage(key, {});
  all[getEmail()] = value;
  writeStorage(key, all);
};

const createDemoAccount = async () => {
  const email = 'demo@fluxo.local';
  localStorage.setItem(storageKeys.session, email);
  currentProfile = readStorage(storageKeys.profile, { name: 'Conta demonstração', email, company: 'Fluxo Demo' });
  dataMode = 'demo';
  seedTransactions();
  budgetData = readStorage(storageKeys.budgets, {})[email] || [
    { category: 'Operação', limit: 12000, spent: 7800 },
    { category: 'Marketing', limit: 6000, spent: 4250 },
    { category: 'Pessoal', limit: 18000, spent: 14300 },
  ];
  goalData = readStorage(storageKeys.goals, {})[email] || [
    { title: 'Reserva de emergência', target: 30000, saved: 18400, due: 'Dez 2026' },
    { title: 'Novo equipamento', target: 12000, saved: 7350, due: 'Nov 2026' },
  ];
  await showApp();
};

const addTransaction = async (entry) => {
  if (dataMode === 'online') {
    const { error } = await supabaseClient.from('transactions').insert({
      title: entry.title,
      category: entry.category,
      type: entry.type,
      amount: Number(entry.amount),
      date: entry.date,
    });
    if (error) throw error;
    await loadUserData();
    return;
  }

  transactionData.unshift({ ...entry, id: crypto.randomUUID(), amount: Number(entry.amount) });
  saveDemoData(storageKeys.transactions, transactionData);
};

const removeTransaction = async (id) => {
  if (dataMode === 'online') {
    const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
    if (error) throw error;
    await loadUserData();
    return;
  }
  transactionData = transactionData.filter((item) => item.id !== id);
  saveDemoData(storageKeys.transactions, transactionData);
};

const addBudget = async (category, limit) => {
  if (dataMode === 'online') {
    const { error } = await supabaseClient.from('budgets').insert({ category, limit_amount: limit, period_month: currentMonth() });
    if (error) throw error;
    await loadUserData();
    return;
  }
  budgetData.push({ category, limit, spent: 0 });
  saveDemoData(storageKeys.budgets, budgetData);
};

const addGoal = async (title, target) => {
  if (dataMode === 'online') {
    const { error } = await supabaseClient.from('goals').insert({ title, target, saved: 0, due: 'Sem prazo' });
    if (error) throw error;
    await loadUserData();
    return;
  }
  goalData.push({ title, target, saved: 0, due: 'Sem prazo' });
  saveDemoData(storageKeys.goals, goalData);
};

const setButtonLoading = (form, loading, defaultText) => {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = loading;
  button.textContent = loading ? 'Aguarde...' : defaultText;
};

const authErrorMessage = (error) => {
  const message = error?.message || '';
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  if (/already registered|already been registered/i.test(message)) return 'Este e-mail já tem uma conta. Entre ou recupere sua senha.';
  return message || 'Não foi possível concluir a solicitação.';
};

document.querySelectorAll('.theme-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const isLight = body.classList.toggle('light');
    localStorage.setItem(storageKeys.theme, isLight ? 'light' : 'dark');
    document.querySelectorAll('.theme-toggle__icon').forEach((icon) => { icon.textContent = isLight ? '🌙' : '☀️'; });
  });
});

document.addEventListener('click', async (event) => {
  const screenButton = event.target.closest('[data-screen]');
  if (screenButton) openAuth(screenButton.dataset.screen);

  const viewButton = event.target.closest('[data-view]');
  if (viewButton && getProfile()) {
    activeView = viewButton.dataset.view;
    transactionFilter = '';
    renderApp();
  }

  if (event.target.closest('[data-demo-login]')) await createDemoAccount();
  if (event.target.closest('[data-logout]')) {
    if (dataMode === 'online') {
      const { error } = await supabaseClient.auth.signOut();
      if (error) authMessage.textContent = authErrorMessage(error);
    } else {
      localStorage.removeItem(storageKeys.session);
      currentProfile = null;
      landing.hidden = false;
      authScreen.hidden = true;
      appShell.hidden = true;
    }
  }
  if (event.target.closest('[data-add-transaction]')) {
    document.getElementById('entry-date').value = currentDate();
    transactionDialog.showModal();
  }
  if (event.target.closest('[data-close-dialog]')) transactionDialog.close();

  const deleteButton = event.target.closest('[data-delete-transaction]');
  if (deleteButton) {
    try {
      await removeTransaction(deleteButton.dataset.deleteTransaction);
      renderApp();
    } catch (error) {
      appContent.insertAdjacentHTML('afterbegin', `<p class="form-message">${escapeHtml(error.message)}</p>`);
    }
  }
});

document.getElementById('auth-switch').addEventListener('click', (event) => openAuth(event.currentTarget.dataset.screen));

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    authMessage.textContent = 'O cadastro real ainda não foi ativado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no Netlify.';
    return;
  }

  const { name, email, company, password, passwordConfirm } = Object.fromEntries(new FormData(signupForm));
  if (password !== passwordConfirm) {
    authMessage.textContent = 'As senhas não coincidem.';
    return;
  }

  setButtonLoading(signupForm, true, 'Criar conta');
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim(), company: company.trim() || 'Meu espaço' },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    if (data.session?.user) {
      await activateLiveUser(data.session.user);
    } else {
      authMessage.textContent = 'Conta criada. Confira seu e-mail e confirme o cadastro para entrar.';
      signupForm.reset();
    }
  } catch (error) {
    authMessage.textContent = authErrorMessage(error);
  } finally {
    setButtonLoading(signupForm, false, 'Criar conta');
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    authMessage.textContent = 'O login real ainda não foi ativado. Configure o Supabase no Netlify.';
    return;
  }

  const { email, password } = Object.fromEntries(new FormData(loginForm));
  setButtonLoading(loginForm, true, 'Entrar');
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw error;
    await activateLiveUser(data.user);
  } catch (error) {
    authMessage.textContent = authErrorMessage(error);
  } finally {
    setButtonLoading(loginForm, false, 'Entrar');
  }
});

resetRequestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabaseClient) return;
  const email = new FormData(resetRequestForm).get('email').trim().toLowerCase();
  setButtonLoading(resetRequestForm, true, 'Enviar link de recuperação');
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
    authMessage.textContent = 'Se a conta existir, enviaremos um link de recuperação para esse e-mail.';
  } catch (error) {
    authMessage.textContent = authErrorMessage(error);
  } finally {
    setButtonLoading(resetRequestForm, false, 'Enviar link de recuperação');
  }
});

resetPasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const { password, passwordConfirm } = Object.fromEntries(new FormData(resetPasswordForm));
  if (password !== passwordConfirm) {
    authMessage.textContent = 'As senhas não coincidem.';
    return;
  }
  setButtonLoading(resetPasswordForm, true, 'Salvar nova senha');
  try {
    const { data, error } = await supabaseClient.auth.updateUser({ password });
    if (error) throw error;
    authMessage.textContent = 'Senha atualizada. Entrando na sua conta...';
    if (data.user) await activateLiveUser(data.user);
  } catch (error) {
    authMessage.textContent = authErrorMessage(error);
  } finally {
    setButtonLoading(resetPasswordForm, false, 'Salvar nova senha');
  }
});

document.getElementById('forgot-password').addEventListener('click', () => openAuth('reset-request'));

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

document.getElementById('transaction-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const entry = Object.fromEntries(new FormData(event.currentTarget));
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await addTransaction(entry);
    transactionDialog.close();
    event.currentTarget.reset();
    renderApp();
  } catch (error) {
    document.getElementById('transaction-message').textContent = error.message;
  } finally {
    button.disabled = false;
  }
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

appContent.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(event.target));

  if (event.target.id === 'budget-form') {
    try {
      await addBudget(formData.category.trim(), Number(formData.limit));
      renderApp();
    } catch (error) {
      event.target.insertAdjacentHTML('beforeend', `<p class="form-message">${escapeHtml(error.message)}</p>`);
    }
  }

  if (event.target.id === 'goal-form') {
    try {
      await addGoal(formData.title.trim(), Number(formData.target));
      renderApp();
    } catch (error) {
      event.target.insertAdjacentHTML('beforeend', `<p class="form-message">${escapeHtml(error.message)}</p>`);
    }
  }

  if (event.target.id === 'settings-form') {
    try {
      const name = formData.name.trim();
      const company = formData.company.trim() || 'Meu espaço';
      if (dataMode === 'online') {
        const { error } = await supabaseClient.auth.updateUser({ data: { full_name: name, company } });
        if (error) throw error;
      } else {
        writeStorage(storageKeys.profile, { ...currentProfile, name, company });
      }
      currentProfile = { ...currentProfile, name, company };
      document.getElementById('workspace-name').textContent = company;
      document.getElementById('user-name').textContent = name;
      document.getElementById('user-avatar').textContent = name.slice(0, 1).toUpperCase();
      document.getElementById('settings-message').textContent = 'Alterações salvas.';
    } catch (error) {
      document.getElementById('settings-message').textContent = authErrorMessage(error);
    }
  }
});

const savedTheme = localStorage.getItem(storageKeys.theme);
if (savedTheme === 'light') body.classList.add('light');
document.querySelectorAll('.theme-toggle__icon').forEach((icon) => { icon.textContent = savedTheme === 'light' ? '🌙' : '☀️'; });

document.getElementById('year').textContent = new Date().getFullYear();
if (getEmail()) createDemoAccount();
initializeSupabase();
