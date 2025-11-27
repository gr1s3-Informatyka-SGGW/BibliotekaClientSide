const popoverContainer = document.createElement('div');
popoverContainer.id = 'active-popover-container';
popoverContainer.className = 'custom-popover';
document.body.appendChild(popoverContainer);

let overlay = document.createElement("div");
overlay.id = 'popover-overlay';
document.body.appendChild(overlay);

let activePopoverId = null;
const popovers = {};

const updatePopoverPosition = (targetElement) => {
  const targetRect = targetElement.getBoundingClientRect();
  popoverContainer.style.opacity = '0';
  popoverContainer.style.display = 'block';
  const popoverRect = popoverContainer.getBoundingClientRect();

  let top = targetRect.bottom + 10;
  let left = targetRect.left + (targetRect.width / 2) - (popoverRect.width / 2);

  if (top + popoverRect.height > window.innerHeight) {
    top = targetRect.top - popoverRect.height - 10;
    popoverContainer.classList.add('top');
  } else {
    popoverContainer.classList.remove('top');
  }

  if (left < 10) left = 10;
  if (left + popoverRect.width > window.innerWidth) {
    left = window.innerWidth - popoverRect.width - 10;
  }

  popoverContainer.style.top = `${top}px`;
  popoverContainer.style.left = `${left}px`;
  popoverContainer.style.opacity = '';
  popoverContainer.style.display = '';
};


async function togglePopover(id, triggerElement) {
  if (activePopoverId === id && popoverContainer.classList.contains('active')) {
    closePopover();
    return;
  }

  if (activePopoverId) {
    closePopover(false);
    await wait(50);
  }

  if (!popovers[id]) {
    console.error("Błąd: Nie zdefiniowano popovera o ID: " + id);
    return;
  }

  popoverContainer.innerHTML = popovers[id];

  overlay.style.display = 'block';

  updatePopoverPosition(triggerElement);

  void popoverContainer.offsetWidth;
  popoverContainer.classList.add('active');
  activePopoverId = id;
}


async function closePopover(animate = true) {
  if (!activePopoverId) return;

  popoverContainer.classList.remove('active');

  if (animate) {
    await wait(200);
  }

  overlay.style.display = 'none';
  activePopoverId = null;
  setTimeout(() => { if (!activePopoverId) popoverContainer.innerHTML = ''; }, animate ? 200 : 0);

}

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-popover-trigger]');
  if (trigger) {
    const popoverId = trigger.getAttribute('data-popover-trigger');
    togglePopover(popoverId, trigger);
  }
});

overlay.addEventListener('click', () => closePopover());

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activePopoverId) {
    closePopover();
  }
});

document.addEventListener('scroll', (e) => {
  if (activePopoverId && (e.target === document || e.target === document.body || e.target === window.document.scrollingElement)) {
    closePopover();
  }
}, true);

popoverContainer.addEventListener('click', (e) => {
  if (e.target.closest('.popover-close')) {
    closePopover();
  }
});

popovers['librarian_actions'] = `
<div id="popover_librarian_actions">
  <h3 class="header">Zarządzanie książką</h3>
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button class="popover-btn" onclick="showPopup('add_book_copy'); closePopover();">Dodaj egzemplarz</button>
    <button class="popover-btn" onclick="showPopup('edit_book'); closePopover();">Edytuj dane książki</button>
    <button class="popover-btn danger" onclick="showPopup('confirm_delete_book'); closePopover();">Usuń książkę z systemu</button>
  </div>
</div>
`;

popovers['filters_sort_users'] = `
<div id="popover_filters_sort_users">
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button class="popover-btn" onclick="closePopover();">Liczba wypożyczeń (rosnąco)</button>
    <button class="popover-btn" onclick="closePopover();">Liczba wypożyczeń (malejąco)</button>
    <button class="popover-btn" onclick="closePopover();">Liczba zaległości (rosnąco)</button>
    <button class="popover-btn" onclick="closePopover();">Liczba zaległości (malejąco)</button>
    <button class="popover-btn" onclick="closePopover();">Nazwisko (A-Z)</button>
    <button class="popover-btn" onclick="closePopover();">Nazwisko (Z-A)</button>
  </div>
</div>
`;

popovers['filters_sort_catalog'] = `
<div id="popover_filters_sort_catalog">
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button class="popover-btn" onclick="closePopover();">Autor (A-Z)</button>
    <button class="popover-btn" onclick="closePopover();">Autor (Z-A)</button>
    <button class="popover-btn" onclick="closePopover();">Tytuł (A-Z)</button>
    <button class="popover-btn" onclick="closePopover();">Tytuł (Z-A)</button>
    <button class="popover-btn" onclick="closePopover();">Rok wydania (rosnąco)</button>
    <button class="popover-btn" onclick="closePopover();">Rok wydania (malejąco)</button>
  </div>
</div>
`;

popovers['filters_sort_loans'] = `
<div id="popover_filters_sort_loans">
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button class="popover-btn" onclick="closePopover();">Kwota kary (rosnąco)</button>
    <button class="popover-btn" onclick="closePopover();">Kwota kary (malejąco)</button>
    <button class="popover-btn" onclick="closePopover();">Data wypożyczenia (rosnąco)</button>
    <button class="popover-btn" onclick="closePopover();">Data wypożyczenia (malejąco)</button>
  </div>
</div>
`;

popovers['filters_status'] = `
<div id="popover_filters_sort_loans">
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button class="popover-btn" onclick="closePopover();">Dowolny</button>
    <button class="popover-btn" onclick="closePopover();">Aktywny</button>
    <button class="popover-btn" onclick="closePopover();">Zwrócony</button>
  </div>
</div>
`;

popovers['filters_status_users'] = `
<div id="popover_filters_sort_loans">
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button class="popover-btn" onclick="closePopover();">Dowolny</button>
    <button class="popover-btn" onclick="closePopover();">Użytkownik</button>
    <button class="popover-btn" onclick="closePopover();">Bibliotekarz</button>
<button class="popover-btn" onclick="closePopover();">Zablokowany</button>
  </div>
</div>
`;
