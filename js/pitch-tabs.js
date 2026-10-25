/**
 * The 3-tab switcher in the closing pitch section ("Seu site" / "Seu
 * sistema" / "Sua loja"). Each tab renders two pieces: a short centered
 * "intro" beat (icon + one-line tagline) and, below it, a fuller sales-card
 * (headline, description, 3 stat callouts, a feature list, a row of
 * "perk" badges and a closing CTA line).
 *
 * The perk badges (`perks` below) deliberately are NOT a tech stack list
 * (Next.js, Laravel, etc.) — a client hiring a site/system/loja doesn't
 * know or care what those mean. Each one is a short, concrete BENEFIT
 * with an emoji as its icon, written to be skimmed in under a second and
 * to pre-empt the objections that stall a sale (speed, security, support,
 * results) — the same handful of triggers copywriting always leans on.
 *
 * There is exactly ONE place that content lives — the TABS object below.
 * index.html's #pitchTabContent starts empty; render() builds its whole
 * innerHTML from whichever tab is active, including on first load. That
 * avoids the classic "tab 1 hardcoded in HTML, tabs 2/3 hardcoded in JS"
 * trap, where the three end up drifting out of sync with each other.
 *
 * To add a 4th tab: add one entry to TABS (reusing an existing `icon` key
 * or adding a new one to ICONS), and one matching
 * <button class="pitch-tab" data-tab="...."> in index.html — the render
 * function and the click wiring below both already loop over whatever
 * tabs exist, so nothing else needs to change.
 */
const ICONS = {
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9s1.3-6.5 3.8-9z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  dollar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
};

// Per-tab accent (site = roxo, sistema = amarelo, loja = verde, automação =
// azul elétrico), applied to the whole tab — not just the icon — via the
// --tab-accent* custom properties set on .pitch-tabs in
// activate()/initPitchTabs() below. See css/main.css's ".pitch-tabs" rule
// for the full list of elements that read these three variables.
const ACCENTS = {
  globe: { accent: '#a882e0', soft: 'rgba(168, 130, 224, 0.35)', bright: '#c3a8ee' },
  gear: { accent: '#e8c34a', soft: 'rgba(232, 195, 74, 0.35)', bright: '#f0d572' },
  dollar: { accent: '#4cd18c', soft: 'rgba(76, 209, 140, 0.35)', bright: '#7ee0ac' },
  bolt: { accent: '#3fb8e8', soft: 'rgba(63, 184, 232, 0.35)', bright: '#7dd3f0' },
};

const TABS = {
  site: {
    icon: 'globe',
    tagline: 'A porta que o mundo atravessa antes de confiar em você.',
    headline: ['Um site que faz seu cliente dizer', '"preciso desse cara" antes de ler tudo.'],
    description:
      'Seu concorrente tem um site. Você vai ter uma experiência. A diferença entre ser esquecido e ser a primeira ligação que o cliente faz.',
    stats: [
      { value: '3s', label: 'tempo pra causar impacto' },
      { value: '+70%', label: 'clientes decidem pelo visual' },
      { value: '24h', label: 'vendendo enquanto dorme' },
    ],
    features: [
      'Design exclusivo — nenhum template, nenhum site igual ao seu',
      'Animações cinematográficas que prendem o visitante',
      'SEO para aparecer no Google desde o primeiro dia',
      'Mobile perfeito — seu cliente compra do celular',
    ],
    perks: [
      { icon: '⚡', label: 'Carrega em menos de 3s' },
      { icon: '🔒', label: 'Site seguro, com SSL' },
      { icon: '📱', label: '100% responsivo' },
      { icon: '🎯', label: 'Feito pra converter' },
      { icon: '🛠️', label: 'Suporte após a entrega' },
    ],
    footerNote: 'Pronto para ser encomendado?',
    cta: 'Quero meu site',
  },
  sistema: {
    icon: 'gear',
    tagline: 'O mecanismo invisível que faz seu negócio escalar sem você estar presente.',
    headline: ['Um sistema que trabalha por você', 'enquanto você dorme.'],
    description:
      'Processos manuais custam tempo. Tempo é dinheiro. Um sistema feito pra você elimina o retrabalho, organiza sua operação e abre espaço pro seu negócio crescer de verdade.',
    stats: [
      { value: '-80%', label: 'menos tempo em tarefas manuais' },
      { value: '∞', label: 'escala sem contratar mais' },
      { value: '100%', label: 'feito pro seu negócio' },
    ],
    features: [
      'Painel de controle do seu negócio em tempo real',
      'Login, permissões e acesso de equipes',
      'Integração com ferramentas que você já usa',
      'Relatórios e dados que ajudam você a decidir',
    ],
    perks: [
      { icon: '🔐', label: 'Dados sempre protegidos' },
      { icon: '☁️', label: 'Acesso de qualquer lugar' },
      { icon: '🔄', label: 'Atualizações sem custo extra' },
      { icon: '📊', label: 'Decisões com dados reais' },
      { icon: '🤝', label: 'Suporte direto comigo' },
    ],
    footerNote: 'Pronto para automatizar?',
    cta: 'Quero meu sistema',
  },
  loja: {
    icon: 'dollar',
    tagline: 'O mercado que nunca fecha. O ouro que flui enquanto você vive.',
    headline: ['Uma loja que vende sozinha', 'em qualquer hora, em qualquer lugar.'],
    description:
      'Seu produto merece uma vitrine à altura. Uma loja digital bem construída vende mais, passa mais credibilidade e faz o cliente voltar. Isso não é sorte — é design e estratégia.',
    stats: [
      { value: '3x', label: 'mais vendas com checkout rápido' },
      { value: '24/7', label: 'vendendo sem você presente' },
      { value: '+60%', label: 'clientes voltam com boa UX' },
    ],
    features: [
      'Catálogo visual que valoriza cada produto',
      'Checkout em 3 cliques — menos abandono de carrinho',
      'Pix, cartão, boleto — tudo integrado',
      'Painel de pedidos, estoque e clientes',
    ],
    perks: [
      { icon: '💳', label: 'Pix, cartão e boleto' },
      { icon: '🔒', label: 'Compra 100% segura' },
      { icon: '🚀', label: 'Checkout rápido' },
      { icon: '📈', label: 'Feita pra vender mais' },
    ],
    footerNote: 'Pronto para vender online?',
    cta: 'Quero minha loja',
  },
  automacao: {
    icon: 'bolt',
    tagline: 'O trabalho que se faz sozinho enquanto você cuida do que importa.',
    headline: ['Seu negócio no automático.', 'Menos tarefa repetida, mais tempo pra crescer.'],
    description:
      'Responder o mesmo WhatsApp dez vezes por dia, copiar dados de planilha, lembrar cliente de horário… Eu transformo essas tarefas em processos que rodam sozinhos.',
    stats: [
      { value: '24/7', label: 'funcionando sem pausa' },
      { value: '1 clique', label: 'no lugar de dez' },
      { value: '0', label: 'clientes esquecidos' },
    ],
    features: [
      'Atendimento e respostas automáticas no WhatsApp',
      'Agendamentos e lembretes enviados sozinhos',
      'Planilhas, formulários e sistemas conversando entre si',
      'Inteligência artificial aplicada à rotina do seu negócio',
    ],
    perks: [
      { icon: '🤖', label: 'Com IA' },
      { icon: '🔗', label: 'Integra com o que você já usa' },
      { icon: '📊', label: 'Relatórios automáticos' },
      { icon: '🛠️', label: 'Suporte após a entrega' },
    ],
    footerNote: 'Quanto tempo você perde por semana?',
    cta: 'Quero automatizar',
  },
};

// Escapes text pulled into innerHTML — all of TABS above is our own fixed
// copy, not user input, but doing this anyway costs nothing and means this
// function stays safe to reuse if the content source ever changes.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderIntro(data) {
  return `
    <div class="pitch-tab-intro">
      <div class="pitch-tab-icon">${ICONS[data.icon]}</div>
      <p class="pitch-tab-tagline">"${escapeHtml(data.tagline)}"</p>
      <div class="pitch-tab-intro-accent"></div>
    </div>
  `;
}

function renderCard(data) {
  const [headlineMain, headlineAccent] = data.headline;
  return `
    <div class="pitch-tab-panel">
      <h3 class="pitch-tab-headline">
        ${escapeHtml(headlineMain)}<br />
        <em>${escapeHtml(headlineAccent)}</em>
      </h3>
      <p class="pitch-tab-desc">${escapeHtml(data.description)}</p>
      <div class="pitch-tab-stats">
        ${data.stats
          .map(
            (stat) => `
          <div class="pitch-tab-stat">
            <span class="pitch-tab-stat-value">${escapeHtml(stat.value)}</span>
            <span class="pitch-tab-stat-label">${escapeHtml(stat.label)}</span>
          </div>`
          )
          .join('')}
      </div>
      <ul class="pitch-tab-features">
        ${data.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}
      </ul>
      <div class="pitch-tab-stack">
        ${data.perks
          .map(
            (perk) => `
          <span class="pitch-tab-pill">
            <span class="pitch-tab-pill-icon" aria-hidden="true">${perk.icon}</span>${escapeHtml(perk.label)}
          </span>`
          )
          .join('')}
      </div>
      <div class="pitch-tab-footer">
        <span class="pitch-tab-footer-note">${escapeHtml(data.footerNote)}</span>
        <a class="pitch-tab-cta" href="#">
          ${escapeHtml(data.cta)}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </div>
  `;
}

export function initPitchTabs() {
  const tabs = document.querySelectorAll('.pitch-tab');
  const content = document.getElementById('pitchTabContent');
  const tabsRoot = document.querySelector('.pitch-tabs');

  const FADE_MS = 220; // must match .pitch-tab-content's transition duration in css/main.css

  function applyAccent(data) {
    const { accent, soft, bright } = ACCENTS[data.icon];
    tabsRoot.style.setProperty('--tab-accent', accent);
    tabsRoot.style.setProperty('--tab-accent-soft', soft);
    tabsRoot.style.setProperty('--tab-accent-bright', bright);
  }

  function activate(key) {
    // The active tab's underline/index number are colored by the same
    // --tab-accent variable, so it's applied right away (in sync with the
    // .is-active class below) rather than waiting on the content fade —
    // otherwise the underline would jump to the new tab's position before
    // catching up to its color a moment later.
    applyAccent(TABS[key]);
    content.classList.add('is-fading');
    setTimeout(() => {
      const data = TABS[key];
      content.innerHTML = renderIntro(data) + renderCard(data);
      content.classList.remove('is-fading');
    }, FADE_MS);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('is-active')) return;
      tabs.forEach((t) => {
        const isThisOne = t === tab;
        t.classList.toggle('is-active', isThisOne);
        t.setAttribute('aria-selected', String(isThisOne));
      });
      activate(tab.dataset.tab);
    });
  });

  // Render whichever tab starts marked .is-active in the HTML, immediately
  // — no fade needed since there's nothing on screen yet to transition from.
  const initialTab = document.querySelector('.pitch-tab.is-active') ?? tabs[0];
  const initialData = TABS[initialTab.dataset.tab];
  applyAccent(initialData);
  content.innerHTML = renderIntro(initialData) + renderCard(initialData);
}
