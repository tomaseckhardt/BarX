(function () {
  'use strict';

  // ===== Admin dashboard BarX =====
  // Spravuje seznam rezervací: načítání, vyhledávání, filtrování, akce (volat, potvrdit, smazat).
  // Všechen kód je zahalen do IIFE, aby neprolezl do globálního scope.

  const API_BASE = '/api/reservations';
  const TABLE_LABELS = {
    'bar-2': 'Bar 02 · Barový pult',
    'window-4': 'Window 04 · U okna',
    'lounge-4': 'Lounge 04 · Lounge zóna',
    'booth-6': 'Booth 06 · Polouzavřený box',
    'vip-8': 'VIP 08 · Zadní salonek'
  };
  const ALLOWED_STATUSES = ['new', 'called', 'confirmed', 'done', 'completed'];
  const DATE_SORT_UI = {
    none: { indicator: '•', label: 'Řazení podle data a času: bez řazení' },
    asc: { indicator: '↑', label: 'Řazení podle data a času: vzestupně' },
    desc: { indicator: '↓', label: 'Řazení podle data a času: sestupně' }
  };

  const elements = {
    rows: document.getElementById('reservationRows'),
    emptyState: document.getElementById('emptyState'),
    cardsWrap: document.getElementById('reservationCards'),
    emptyCards: document.getElementById('emptyCards'),
    tableView: document.getElementById('tableView'),
    cardsView: document.getElementById('cardsView'),
    autoRefreshInfo: document.getElementById('autoRefreshInfo'),
    tabButtons: document.querySelectorAll('.view-tab'),
    refreshBtn: document.getElementById('refreshBtn'),
    searchInput: document.getElementById('searchInput'),
    statusFilter: document.getElementById('statusFilter'),
    sortBy: document.getElementById('sortBy'),
    dateSortToggle: document.getElementById('dateSortToggle'),
    dateSortIndicator: document.getElementById('dateSortIndicator'),
    dateSortToggleCards: document.getElementById('dateSortToggleCards'),
    dateSortIndicatorCards: document.getElementById('dateSortIndicatorCards'),
    statusEl: document.getElementById('status'),
    statTotal: document.getElementById('statTotal'),
    statToday: document.getElementById('statToday'),
    statDrink: document.getElementById('statDrink'),
    statGuests: document.getElementById('statGuests')
  };

  // Stav aplikace — rezervace, aktivní view a režim řazení podle data
  const state = {
    reservations: [],
    currentView: 'cards',
    dateSortMode: 'none'
  };

  function normalizeStatus(status) {
    const value = String(status || 'new').trim();
    return ALLOWED_STATUSES.includes(value) ? value : 'new';
  }

  function statusLabel(status) {
    const labels = {
      new: 'nova',
      called: 'volano',
      confirmed: 'potvrzena',
      done: 'v poradku',
      completed: 'dokonceno'
    };
    return labels[normalizeStatus(status)] || 'nova';
  }

  function setStatus(message, type) {
    elements.statusEl.textContent = message;
    elements.statusEl.className = type ? 'status ' + type : 'status';
  }

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  function getDateState(dateValue) {
    const today = getTodayDate();
    if (dateValue === today) return 'today';
    if (dateValue < today) return 'past';
    return 'future';
  }

  function formatRelativeState(stateValue) {
    if (stateValue === 'today') return 'dnes';
    if (stateValue === 'past') return 'minulé';
    return 'budoucí';
  }

  function switchView(view) {
    state.currentView = view;
    elements.tableView.classList.toggle('is-active', view === 'table');
    elements.cardsView.classList.toggle('is-active', view === 'cards');
    elements.tabButtons.forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.view === view);
    });
  }

  // API volání proxujeme přes BARX_DATA_API (definován v supabase-config.js),
  // který na lokálním prostředí volá přímo REST API, v produkci Supabase.
  async function apiRequest(url, options) {
    if (!window.BARX_DATA_API || typeof window.BARX_DATA_API.request !== 'function') {
      throw new Error('Supabase klient neni dostupny. Zkontroluj soubor supabase-config.js.');
    }
    return window.BARX_DATA_API.request(url, options || {});
  }

  function formatDate(dateValue, slotValue) {
    return new Intl.DateTimeFormat('cs-CZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).format(new Date(dateValue + 'T12:00:00')) + ' · ' + slotValue;
  }

  function updateStats(items) {
    elements.statTotal.textContent = String(items.length);
    const today = getTodayDate();
    elements.statToday.textContent = String(items.filter(function (item) {
      return item.date === today;
    }).length);
    elements.statGuests.textContent = String(items.reduce(function (sum, item) {
      return sum + Number(item.guests || 0);
    }, 0));

    const drinkCounts = items.reduce(function (accumulator, item) {
      const key = item.drink || 'Bez drinku';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
    const topDrink = Object.entries(drinkCounts).sort(function (left, right) {
      return right[1] - left[1];
    })[0];
    elements.statDrink.textContent = topDrink ? topDrink[0] : '-';
  }

  // Escapeuje HTML entity — ochrana před XSS při vkládání uživatelských dat do DOM.
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function parseSlotMinutes(slotValue) {
    const parts = String(slotValue || '').split(':');
    const hours = Number(parts[0] || 0);
    const minutes = Number(parts[1] || 0);
    return (hours * 60) + minutes;
  }

  function reservationDateTime(item) {
    const dateBase = new Date(item.date + 'T00:00:00').getTime();
    return dateBase + (parseSlotMinutes(item.slot) * 60000);
  }

  function compareReservations(sortMode, left, right) {
    if (sortMode === 'today-first') return reservationDateTime(right) - reservationDateTime(left);
    if (sortMode === 'date-asc') return reservationDateTime(left) - reservationDateTime(right);
    if (sortMode === 'date-desc') return reservationDateTime(right) - reservationDateTime(left);
    if (sortMode === 'created-asc') return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    if (sortMode === 'created-desc') return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (sortMode === 'name-asc') return String(left.name || '').localeCompare(String(right.name || ''), 'cs');
    if (sortMode === 'guests-asc') return Number(left.guests || 0) - Number(right.guests || 0);
    if (sortMode === 'guests-desc') return Number(right.guests || 0) - Number(left.guests || 0);
    return 0;
  }

  // Řazení: dateSortMode má přednost před sortBy dropdownem.
  // Pokud není aktivní řazení podle data, používá se dnes-first logika + vybraný kritérium.
  function getFilteredReservations() {
    const term = elements.searchInput.value.trim().toLowerCase();
    const filtered = state.reservations.filter(function (item) {
      const normalizedStatus = normalizeStatus(item.status);
      if (elements.statusFilter.value !== 'all' && normalizedStatus !== elements.statusFilter.value) {
        return false;
      }
      if (!term) return true;

      return [
        item.name,
        item.phone,
        item.email,
        item.drink,
        statusLabel(item.status),
        item.tableId,
        TABLE_LABELS[item.tableId] || ''
      ].join(' ').toLowerCase().includes(term);
    });

    if (state.dateSortMode === 'asc') {
      filtered.sort(function (left, right) {
        return reservationDateTime(left) - reservationDateTime(right);
      });
      return filtered;
    }
    if (state.dateSortMode === 'desc') {
      filtered.sort(function (left, right) {
        return reservationDateTime(right) - reservationDateTime(left);
      });
      return filtered;
    }

    const today = getTodayDate();
    const sortMode = elements.sortBy.value;
    filtered.sort(function (left, right) {
      const todayRankLeft = left.date === today ? 0 : 1;
      const todayRankRight = right.date === today ? 0 : 1;
      if (todayRankLeft !== todayRankRight) {
        return todayRankLeft - todayRankRight;
      }
      return compareReservations(sortMode, left, right);
    });
    return filtered;
  }

  async function updateReservation(id, patch, successMessage) {
    await apiRequest(API_BASE + '/' + id, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
    await loadReservations();
    setStatus(successMessage, 'success');
  }

  async function handleReservationAction(action, item) {
    if (action === 'delete') {
      await apiRequest(API_BASE + '/' + item.id, { method: 'DELETE' });
      await loadReservations();
      setStatus('Rezervace byla smazána.', 'success');
      return;
    }
    if (action === 'call') {
      await updateReservation(item.id, { status: 'called' }, 'Rezervace označena jako volano.');
      window.location.href = 'tel:' + String(item.phone || '').replace(/\s+/g, '');
      return;
    }
    if (action === 'confirm') {
      await updateReservation(item.id, { status: 'confirmed' }, 'Rezervace byla potvrzena.');
      return;
    }
    if (action === 'done') {
      await updateReservation(item.id, { status: 'done' }, 'Rezervace označena jako v pořádku.');
    }
  }

  function attachActionHandlers(container, item) {
    container.querySelectorAll('[data-action]').forEach(function (button) {
      button.addEventListener('click', async function () {
        const action = button.getAttribute('data-action');
        try {
          await handleReservationAction(action, item);
        } catch (error) {
          setStatus(error.message, 'error');
        }
      });
    });
  }

  function buildRowHtml(item, status) {
    const tableLabel = escapeHtml(TABLE_LABELS[item.tableId] || item.tableId);
    const noteHtml = item.note ? escapeHtml(item.note) : '<span class="muted">bez poznámky</span>';
    return '<td><strong>' + escapeHtml(item.name) + '</strong><br><span class="badge status-' + status + '">' + statusLabel(status) + '</span></td>' +
      '<td>' + escapeHtml(item.phone) + '<br><span class="muted">' + escapeHtml(item.email) + '</span></td>' +
      '<td>' + formatDate(item.date, item.slot) + '<br><span class="muted">vytvořeno ' + new Date(item.createdAt).toLocaleString('cs-CZ') + '</span></td>' +
      '<td><span class="table-highlight" title="' + tableLabel + '">' + tableLabel + '</span></td>' +
      '<td>' + escapeHtml(item.drink || '-') + '</td>' +
      '<td>' + item.guests + '</td>' +
      '<td title="' + escapeHtml(item.note || '') + '">' + noteHtml + '</td>' +
      '<td><div class="row-actions">' +
        '<button class="mini-btn is-muted" type="button" data-action="call" aria-label="Zavolat" data-tip="Zavolat hostu">☎</button>' +
        '<button class="mini-btn is-success" type="button" data-action="confirm" aria-label="Potvrdit" data-tip="Potvrdit rezervaci">✓</button>' +
        '<button class="mini-btn is-gold" type="button" data-action="done" aria-label="V pořádku" data-tip="Označit jako v pořádku">★</button>' +
        '<button class="mini-btn is-danger" type="button" data-action="delete" aria-label="Smazat" data-tip="Smazat rezervaci">🗑</button>' +
      '</div></td>';
  }

  function renderTable(filtered) {
    elements.rows.innerHTML = '';
    elements.emptyState.hidden = filtered.length > 0;

    filtered.forEach(function (item) {
      const tr = document.createElement('tr');
      const status = normalizeStatus(item.status);
      tr.innerHTML = buildRowHtml(item, status);
      attachActionHandlers(tr, item);
      elements.rows.appendChild(tr);
    });
  }

  function buildCardHtml(item, stateValue, status) {
    return '<div class="card-head">' +
      '<div class="card-name">' + escapeHtml(item.name) + '</div>' +
      '<div class="card-tags">' +
        '<span class="card-tag ' + stateValue + '">' + formatRelativeState(stateValue) + '</span>' +
        '<span class="badge status-' + status + '">' + statusLabel(status) + '</span>' +
        '<span class="card-tag">' + escapeHtml(item.drink || '-') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="card-table-highlight">Stůl: ' + escapeHtml(TABLE_LABELS[item.tableId] || item.tableId) + '</div>' +
    '<div class="card-meta">' +
      formatDate(item.date, item.slot) + '<br>' +
      item.guests + ' hostů · ' + escapeHtml(item.phone) + '<br>' +
      (item.note ? escapeHtml(item.note) : '<span class="muted">bez poznámky</span>') +
    '</div>' +
    '<div class="row-actions">' +
      '<button class="mini-btn is-muted" type="button" data-action="call" aria-label="Zavolat" data-tip="Zavolat hostu">☎</button>' +
      '<button class="mini-btn is-success" type="button" data-action="confirm" aria-label="Potvrdit" data-tip="Potvrdit rezervaci">✓</button>' +
      '<button class="mini-btn is-gold" type="button" data-action="done" aria-label="V pořádku" data-tip="Označit jako v pořádku">★</button>' +
      '<button class="mini-btn is-danger" type="button" data-action="delete" aria-label="Smazat" data-tip="Smazat rezervaci">🗑</button>' +
    '</div>';
  }

  function renderCards(filtered) {
    elements.cardsWrap.innerHTML = '';
    elements.emptyCards.hidden = filtered.length > 0;

    filtered.forEach(function (item) {
      const stateValue = getDateState(item.date);
      const status = normalizeStatus(item.status);
      const card = document.createElement('article');
      card.className = 'reservation-card ' + stateValue;
      card.innerHTML = buildCardHtml(item, stateValue, status);
      attachActionHandlers(card, item);
      elements.cardsWrap.appendChild(card);
    });
  }

  function renderViews() {
    const filtered = getFilteredReservations();
    updateStats(filtered);
    renderTable(filtered);
    renderCards(filtered);
  }

  async function loadReservations() {
    try {
      const payload = await apiRequest(API_BASE);
      state.reservations = payload.reservations || [];
      renderViews();
      setStatus('Data načtena.', '');
    } catch (error) {
      setStatus(error.message + ' · ', 'error');
      const retryButton = document.createElement('button');
      retryButton.type = 'button';
      retryButton.className = 'btn btn-secondary';
      retryButton.textContent = 'Zkusit znovu';
      retryButton.style.marginLeft = '8px';
      retryButton.addEventListener('click', loadReservations);
      elements.statusEl.appendChild(retryButton);
    }
  }

  function updateDateSortUI() {
    const ui = DATE_SORT_UI[state.dateSortMode] || DATE_SORT_UI.none;
    elements.dateSortIndicator.textContent = ui.indicator;
    elements.dateSortIndicatorCards.textContent = ui.indicator;
    elements.dateSortToggle.setAttribute('aria-label', ui.label);
    elements.dateSortToggleCards.setAttribute('aria-label', ui.label);
  }

  function cycleDateSortMode() {
    if (state.dateSortMode === 'none') {
      state.dateSortMode = 'asc';
    } else if (state.dateSortMode === 'asc') {
      state.dateSortMode = 'desc';
    } else {
      state.dateSortMode = 'none';
    }
    updateDateSortUI();
    renderViews();
  }

  function applyMobileViewDefaults() {
    if (window.matchMedia('(max-width: 760px)').matches) {
      switchView('cards');
    }
  }

  function registerEvents() {
    elements.refreshBtn.addEventListener('click', async function () {
      try {
        await loadReservations();
        setStatus('Data byla obnovena.', 'success');
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });
    elements.searchInput.addEventListener('input', renderViews);
    elements.statusFilter.addEventListener('change', renderViews);
    elements.sortBy.addEventListener('change', renderViews);
    elements.dateSortToggle.addEventListener('click', cycleDateSortMode);
    elements.dateSortToggleCards.addEventListener('click', cycleDateSortMode);
    elements.tabButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        switchView(button.dataset.view);
      });
    });
    window.addEventListener('resize', applyMobileViewDefaults);
  }

  // Auto-refresh každých 30 sekund — bez toho by admin musel obnovovat stránku ručně.
  function startAutoRefresh() {
    setInterval(async function () {
      try {
        await loadReservations();
        elements.autoRefreshInfo.textContent = 'Auto refresh: právě aktualizováno v ' + new Date().toLocaleTimeString('cs-CZ');
      } catch (error) {
        elements.autoRefreshInfo.textContent = 'Auto refresh: chyba připojení';
      }
    }, 30000);
  }

  registerEvents();
  applyMobileViewDefaults();
  updateDateSortUI();
  startAutoRefresh();

  loadReservations().catch(function (error) {
    setStatus('Nepodarilo se nacist rezervace. Zkontroluj Supabase konfiguraci.', 'error');
    console.error(error);
  });
})();