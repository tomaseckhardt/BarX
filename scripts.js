// Hlavní klientský skript — popupy, FAQ a animace menu

// Nastaví aria atributy a třídu body při otevírání/zavírání modalu.
function setModalState(modal, isOpen) {
  modal.hidden = !isOpen;
  modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  document.body.classList.toggle('modal-open', isOpen);
}

function setupModal(triggerId, modalId, closeButtonId) {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);
  const closeButton = document.getElementById(closeButtonId);
  const backdrop = modal ? modal.querySelector('.custom-popup-backdrop') : null;

  if (!trigger || !modal || !closeButton || !backdrop) {
    return;
  }

  const openModal = function () {
    setModalState(modal, true);
  };

  const closeModal = function () {
    setModalState(modal, false);
  };

  trigger.onclick = openModal;
  closeButton.onclick = closeModal;
  backdrop.onclick = closeModal;
}

function setupFaqToggle() {
  document.querySelectorAll('.faq-question').forEach(function (button) {
    button.onclick = function () {
      const item = button.closest('.faq-item');
      if (item) {
        item.classList.toggle('active');
      }
    };
  });
}

// Vybere náhodný směr vstupu pro animaci (ze 8 hran obrazovky)
// a spočítá mírný overshoot pro pružniný efekt.
function getRandomEdgeTransform() {
  const edges = [
    { x: '-120vw', y: '0' },
    { x: '120vw', y: '0' },
    { x: '0', y: '-80vh' },
    { x: '0', y: '80vh' },
    { x: '-100vw', y: '-60vh' },
    { x: '100vw', y: '-60vh' },
    { x: '-100vw', y: '60vh' },
    { x: '100vw', y: '60vh' }
  ];
  const pick = edges[Math.floor(Math.random() * edges.length)];
  const overshootX = (parseInt(pick.x, 10) || 0) * -0.06 + 'vw';
  const overshootY = (parseInt(pick.y, 10) || 0) * -0.06 + 'vh';

  return {
    start: `translate(${pick.x}, ${pick.y}) scale(0.92)`,
    overshootX,
    overshootY
  };
}

// Animuje kartu drinku — každá karta vstoupí s offsetem (index * 1000ms)
// aby nepřícházely všechny najednou.
function animateExtraDrink(card, index) {
  const transform = getRandomEdgeTransform();
  card.style.opacity = '0';
  card.style.transform = transform.start;
  card.style.setProperty('--overshoot-x', transform.overshootX);
  card.style.setProperty('--overshoot-y', transform.overshootY);

  setTimeout(function () {
    card.style.opacity = '';
    card.style.transform = '';
    card.classList.add('start-anim');
  }, index * 1000);
}

function createCollapseButton(extraDrinks, showMoreButton) {
  const collapseButton = document.createElement('button');
  collapseButton.textContent = 'Zabalit';
  collapseButton.className = 'btn btn-secondary';
  collapseButton.style.margin = '2.2rem auto 0 auto';
  collapseButton.style.display = 'block';
  collapseButton.style.maxWidth = '320px';
  collapseButton.onclick = function () {
    extraDrinks.forEach(function (drink) {
      drink.setAttribute('hidden', '');
    });
    collapseButton.remove();
    showMoreButton.style.display = '';
  };
  return collapseButton;
}

function setupExpandedMenu() {
  const showMoreButton = document.getElementById('showMoreDrinks');
  const menuGrid = document.getElementById('menuGrid');

  if (!showMoreButton || !menuGrid) {
    return;
  }

  showMoreButton.addEventListener('click', function () {
    const extraDrinks = Array.from(menuGrid.querySelectorAll('.extra-drink'));
    if (extraDrinks.length === 0 || showMoreButton.style.display === 'none') {
      return;
    }

    extraDrinks.forEach(function (card) {
      card.removeAttribute('hidden');
    });
    extraDrinks.forEach(animateExtraDrink);

    const collapseButton = createCollapseButton(extraDrinks, showMoreButton);
    menuGrid.parentNode.appendChild(collapseButton);
    showMoreButton.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupModal('specialEventsCard', 'eventsPopup', 'closeEventsPopup');
  setupModal('faqCard', 'faqPopup', 'closeFaqPopup');

  if (document.querySelector('.faq-question')) {
    setupFaqToggle();
  }

  setupExpandedMenu();
});
