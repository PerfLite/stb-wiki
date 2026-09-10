/**
 * Skyrim True Believer 3.0 - Interactive Encyclopedia
 * Standalone Client-side App for GitHub Pages
 */

const App = {
  dataCache: {},
  currentView: 'overview',
  favorites: JSON.parse(localStorage.getItem('stb_favorites') || '[]'),
  completedQuests: JSON.parse(localStorage.getItem('stb_quests') || '[]'),
  searchIndex: [],

  async init() {
    this.bindEvents();
    await this.loadSearchIndex();
    
    // Initial route
    const hash = window.location.hash.replace('#', '') || 'overview';
    this.navigate(hash);
  },

  bindEvents() {
    // Hash change routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      this.navigate(hash);
    });

    // Mobile sidebar toggle
    const menuBtn = document.getElementById('menuToggleBtn');
    const sidebar = document.getElementById('sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Close sidebar on link click (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 992) {
          sidebar.classList.remove('open');
        }
      });
    });

    // Search trigger
    const searchTrigger = document.getElementById('searchTrigger');
    const searchModal = document.getElementById('searchModal');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchModalInput');

    if (searchTrigger && searchModal) {
      searchTrigger.addEventListener('click', () => this.openSearchModal());
      searchClose.addEventListener('click', () => this.closeSearchModal());
      searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) this.closeSearchModal();
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearchModal();
      } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.openSearchModal();
      } else if (e.key === 'Escape') {
        this.closeSearchModal();
        this.closeFavoritesModal();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
    }

    // Favorites trigger
    const favBtn = document.getElementById('favTriggerBtn');
    const favModal = document.getElementById('favoritesModal');
    const favClose = document.getElementById('favoritesClose');
    if (favBtn && favModal) {
      favBtn.addEventListener('click', () => this.openFavoritesModal());
      favClose.addEventListener('click', () => this.closeFavoritesModal());
      favModal.addEventListener('click', (e) => {
        if (e.target === favModal) this.closeFavoritesModal();
      });
    }
  },

  async fetchData(filename) {
    if (this.dataCache[filename]) return this.dataCache[filename];
    try {
      const res = await fetch(`data/${filename}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.dataCache[filename] = data;
      return data;
    } catch (err) {
      console.error(`Failed to load ${filename}:`, err);
      return null;
    }
  },

  async loadSearchIndex() {
    const data = await this.fetchData('search_index.json');
    if (data) this.searchIndex = data;
  },

  navigate(viewName) {
    this.currentView = viewName;

    // Update active nav link
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Render corresponding view
    const mainView = document.getElementById('viewContent');
    if (!mainView) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (viewName) {
      case 'overview':
        this.renderOverview(mainView);
        break;
      case 'base':
        this.renderBase(mainView);
        break;
      case 'races_stones':
        this.renderRacesStones(mainView);
        break;
      case 'aedra':
        this.renderAedra(mainView);
        break;
      case 'daedra':
        this.renderDaedra(mainView);
        break;
      case 'cursed':
        this.renderCursed(mainView);
        break;
      case 'perks':
        this.renderPerks(mainView);
        break;
      case 'consumables':
        this.renderConsumables(mainView);
        break;
      case 'enchantments':
        this.renderEnchantments(mainView);
        break;
      case 'spells_shouts':
        this.renderSpellsShouts(mainView);
        break;
      case 'summons':
        this.renderSummons(mainView);
        break;
      case 'equipment':
        this.renderEquipment(mainView);
        break;
      case 'uniques':
        this.renderUniques(mainView);
        break;
      case 'difficulty':
        this.renderDifficulty(mainView);
        break;
      case 'black_books':
        this.renderBlackBooks(mainView);
        break;
      case 'quest_rewards':
        this.renderQuestRewards(mainView);
        break;
      default:
        this.renderOverview(mainView);
        break;
    }
  },

  // -------------------------------------------------------------
  // TOAST SYSTEM
  // -------------------------------------------------------------
  showToast(message, icon = '✓') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  },

  copyToClipboard(text, notifyText = 'Скопировано в буфер!') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(notifyText);
    }).catch(() => {
      this.showToast(text, '📋');
    });
  },

  // -------------------------------------------------------------
  // FAVORITES SYSTEM
  // -------------------------------------------------------------
  toggleFavorite(item) {
    const idx = this.favorites.findIndex(f => f.title === item.title);
    if (idx >= 0) {
      this.favorites.splice(idx, 1);
      this.showToast(`Удалено из закладок: ${item.title}`, '✕');
    } else {
      this.favorites.push(item);
      this.showToast(`Добавлено в закладки: ${item.title}`, '★');
    }
    localStorage.setItem('stb_favorites', JSON.stringify(this.favorites));
    this.updateFavoritesModalContent();
  },

  isFavorite(title) {
    return this.favorites.some(f => f.title === title);
  },

  openFavoritesModal() {
    const modal = document.getElementById('favoritesModal');
    if (modal) {
      this.updateFavoritesModalContent();
      modal.classList.add('active');
    }
  },

  closeFavoritesModal() {
    const modal = document.getElementById('favoritesModal');
    if (modal) modal.classList.remove('active');
  },

  updateFavoritesModalContent() {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    if (this.favorites.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">Нет сохраненных элементов. Нажимайте звездочку рядом с перками, уникальными предметами или заклинаниями, чтобы добавить их сюда.</p>`;
      return;
    }
    container.innerHTML = this.favorites.map((fav, i) => `
      <div class="search-result-item" style="margin-bottom: 8px;">
        <div class="search-result-top">
          <span class="search-result-title">${fav.title}</span>
          <button onclick="App.toggleFavorite({title: '${fav.title}'})" style="background:none; border:none; color: var(--accent-red); cursor:pointer; font-size:1rem;">✕</button>
        </div>
        <div class="search-result-snippet">${fav.subtitle || ''}</div>
      </div>
    `).join('');
  },

  // -------------------------------------------------------------
  // GLOBAL SEARCH MODAL
  // -------------------------------------------------------------
  openSearchModal() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchModalInput');
    if (modal) {
      modal.classList.add('active');
      if (input) {
        input.value = '';
        input.focus();
        this.handleSearchInput('');
      }
    }
  },

  closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) modal.classList.remove('active');
  },

  handleSearchInput(query) {
    const list = document.getElementById('searchResultsList');
    if (!list) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      list.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px;">
          <p>Введите название способности, камня, бога, уникального предмета или заклинания...</p>
          <p style="font-size: 0.8rem; margin-top: 8px;">Всего доступно более 1 250 записей по всей сборке</p>
        </div>
      `;
      return;
    }

    const matches = this.searchIndex.filter(item => {
      return item.title.toLowerCase().includes(q) ||
             (item.snippet && item.snippet.toLowerCase().includes(q)) ||
             (item.category && item.category.toLowerCase().includes(q));
    }).slice(0, 40);

    if (matches.length === 0) {
      list.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 30px;">Ничего не найдено по запросу "<strong>${query}</strong>"</div>`;
      return;
    }

    list.innerHTML = matches.map(m => `
      <div class="search-result-item" onclick="App.goToSearchResult('${m.target}', '${m.title}')">
        <div class="search-result-top">
          <span class="search-result-title">${m.title}</span>
          <span class="search-result-cat">${m.category}</span>
        </div>
        <div class="search-result-snippet">${m.snippet || ''}</div>
      </div>
    `).join('');
  },

  goToSearchResult(targetView, title) {
    this.closeSearchModal();
    window.location.hash = targetView;
    setTimeout(() => {
      this.showToast(`Переход: ${title}`, '🔍');
    }, 200);
  },

  // -------------------------------------------------------------
  // 1. OVERVIEW
  // -------------------------------------------------------------
  async renderOverview(container) {
    const nav = await this.fetchData('navigation.json');
    if (!nav) return;

    container.innerHTML = `
      <div class="hero-card">
        <div class="hero-text">
          <h2>${nav.title}</h2>
          <p class="lead">${nav.subtitle}</p>
          <div style="margin-bottom: 20px;">
            <span class="brand-badge">Версия ${nav.version}</span>
            <span style="font-size: 0.85rem; color: var(--accent-green); margin-left: 10px;">${nav.update_note}</span>
          </div>
          <div class="hero-actions">
            <a href="#uniques" class="action-btn primary">💎 База уникальных предметов</a>
            <a href="#perks" class="action-btn secondary">⭐ Все 18 веток навыков</a>
            <button onclick="App.copyToClipboard('${nav.test_room}', 'Команда ${nav.test_room} скопирована!')" class="action-btn secondary">
              🧪 Тест-комната: <code>${nav.test_room}</code>
            </button>
          </div>
        </div>
        <div class="hero-image-wrap">
          <img src="assets/img/image30.png" alt="Skyrim True Believer Art" onerror="this.style.display='none'">
        </div>
      </div>

      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🧭 Быстрый доступ к разделам</h2>
          <p>Выберите интересующую категорию энциклопедии для быстрого изучения</p>
        </div>
      </div>

      <div class="quick-nav-grid">
        <a href="#base" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">📚</span>
            <span class="quick-card-count">20 тем</span>
          </div>
          <h3>База и механики</h3>
          <p>Опыт, формулы урона, резисты, интоксикация от зелий, баланс и крафт.</p>
        </a>

        <a href="#races_stones" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">🗿</span>
            <span class="quick-card-count">19 камней</span>
          </div>
          <h3>Расы и Камни Судьбы</h3>
          <p>Врожденные способности на выбор, скалирование камней от характеристик.</p>
        </a>

        <a href="#aedra" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">😇</span>
            <span class="quick-card-count">9 Богов</span>
          </div>
          <h3>Аэдра и Молитвы</h3>
          <p>Благословения, усиление от кармы, амулеты и рюкзаки покровительства.</p>
        </a>

        <a href="#daedra" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">😈</span>
            <span class="quick-card-count">16 Принцев</span>
          </div>
          <h3>Даэдра и Артефакты</h3>
          <p>Подношения, усиленные артефакты богов, дары за возвращение реликвий.</p>
        </a>

        <a href="#cursed" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">🧛🐺</span>
            <span class="quick-card-count">2 ветки</span>
          </div>
          <h3>Проклятые (Вампир / Вервольф)</h3>
          <p>Чистота крови ЧК 1–5, таланты формы, уникальные способности в теле человека.</p>
        </a>

        <a href="#perks" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">⭐</span>
            <span class="quick-card-count">18 веток</span>
          </div>
          <h3>Ветки способностей</h3>
          <p>Интерактивное древо всех навыков, требования по уровням и ранги.</p>
        </a>

        <a href="#consumables" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">🧪</span>
            <span class="quick-card-count">Тиры I–V</span>
          </div>
          <h3>Расходники и Алхимия</h3>
          <p>Зелья восполнения и усиления, яды, еда со стакающимся эффектом, алкоголь.</p>
        </a>

        <a href="#enchantments" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">✨</span>
            <span class="quick-card-count">Тиры I–V</span>
          </div>
          <h3>Зачарования</h3>
          <p>Сила камней душ, эффекты по тирам и совместимость со слотами снаряжения.</p>
        </a>

        <a href="#spells_shouts" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">🌈</span>
            <span class="quick-card-count">590+ заклинаний</span>
          </div>
          <h3>Заклинания и Ту'умы</h3>
          <p>Все школы магии, дуалкаст, время каста, манакосты и слова драконьих криков.</p>
        </a>

        <a href="#summons" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">👻</span>
            <span class="quick-card-count">Саммоны</span>
          </div>
          <h3>Призываемые существа</h3>
          <p>Характеристики духов, големов, нежити и даэдра, урон, ауры и сопротивления.</p>
        </a>

        <a href="#equipment" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">⚔️</span>
            <span class="quick-card-count">Оружие и Броня</span>
          </div>
          <h3>Снаряжение</h3>
          <p>Сравнение типов оружия по ДПС, дальности, скорости и материалам.</p>
        </a>

        <a href="#uniques" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">💎</span>
            <span class="quick-card-count">740+ предметов</span>
          </div>
          <h3>Уникальные предметы</h3>
          <p>Маски жрецов, артефакты, амулеты, квесты и мгновенное копирование FormID.</p>
        </a>

        <a href="#difficulty" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">🥇</span>
            <span class="quick-card-count">4 режима</span>
          </div>
          <h3>Настройки сложности</h3>
          <p>Множители урона, опыта, скорости и хардкорные правила каждого уровня.</p>
        </a>

        <a href="#black_books" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">🏆</span>
            <span class="quick-card-count">7 книг</span>
          </div>
          <h3>Черные книги Апокрифа</h3>
          <p>Все способности на выбор Хермеуса Моры, курганы и условия открытия.</p>
        </a>

        <a href="#quest_rewards" class="quick-card">
          <div class="quick-card-top">
            <span class="quick-card-icon">💰</span>
            <span class="quick-card-count">2 150 монет</span>
          </div>
          <h3>Награды за квесты</h3>
          <p>Древние монеты на очки перков, отслеживание пройденных квестов.</p>
        </a>
      </div>

      <!-- Credits Section -->
      <div class="hero-card" style="padding: 25px; margin-top: 20px;">
        <div style="width: 100%;">
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin-bottom: 12px;">🛡️ Создатели и разработчики STB</h3>
          <p style="font-size: 0.9rem; margin-bottom: 8px;">
            <strong>Основные разработчики:</strong> Sneyk, MoonDream, Polaris, KBA3AP, Мельче, Nikita, Frem
          </p>
          <p style="font-size: 0.9rem; margin-bottom: 8px;">
            <strong>Активные помощники:</strong> StarkMP, Мастер Изгой Егор, Sewhass
          </p>
          <p style="font-size: 0.9rem; color: var(--text-muted);">
            <strong>Арт и графическое оформление:</strong> SUNBARDO | №1 - Глубже, №2 - silk_911, №3 - leonhetch
          </p>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // 2. BASE MECHANICS
  // -------------------------------------------------------------
  async renderBase(container) {
    const data = await this.fetchData('base.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>📚 База и основные механики</h2>
          <p>Полное руководство по правилам боевой системы, атрибутам, опыту и интоксикации</p>
        </div>
        <div class="section-controls">
          <input type="text" id="baseFilterInput" class="filter-input" placeholder="Фильтр по темам...">
        </div>
      </div>

      <!-- Intoxication Interactive Widget -->
      <div class="hero-card" style="padding: 24px; margin-bottom: 25px;">
        <div style="width: 100%;">
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin-bottom: 8px;">🧪 Интоксикация и штрафы зелий</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
            При потреблении зелий уровень интоксикации растет. Превышение порога в 60 ед. снижает силу последующих лечебных зелий.
          </p>
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Уровень интоксикации</th>
                  <th>Диапазон очков</th>
                  <th>Штраф к эффекту зелий</th>
                  <th>Примечание</th>
                </tr>
              </thead>
              <tbody>
                ${data.intoxication_table.map(row => `
                  <tr>
                    <td><strong>${row.level}</strong></td>
                    <td><span class="copy-badge">${row.range}</span></td>
                    <td style="color: var(--accent-red); font-weight: 600;">${row.penalty}</td>
                    <td>${row.recommendation}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="cards-grid" id="baseCardsGrid">
        ${data.sections.map(sec => `
          <div class="info-card" data-title="${sec.title.toLowerCase()}">
            <div class="info-card-header">
              <h3 class="info-card-title">${sec.title}</h3>
              <span class="info-card-badge gold">Механика</span>
            </div>
            <div class="info-card-body">${sec.content}</div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('baseFilterInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#baseCardsGrid .info-card').forEach(card => {
        const title = card.getAttribute('data-title');
        const text = card.innerText.toLowerCase();
        card.style.display = (title.includes(q) || text.includes(q)) ? 'flex' : 'none';
      });
    });
  },

  // -------------------------------------------------------------
  // 3. RACES & STANDING STONES
  // -------------------------------------------------------------
  async renderRacesStones(container) {
    const data = await this.fetchData('races_stones.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🗿 Расы и Камни Хранители</h2>
          <p>Врожденные способности и динамическое усиление эффектов камней от ваших характеристик</p>
        </div>
        <div class="section-controls">
          <input type="text" id="stoneFilterInput" class="filter-input" placeholder="Поиск камня судьбы...">
        </div>
      </div>

      <!-- Start Rules Card -->
      <div class="hero-card" style="padding: 20px; margin-bottom: 25px;">
        <div>
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin-bottom: 8px;">⚡ На старте персонажа:</h3>
          <ul style="padding-left: 20px; color: var(--text-main); font-size: 0.95rem;">
            ${data.start_rules.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Innate Abilities -->
      <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin: 25px 0 15px;">
        ✨ Врожденные способности (одна на выбор)
      </h3>
      <div class="cards-grid" style="margin-bottom: 35px;">
        ${data.innate_abilities.map((ab, i) => `
          <div class="info-card" style="padding: 15px;">
            <div style="font-size: 0.92rem; font-weight: 600; color: var(--text-gold); white-space: pre-line;">${ab}</div>
          </div>
        `).join('')}
      </div>

      <!-- Standing Stones -->
      <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin: 25px 0 15px;">
        🌌 Камни судьбы
      </h3>
      <div class="cards-grid" id="stonesGrid">
        ${data.standing_stones.map(stone => `
          <div class="info-card" data-name="${stone.name.toLowerCase()}">
            <div class="info-card-header">
              <h3 class="info-card-title">${stone.name}</h3>
              <span class="info-card-badge gold">${stone.group}</span>
            </div>
            <div class="info-card-body">${stone.description}</div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('stoneFilterInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#stonesGrid .info-card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  },

  // -------------------------------------------------------------
  // 4. AEDRA
  // -------------------------------------------------------------
  async renderAedra(container) {
    const data = await this.fetchData('aedra.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>😇 Девять Аэдра</h2>
          <p>Божественные дары, молитвы на алтарях и скалирование благословений от кармы</p>
        </div>
      </div>

      <!-- Rules and Prayer costs -->
      <div class="hero-card" style="padding: 24px; margin-bottom: 30px;">
        <div style="width: 100%;">
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin-bottom: 8px;">📜 Правила поклонения Аэдра</h3>
          <ul style="padding-left: 20px; color: var(--text-main); font-size: 0.92rem; margin-bottom: 15px;">
            ${data.rules.map(r => `<li>${r}</li>`).join('')}
          </ul>
          
          <h4 style="color: var(--accent-gold-bright); font-size: 0.95rem; margin-bottom: 8px;">Цены и уровни персонажа для молитв:</h4>
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Бог по счету</th>
                  <th>Молитва 1</th>
                  <th>Молитва 2</th>
                  <th>Молитва 3</th>
                  <th>Молитва 4</th>
                  <th>Молитва 5</th>
                </tr>
              </thead>
              <tbody>
                ${data.prayer_costs.map(row => `
                  <tr>
                    <td><strong>${row.aedra_slot}</strong></td>
                    ${row.prayers.map(p => `
                      <td>${p.cost} з. <br><span style="font-size:0.75rem; color:var(--accent-blue);">Ур. ${p.level}</span></td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Gods Pantheon Grid -->
      <div class="pantheon-grid">
        ${data.gods.map(god => `
          <div class="pantheon-card">
            <div class="pantheon-header">
              <img src="${god.image}" class="pantheon-img" alt="${god.name}" onerror="this.src='assets/img/image7.png'">
              <div class="pantheon-title">
                <h3>${god.name}</h3>
                <span class="pantheon-sphere">Священный Аэдра</span>
              </div>
            </div>
            <div class="pantheon-body">
              <div class="pantheon-row">
                <div class="pantheon-row-title">✨ Божественный дар (до 3 богов)</div>
                <div class="pantheon-row-content">${god.gift}</div>
              </div>
              <div class="pantheon-row">
                <div class="pantheon-row-title">🌟 Благословение алтаря</div>
                <div class="pantheon-row-content">${god.blessing}</div>
              </div>
              <div class="pantheon-row">
                <div class="pantheon-row-title">📿 Амулет Аэдра</div>
                <div class="pantheon-row-content">${god.amulet}</div>
              </div>
              <div class="pantheon-row">
                <div class="pantheon-row-title">🎒 Рюкзак с амулетом</div>
                <div class="pantheon-row-content">${god.backpack}</div>
              </div>
              ${god.notes ? `
                <div class="pantheon-row" style="border-top: 1px dashed var(--border-card); padding-top: 8px;">
                  <div class="pantheon-row-title">📝 Примечание</div>
                  <div class="pantheon-row-content" style="color: var(--text-muted); font-size: 0.82rem;">${god.notes}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // 5. DAEDRA
  // -------------------------------------------------------------
  async renderDaedra(container) {
    const data = await this.fetchData('daedra.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>😈 Шестнадцать Принцев Даэдра</h2>
          <p>Темные покровители, их сферы влияния, подношения и усиленные артефакты</p>
        </div>
        <div class="section-controls">
          <input type="text" id="daedraFilterInput" class="filter-input" placeholder="Поиск принца Даэдра...">
        </div>
      </div>

      <!-- Rules -->
      <div class="hero-card" style="padding: 20px; margin-bottom: 30px;">
        <div>
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin-bottom: 8px;">📜 Правила поклонения Даэдра</h3>
          <ul style="padding-left: 20px; color: var(--text-main); font-size: 0.92rem;">
            ${data.rules.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="pantheon-grid" id="daedraGrid">
        ${data.gods.map(god => `
          <div class="pantheon-card" data-name="${god.name.toLowerCase()}">
            <div class="pantheon-header">
              <img src="${god.image}" class="pantheon-img" alt="${god.name}" onerror="this.src='assets/img/image23.jpg'">
              <div class="pantheon-title">
                <h3>${god.name}</h3>
                <span class="pantheon-sphere">${god.sphere || 'Лорд Даэдра'}</span>
              </div>
            </div>
            <div class="pantheon-body">
              <div class="pantheon-row">
                <div class="pantheon-row-title">🔥 Божественный дар / за возврат реликвии</div>
                <div class="pantheon-row-content">${god.gift}</div>
              </div>

              ${god.artifacts.map(art => `
                <div class="pantheon-row" style="background: rgba(255,255,255,0.02); padding: 10px; border-radius: 6px;">
                  <div class="pantheon-row-title" style="color: var(--accent-gold-bright);">
                    🗡️ ${art.name || 'Артефакт'}
                  </div>
                  <div class="pantheon-row-content">${art.effect}</div>
                  ${art.stats ? `<div style="font-size: 0.8rem; color: var(--accent-blue); margin-top: 4px;">Урон/Броня: ${art.stats} | Вес: ${art.weight}</div>` : ''}
                </div>
              `).join('')}

              ${god.quest ? `
                <div class="pantheon-row">
                  <div class="pantheon-row-title">📜 Квест получения</div>
                  <div class="pantheon-row-content" style="color: var(--accent-cyan);">${god.quest}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('daedraFilterInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#daedraGrid .pantheon-card').forEach(card => {
        const text = card.innerText.toLowerCase();
        card.style.display = text.includes(q) ? 'flex' : 'none';
      });
    });
  },

  // -------------------------------------------------------------
  // 6. CURSED (Vampire & Werewolf)
  // -------------------------------------------------------------
  async renderCursed(container) {
    const data = await this.fetchData('cursed.json');
    if (!data) return;

      const parseChk = (r) => {
        const m = String(r || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };
      const sortedWerewolf = [...data.werewolf.perks].sort((a, b) => parseChk(a.req) - parseChk(b.req) || a.name.localeCompare(b.name, 'ru'));
      const sortedVampire = [...data.vampire.perks].sort((a, b) => parseChk(a.req) - parseChk(b.req) || a.name.localeCompare(b.name, 'ru'));

      container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🧛🐺 Проклятые (Вампиры и Вервольфы)</h2>
          <p>Система чистоты крови (ЧК 1–5), таланты и способности, работающие в обычной форме</p>
        </div>
      </div>

      <!-- Werewolf Section -->
      <div class="section-header-box" style="margin-top: 20px;">
        <div class="section-header-left">
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); font-size: 1.4rem;">🐺 ${data.werewolf.title}</h3>
        </div>
      </div>
      <div class="hero-card" style="padding: 18px; margin-bottom: 20px;">
        <ul style="padding-left: 20px; font-size: 0.92rem;">
          ${data.werewolf.rules.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      <div class="perks-node-grid" style="margin-bottom: 40px;">
        ${sortedWerewolf.map(p => `
          <div class="perk-card">
            <div class="perk-top">
              <span class="perk-name">${p.name}</span>
              <span class="perk-level-badge">${p.req}</span>
            </div>
            <div class="perk-desc">${p.effect}</div>
          </div>
        `).join('')}
      </div>

      <!-- Vampire Section -->
      <div class="section-header-box">
        <div class="section-header-left">
          <h3 style="font-family: var(--font-title); color: var(--accent-red); font-size: 1.4rem;">🧛 ${data.vampire.title}</h3>
        </div>
      </div>
      <div class="hero-card" style="padding: 18px; margin-bottom: 20px;">
        <ul style="padding-left: 20px; font-size: 0.92rem;">
          ${data.vampire.rules.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      <div class="perks-node-grid">
        ${sortedVampire.map(p => `
          <div class="perk-card" style="border-left: 3px solid var(--accent-red);">
            <div class="perk-top">
              <span class="perk-name" style="color: #ff9999;">${p.name}</span>
              <span class="perk-level-badge" style="background: rgba(224, 108, 117, 0.15); color: var(--accent-red);">${p.req}</span>
            </div>
            <div class="perk-desc">${p.effect}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // 7. PERKS (18 Skill Trees)
  // -------------------------------------------------------------
  async renderPerks(container) {
    const data = await this.fetchData('perks.json');
    if (!data) return;

    let selectedTreeIndex = 0;
    let sortMode = 'lvl-asc'; // 'lvl-asc', 'lvl-desc', 'name-asc'

    const getMinLevel = (lvlStr) => {
      const m = String(lvlStr || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };

    const getLevelBadgeStyle = (lvlStr) => {
      const lvl = getMinLevel(lvlStr);
      if (lvl <= 20) return 'background: rgba(152, 195, 121, 0.15); color: var(--accent-green);';
      if (lvl <= 45) return 'background: rgba(97, 175, 239, 0.15); color: var(--accent-blue);';
      if (lvl <= 65) return 'background: rgba(198, 120, 221, 0.15); color: var(--accent-purple);';
      if (lvl <= 85) return 'background: rgba(229, 192, 123, 0.15); color: var(--accent-gold);';
      return 'background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(212, 175, 55, 0.15)); color: var(--accent-gold-bright); border: 1px solid var(--accent-gold);';
    };

    const sortPerks = (perks, mode) => {
      const arr = [...perks];
      if (mode === 'lvl-asc') {
        arr.sort((a, b) => getMinLevel(a.level) - getMinLevel(b.level) || a.name.localeCompare(b.name, 'ru'));
      } else if (mode === 'lvl-desc') {
        arr.sort((a, b) => getMinLevel(b.level) - getMinLevel(a.level) || a.name.localeCompare(b.name, 'ru'));
      } else if (mode === 'name-asc') {
        arr.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      }
      return arr;
    };

    const renderTree = (idx) => {
      selectedTreeIndex = idx;
      const tree = data[idx];
      const treeContent = document.getElementById('selectedTreeContent');
      if (!treeContent) return;

      document.querySelectorAll('.tree-pill').forEach((pill, i) => {
        if (i === idx) pill.classList.add('active');
        else pill.classList.remove('active');
      });

      const sortedPerks = sortPerks(tree.perks, sortMode);

      treeContent.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px;">
          <h3 style="font-family: var(--font-title); color: var(--accent-gold); font-size: 1.3rem;">
            ${tree.name} <span class="nav-badge" style="margin-left: 8px;">${tree.total_perks} перков</span>
          </h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Сортировка:</span>
            <button class="header-btn sort-btn ${sortMode === 'lvl-asc' ? 'highlight' : ''}" onclick="App.changePerkSort('lvl-asc')">
              Ур. 1 ➔ 100
            </button>
            <button class="header-btn sort-btn ${sortMode === 'lvl-desc' ? 'highlight' : ''}" onclick="App.changePerkSort('lvl-desc')">
              Ур. 100 ➔ 1
            </button>
            <button class="header-btn sort-btn ${sortMode === 'name-asc' ? 'highlight' : ''}" onclick="App.changePerkSort('name-asc')">
              А–Я
            </button>
            <input type="text" id="treePerkSearch" class="filter-input" placeholder="Поиск в этой ветке..." style="min-width: 180px;">
          </div>
        </div>
        <div class="perks-node-grid" id="currentTreeGrid">
          ${sortedPerks.map(p => `
            <div class="perk-card">
              <div class="perk-top">
                <span class="perk-name">${p.name}</span>
                <span class="perk-level-badge" style="${getLevelBadgeStyle(p.level)}">Ур. ${p.level}</span>
              </div>
              <div class="perk-desc">${p.description}</div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('treePerkSearch')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#currentTreeGrid .perk-card').forEach(card => {
          const text = card.innerText.toLowerCase();
          card.style.display = text.includes(q) ? 'block' : 'none';
        });
      });
    };

    this.changePerkSort = (newMode) => {
      sortMode = newMode;
      renderTree(selectedTreeIndex);
    };

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>⭐ Древо способностей (18 веток навыков)</h2>
          <p>Выберите ветку способностей для детального изучения всех перков и требований</p>
        </div>
      </div>

      <div class="tree-selector-bar">
        ${data.map((t, idx) => `
          <button class="tree-pill ${idx === 0 ? 'active' : ''}" onclick="App.selectPerkTree(${idx})">
            ${t.name}
          </button>
        `).join('')}
      </div>

      <div id="selectedTreeContent"></div>
    `;

    this.selectPerkTree = renderTree;
    renderTree(0);
  },

  // -------------------------------------------------------------
  // 8. CONSUMABLES
  // -------------------------------------------------------------
  async renderConsumables(container) {
    const data = await this.fetchData('consumables.json');
    if (!data) return;

    let curTab = 'potions';

    const renderTab = (tab) => {
      curTab = tab;
      const tabContent = document.getElementById('consumableTabContent');
      if (!tabContent) return;

      document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      if (tab === 'potions') {
        tabContent.innerHTML = `
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Зелье</th>
                  <th>Тир</th>
                  <th>Эффект</th>
                  <th>Длительность</th>
                  <th>Интоксикация</th>
                  <th>Цена</th>
                </tr>
              </thead>
              <tbody>
                ${data.potions.map(p => `
                  <tr>
                    <td><strong>${p.name}</strong></td>
                    <td><span class="info-card-badge gold">${p.tier}</span></td>
                    <td>${p.effect}</td>
                    <td>${p.duration}</td>
                    <td><span style="color: var(--accent-red);">${p.toxicity}</span></td>
                    <td>${p.cost} з.</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (tab === 'poisons') {
        tabContent.innerHTML = `
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Яд</th>
                  <th>Тир</th>
                  <th>Эффект</th>
                  <th>Длительность</th>
                  <th>Цена</th>
                </tr>
              </thead>
              <tbody>
                ${data.poisons.map(poi => `
                  <tr>
                    <td><strong>${poi.name}</strong></td>
                    <td><span class="info-card-badge">${poi.tier}</span></td>
                    <td>${poi.effect}</td>
                    <td>${poi.duration}</td>
                    <td>${poi.cost} з.</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (tab === 'food') {
        tabContent.innerHTML = `
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Блюдо</th>
                  <th>Тир</th>
                  <th>Эффект</th>
                  <th>Ингредиенты</th>
                  <th>Длительность</th>
                </tr>
              </thead>
              <tbody>
                ${data.food.map(f => `
                  <tr>
                    <td><strong>${f.name}</strong></td>
                    <td><span class="info-card-badge gold">${f.tier}</span></td>
                    <td style="color: var(--accent-green); font-weight: 600;">${f.effect}</td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">${f.recipe}</td>
                    <td>${f.duration}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (tab === 'alcohol') {
        tabContent.innerHTML = `
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Напиток</th>
                  <th>Эффект</th>
                  <th>Длительность</th>
                  <th>Цена</th>
                </tr>
              </thead>
              <tbody>
                ${data.alcohol.map(a => `
                  <tr>
                    <td><strong>${a.name}</strong></td>
                    <td style="white-space: pre-line;">${a.effect}</td>
                    <td>${a.duration}</td>
                    <td>${a.cost} з.</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (tab === 'scrolls') {
        tabContent.innerHTML = `
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Свиток</th>
                  <th>Эффект</th>
                  <th>Длительность</th>
                  <th>Цена камней</th>
                </tr>
              </thead>
              <tbody>
                ${data.scrolls.map(s => `
                  <tr>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.effect}</td>
                    <td>${s.duration}</td>
                    <td>${s.gem_req}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else if (tab === 'staves') {
        tabContent.innerHTML = `
          <div class="table-responsive">
            <table class="wiki-table">
              <thead>
                <tr>
                  <th>Посох</th>
                  <th>Материал</th>
                  <th>Эффект</th>
                  <th>Цена</th>
                </tr>
              </thead>
              <tbody>
                ${data.staves.map(st => `
                  <tr>
                    <td><strong>${st.name}</strong></td>
                    <td>${st.material}</td>
                    <td>${st.effect}</td>
                    <td>${st.cost} з.</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    };

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🧪 Расходные материалы и Алхимия</h2>
          <p>Зелья, яды, стакающаяся еда (первое + второе блюдо), алкоголь, свитки и посохи</p>
        </div>
      </div>

      <div class="tree-selector-bar">
        <button class="tree-pill tab-btn active" data-tab="potions" onclick="App.selectConsumableTab('potions')">🧪 Зелья</button>
        <button class="tree-pill tab-btn" data-tab="poisons" onclick="App.selectConsumableTab('poisons')">☠️ Яды</button>
        <button class="tree-pill tab-btn" data-tab="food" onclick="App.selectConsumableTab('food')">🍲 Еда</button>
        <button class="tree-pill tab-btn" data-tab="alcohol" onclick="App.selectConsumableTab('alcohol')">🍺 Алкоголь</button>
        <button class="tree-pill tab-btn" data-tab="scrolls" onclick="App.selectConsumableTab('scrolls')">📜 Свитки</button>
        <button class="tree-pill tab-btn" data-tab="staves" onclick="App.selectConsumableTab('staves')">🪄 Посохи</button>
      </div>

      <div id="consumableTabContent"></div>
    `;

    this.selectConsumableTab = renderTab;
    renderTab('potions');
  },

  // -------------------------------------------------------------
  // 9. ENCHANTMENTS
  // -------------------------------------------------------------
  async renderEnchantments(container) {
    const data = await this.fetchData('enchantments.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>✨ Таблица Зачарований</h2>
          <p>Сила эффектов по тирам камней душ (I–V) и совместимость со снаряжением</p>
        </div>
        <div class="section-controls">
          <input type="text" id="enchFilterInput" class="filter-input" placeholder="Поиск зачарования...">
        </div>
      </div>

      <div class="table-responsive">
        <table class="wiki-table" id="enchTable">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Название эффекта</th>
              <th>Тир I</th>
              <th>Тир II</th>
              <th>Тир III</th>
              <th>Тир IV</th>
              <th>Тир V</th>
              <th>Описание</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td><span class="info-card-badge ${item.type === 'Оружие' ? '' : 'gold'}">${item.type}</span></td>
                <td><strong>${item.name}</strong></td>
                <td>${item.tiers[0] || '-'}</td>
                <td>${item.tiers[1] || '-'}</td>
                <td>${item.tiers[2] || '-'}</td>
                <td>${item.tiers[3] || '-'}</td>
                <td style="color: var(--accent-gold-bright); font-weight: 700;">${item.tiers[4] || '-'}</td>
                <td>${item.description || item.name}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('enchFilterInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#enchTable tbody tr').forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  },

  // -------------------------------------------------------------
  // 10. SPELLS & THU'UMS
  // -------------------------------------------------------------
  async renderSpellsShouts(container) {
    const data = await this.fetchData('spells_shouts.json');
    if (!data) return;

    let curSchool = 'Разрушение';

    const renderSchool = (school) => {
      curSchool = school;
      const list = data[school] || [];
      const spellsContent = document.getElementById('spellsContent');
      if (!spellsContent) return;

      document.querySelectorAll('.school-btn').forEach(btn => {
        if (btn.getAttribute('data-school') === school) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      spellsContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <h3 style="font-family: var(--font-title); color: var(--accent-gold);">
            Школа: ${school} (${list.length})
          </h3>
          <input type="text" id="spellFilterInput" class="filter-input" placeholder="Поиск заклинания...">
        </div>
        <div class="table-responsive">
          <table class="wiki-table" id="spellsTable">
            <thead>
              <tr>
                <th>Название</th>
                <th>Ранг</th>
                <th>Стоимость</th>
                <th>Урон / Сила</th>
                <th>Дуалкаст</th>
                <th>Эффект</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(sp => `
                <tr>
                  <td><strong>${sp.name}</strong></td>
                  <td><span class="info-card-badge">${sp.tier}</span></td>
                  <td>${sp.cost}</td>
                  <td style="color: var(--accent-gold); font-weight: 600;">${sp.power}</td>
                  <td>${sp.dual_cast}</td>
                  <td>${sp.effect}</td>
                  <td>${sp.form_id ? `<span class="copy-badge" onclick="App.copyToClipboard('player.addspell ${sp.form_id}', 'Команда скопирована!')">${sp.form_id}</span>` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('spellFilterInput')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#spellsTable tbody tr').forEach(tr => {
          tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    };

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🌈 Заклинания и Ту'умы</h2>
          <p>Каталог магии по школам и рангам, дуалкаст бонусы, затраты магии и слова Криков</p>
        </div>
      </div>

      <div class="tree-selector-bar">
        ${Object.keys(data).map((sch, i) => `
          <button class="tree-pill school-btn ${i === 0 ? 'active' : ''}" data-school="${sch}" onclick="App.selectSchool('${sch}')">
            ${sch} (${data[sch].length})
          </button>
        `).join('')}
      </div>

      <div id="spellsContent"></div>
    `;

    this.selectSchool = renderSchool;
    renderSchool('Разрушение');
  },

  // -------------------------------------------------------------
  // 11. SUMMONS
  // -------------------------------------------------------------
  async renderSummons(container) {
    const data = await this.fetchData('summons.json');
    if (!data) return;

    const tiers = ['Все', 'Новичок', 'Ученик', 'Адепт', 'Эксперт', 'Мастер'];

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>👻 Призываемые существа (Саммоны)</h2>
          <p>Характеристики духов, големов и даэдра, урон, ауры и сопротивления</p>
        </div>
        <div class="section-controls">
          <select id="summonTierSelect" class="filter-select">
            ${tiers.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <input type="text" id="summonFilterInput" class="filter-input" placeholder="Поиск саммона...">
        </div>
      </div>

      <div class="cards-grid" id="summonsGrid">
        ${data.map(s => {
          const stats = [];
          if (s.level) stats.push(`<span>Ур: <strong>${s.level}</strong></span>`);
          if (s.health) stats.push(`<span>HP: <strong>${s.health}</strong></span>`);
          if (s.damage) stats.push(`<span>Урон: <strong>${s.damage}</strong></span>`);
          if (s.armor && s.armor !== '0') stats.push(`<span>Броня: <strong>${s.armor}</strong></span>`);
          if (s.stamina && s.stamina !== '0') stats.push(`<span>Стамина: <strong>${s.stamina}</strong></span>`);
          if (s.magicka && s.magicka !== '0') stats.push(`<span>Магия: <strong>${s.magicka}</strong></span>`);
          if (s.speed) stats.push(`<span>Скорость: <strong>${s.speed}</strong></span>`);
          if (s.cost) stats.push(`<span>Мана: <strong>${s.cost}</strong></span>`);

          const resList = [];
          if (s.resistances) {
            if (s.resistances.fire && s.resistances.fire !== '0') resList.push(`🔥 Огонь: ${s.resistances.fire}%`);
            if (s.resistances.frost && s.resistances.frost !== '0') resList.push(`❄️ Мороз: ${s.resistances.frost}%`);
            if (s.resistances.shock && s.resistances.shock !== '0') resList.push(`⚡ Молния: ${s.resistances.shock}%`);
            if (s.resistances.chaos && s.resistances.chaos !== '0') resList.push(`✨ Хаос: ${s.resistances.chaos}%`);
          }

          const cleanAbilities = (s.abilities && s.abilities.trim() !== '-' && !s.abilities.startsWith('#')) ? s.abilities.trim() : '';

          return `
            <div class="info-card summon-card" data-tier="${s.tier}">
              <div class="info-card-header">
                <h3 class="info-card-title">${s.name}</h3>
                <span class="info-card-badge gold">${s.tier}</span>
              </div>
              <div class="info-card-body">
                <div class="summon-stats-chips">
                  ${stats.join('')}
                </div>
                ${resList.length > 0 ? `
                  <div class="summon-res-chips">
                    ${resList.map(r => `<span class="res-chip">${r}</span>`).join('')}
                  </div>
                ` : ''}
                ${cleanAbilities ? `
                  <div class="summon-abilities">${cleanAbilities}</div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const filterSummons = () => {
      const tier = document.getElementById('summonTierSelect')?.value || 'Все';
      const q = (document.getElementById('summonFilterInput')?.value || '').toLowerCase();
      document.querySelectorAll('#summonsGrid .summon-card').forEach(card => {
        const cardTier = card.getAttribute('data-tier');
        const text = card.innerText.toLowerCase();
        const tierMatch = (tier === 'Все' || cardTier === tier);
        const textMatch = text.includes(q);
        card.style.display = (tierMatch && textMatch) ? 'flex' : 'none';
      });
    };

    document.getElementById('summonTierSelect')?.addEventListener('change', filterSummons);
    document.getElementById('summonFilterInput')?.addEventListener('input', filterSummons);
  },

  // -------------------------------------------------------------
  // 12. EQUIPMENT
  // -------------------------------------------------------------
  async renderEquipment(container) {
    const data = await this.fetchData('equipment.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>⚔️ База оружия и брони</h2>
          <p>Сравнительные характеристики типов оружия, ДПС, дальность удара и вес</p>
        </div>
        <div class="section-controls">
          <input type="text" id="eqFilterInput" class="filter-input" placeholder="Поиск оружия...">
        </div>
      </div>

      <div class="table-responsive">
        <table class="wiki-table" id="eqTable">
          <thead>
            <tr>
              <th>Материал</th>
              <th>Тип оружия</th>
              <th>Базовый урон</th>
              <th>Скорость атаки</th>
              <th>ДПС</th>
              <th>Дальность</th>
              <th>Вес</th>
              <th>Цена</th>
            </tr>
          </thead>
          <tbody>
            ${data.weapons.map(w => `
              <tr>
                <td><span class="info-card-badge gold">${w.material}</span></td>
                <td><strong>${w.type}</strong></td>
                <td>${w.damage}</td>
                <td>${w.speed}</td>
                <td style="color: var(--accent-gold-bright); font-weight:700;">${w.dps}</td>
                <td>${w.reach}</td>
                <td>${w.weight}</td>
                <td>${w.cost} з.</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('eqFilterInput')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#eqTable tbody tr').forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  },

  // -------------------------------------------------------------
  // 13. UNIQUES (680 items)
  // -------------------------------------------------------------
  async renderUniques(container) {
    const data = await this.fetchData('uniques.json');
    if (!data) return;

    const categories = ['Все', ...new Set(data.map(u => u.category).filter(Boolean))];

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>💎 Уникальные предметы и артефакты</h2>
          <p>Маски жрецов, сеты доспехов, артефакты, оружие, реликвии и FormID</p>
        </div>
        <div class="section-controls">
          <div class="view-switcher" id="uniqueViewSwitcher">
            <button class="view-btn active" id="btnViewTable">▦ Таблица</button>
            <button class="view-btn" id="btnViewCards">🗂️ Карточки</button>
          </div>
          <select id="uniqueCatSelect" class="filter-select">
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <input type="text" id="uniqueSearchInput" class="filter-input" placeholder="Поиск по названию или ID...">
        </div>
      </div>

      <div style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span>Нажмите на <span class="copy-badge">FormID</span>, чтобы скопировать команду <code>player.additem ID 1</code></span>
        <span id="uniquesCountBadge" style="color: var(--accent-gold); font-weight: 500;">Показано: ${data.length} из ${data.length}</span>
      </div>

      <!-- TABLE VIEW -->
      <div class="table-responsive" id="uniquesTableWrap">
        <table class="wiki-table" id="uniquesTable">
          <thead>
            <tr>
              <th class="col-uniq-name">Название</th>
              <th class="col-uniq-cat">Категория</th>
              <th class="col-uniq-effect">Уникальный эффект / Описание</th>
              <th class="col-uniq-stats">Броня / Урон</th>
              <th class="col-uniq-weight">Вес</th>
              <th class="col-uniq-loc">Локация / Квест</th>
              <th class="col-uniq-id">FormID</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(u => {
              const safeName = (u.name || '').replace(/'/g, "\\'");
              return `
                <tr data-cat="${u.category}">
                  <td><strong>${u.name}</strong></td>
                  <td><span class="info-card-badge">${u.category}</span></td>
                  <td class="col-uniq-effect-cell" style="white-space: pre-line;">${u.effect || '-'}</td>
                  <td class="col-center">${u.stats || '-'}</td>
                  <td class="col-center">${u.weight || '-'}</td>
                  <td style="color: var(--accent-cyan); font-size: 0.85rem; white-space: pre-line;">${u.location || '-'}</td>
                  <td>
                    ${u.form_id ? `
                      <span class="copy-badge" onclick="App.copyToClipboard('player.additem ${u.form_id} 1', 'Команда получения ${safeName} скопирована!')" title="Скопировать команду">
                        ${u.form_id}
                      </span>
                    ` : '-'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- CARDS VIEW -->
      <div class="cards-grid" id="uniquesCardsWrap" style="display: none;">
        ${data.map(u => {
          const safeName = (u.name || '').replace(/'/g, "\\'");
          return `
            <div class="info-card unique-card-item" data-cat="${u.category}">
              <div class="info-card-header">
                <h3 class="info-card-title">${u.name}</h3>
                <span class="info-card-badge gold">${u.category}</span>
              </div>
              <div class="info-card-body">
                ${u.effect ? `<div style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 10px; line-height: 1.4; white-space: pre-line;">${u.effect}</div>` : ''}
                <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.84rem; color: var(--text-muted); margin-bottom: 8px;">
                  ${u.stats ? `<span>Броня/Урон: <strong style="color: var(--accent-gold);">${u.stats}</strong></span>` : ''}
                  ${u.weight ? `<span>Вес: <strong>${u.weight}</strong></span>` : ''}
                  ${u.price ? `<span>Цена: <strong>${u.price} з.</strong></span>` : ''}
                </div>
                ${u.location ? `<div style="font-size: 0.83rem; color: var(--accent-cyan); margin-bottom: 8px; white-space: pre-line;">📍 ${u.location}</div>` : ''}
                ${u.form_id ? `
                  <div style="margin-top: auto; padding-top: 8px;">
                    <span class="copy-badge" onclick="App.copyToClipboard('player.additem ${u.form_id} 1', 'Команда получения ${safeName} скопирована!')" title="Скопировать команду">
                      ${u.form_id}
                    </span>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // View switcher logic
    const btnTable = document.getElementById('btnViewTable');
    const btnCards = document.getElementById('btnViewCards');
    const tableWrap = document.getElementById('uniquesTableWrap');
    const cardsWrap = document.getElementById('uniquesCardsWrap');

    btnTable?.addEventListener('click', () => {
      btnTable.classList.add('active');
      btnCards.classList.remove('active');
      tableWrap.style.display = 'block';
      cardsWrap.style.display = 'none';
    });

    btnCards?.addEventListener('click', () => {
      btnCards.classList.add('active');
      btnTable.classList.remove('active');
      tableWrap.style.display = 'none';
      cardsWrap.style.display = 'grid';
    });

    const filterFn = () => {
      const cat = document.getElementById('uniqueCatSelect').value;
      const q = (document.getElementById('uniqueSearchInput').value || '').toLowerCase();
      let shownCount = 0;

      // Filter table rows
      document.querySelectorAll('#uniquesTable tbody tr').forEach(tr => {
        const itemCat = tr.getAttribute('data-cat');
        const text = tr.innerText.toLowerCase();
        const catMatch = (cat === 'Все' || itemCat === cat);
        const textMatch = text.includes(q);
        const isVisible = catMatch && textMatch;
        tr.style.display = isVisible ? '' : 'none';
        if (isVisible) shownCount++;
      });

      // Filter cards
      document.querySelectorAll('#uniquesCardsWrap .unique-card-item').forEach(card => {
        const itemCat = card.getAttribute('data-cat');
        const text = card.innerText.toLowerCase();
        const catMatch = (cat === 'Все' || itemCat === cat);
        const textMatch = text.includes(q);
        card.style.display = (catMatch && textMatch) ? 'flex' : 'none';
      });

      const countBadge = document.getElementById('uniquesCountBadge');
      if (countBadge) {
        countBadge.innerText = `Показано: ${shownCount} из ${data.length}`;
      }
    };

    document.getElementById('uniqueCatSelect')?.addEventListener('change', filterFn);
    document.getElementById('uniqueSearchInput')?.addEventListener('input', filterFn);
  },

  // -------------------------------------------------------------
  // 14. DIFFICULTY
  // -------------------------------------------------------------
  async renderDifficulty(container) {
    const data = await this.fetchData('difficulty.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🥇 Уровни сложности сборки STB</h2>
          <p>Точные множители входящего и исходящего урона, скорости врагов и хардкорные правила</p>
        </div>
      </div>

      <!-- Banner Cards -->
      <div class="difficulty-banner-grid">
        ${data.modes.map(m => `
          <div class="diff-card">
            <img src="${m.badge}" alt="${m.name}" onerror="this.style.display='none'">
            <h3>${m.name}</h3>
            <p>${m.description}</p>
          </div>
        `).join('')}
      </div>

      <!-- Multipliers Table -->
      <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin: 25px 0 15px;">
        ⚖️ Таблица коэффициентов сложности
      </h3>
      <div class="table-responsive" style="margin-bottom: 30px;">
        <table class="wiki-table">
          <thead>
            <tr>
              <th>Параметр</th>
              <th style="color: #98c379;">Приключение</th>
              <th style="color: #61afef;">Тактика</th>
              <th style="color: #e5c07b;">Героический</th>
              <th style="color: #e06c75;">Испытание богов</th>
            </tr>
          </thead>
          <tbody>
            ${data.multipliers.map(row => `
              <tr>
                <td><strong>${row.param}</strong></td>
                <td>${row.adventure}</td>
                <td>${row.tactics}</td>
                <td>${row.heroic}</td>
                <td style="font-weight: 700;">${row.gods}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Restrictions Table -->
      <h3 style="font-family: var(--font-title); color: var(--accent-gold); margin: 25px 0 15px;">
        🛡️ Особые хардкорные правила и ограничения
      </h3>
      <div class="table-responsive">
        <table class="wiki-table">
          <thead>
            <tr>
              <th>Ограничение</th>
              <th>Приключение</th>
              <th>Тактика</th>
              <th>Героический</th>
              <th>Испытание богов</th>
            </tr>
          </thead>
          <tbody>
            ${data.rules.map(r => `
              <tr>
                <td><strong>${r.rule}</strong></td>
                <td>${r.adventure ? '✔' : '✕'}</td>
                <td>${r.tactics ? '✔' : '✕'}</td>
                <td>${r.heroic ? '✔' : '✕'}</td>
                <td style="color: var(--accent-gold-bright); font-weight: bold;">${r.gods ? '✔' : '✕'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // 15. BLACK BOOKS
  // -------------------------------------------------------------
  async renderBlackBooks(container) {
    const data = await this.fetchData('black_books.json');
    if (!data) return;

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>🏆 Семь Черных Книг Апокрифа</h2>
          <p>Все дары Хермеуса Моры, эффекты на выбор и точные места нахождения на Солстхейме</p>
        </div>
      </div>

      <div class="cards-grid">
        ${data.map(book => `
          <div class="info-card">
            <div class="info-card-header">
              <h3 class="info-card-title">${book.name}</h3>
              <span class="info-card-badge gold">Апокриф</span>
            </div>
            <div class="info-card-body">
              <div style="margin-bottom: 15px;">
                ${book.powers.map(p => `
                  <div style="background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
                    <strong style="color: var(--accent-gold);">${p.title}</strong> — ${p.effect}
                  </div>
                `).join('')}
              </div>
              <div style="border-top: 1px dashed var(--border-card); padding-top: 8px; font-size: 0.85rem; color: var(--accent-cyan);">
                📍 <strong>Локация:</strong> ${book.location}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // -------------------------------------------------------------
  // 16. QUEST REWARDS
  // -------------------------------------------------------------
  async renderQuestRewards(container) {
    const data = await this.fetchData('quest_rewards.json');
    if (!data) return;

    const completed = new Set(this.completedQuests);

    const toggleQuest = (name) => {
      if (completed.has(name)) {
        completed.delete(name);
      } else {
        completed.add(name);
      }
      this.completedQuests = Array.from(completed);
      localStorage.setItem('stb_quests', JSON.stringify(this.completedQuests));
      updateSummary();
    };

    const updateSummary = () => {
      let earned = 0;
      data.quests.forEach(q => {
        if (completed.has(q.name)) {
          const num = parseInt(q.coins.replace(/\D/g, '')) || 0;
          earned += num;
        }
      });
      const percent = Math.round((earned / data.total_coins) * 100);
      const sumEl = document.getElementById('questSummary');
      if (sumEl) {
        sumEl.innerHTML = `
          Собрано: <strong>${earned}</strong> из <strong>${data.total_coins}</strong> древних монет (${percent}%)
        `;
      }
      const barEl = document.getElementById('questProgressBar');
      if (barEl) {
        barEl.style.width = `${percent}%`;
      }
    };

    container.innerHTML = `
      <div class="section-header-box">
        <div class="section-header-left">
          <h2>💰 Система наград за заслуги</h2>
          <p>Выполняйте задания, собирайте древние нордские монеты и обменивайте их на очки перков</p>
        </div>
      </div>

      <!-- Tracker Progress Box -->
      <div class="hero-card" style="padding: 20px; margin-bottom: 25px;">
        <div style="width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
            <span id="questSummary" style="font-size: 1.05rem; color: var(--accent-gold);">
              Собрано: <strong>0</strong> из <strong>${data.total_coins}</strong> древних монет
            </span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Отмечайте пройденные квесты галочками</span>
          </div>
          <div style="background: rgba(255,255,255,0.08); height: 10px; border-radius: 5px; overflow: hidden;">
            <div id="questProgressBar" style="background: linear-gradient(90deg, var(--accent-gold-dark), var(--accent-gold-bright)); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="wiki-table" id="questsTable">
          <thead>
            <tr>
              <th style="width: 40px;">Готово</th>
              <th>Задание</th>
              <th>Сюжетная линия</th>
              <th>Награда (монеты)</th>
            </tr>
          </thead>
          <tbody>
            ${data.quests.map(q => `
              <tr>
                <td>
                  <input type="checkbox" ${completed.has(q.name) ? 'checked' : ''} onchange="App.handleQuestCheck('${q.name}')">
                </td>
                <td><strong>${q.name}</strong></td>
                <td><span class="info-card-badge">${q.chain}</span></td>
                <td style="color: var(--accent-gold); font-weight: 700;">${q.coins}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.handleQuestCheck = toggleQuest;
    updateSummary();
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
