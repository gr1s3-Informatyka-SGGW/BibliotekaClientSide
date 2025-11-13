// DODAJE DO STRONY PRZYCISK DO PRZELACZANIA TRYBU BIBLIOTEKARZ / CZYTELNIK
// I USUWA ZALEZNIE OD TRYBU ELEMETNTY O CLASS 'czytelnik' / 'bibliotekarz'
(async function () {
  'use strict';

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Strict`;

  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  }

  if (getCookie('bibliotekarz') === '1') {
    document.querySelectorAll(`.${'czytelnik'}`).forEach(el => el.remove());
  } else {
    document.querySelectorAll(`.${'bibliotekarz'}`).forEach(el => el.remove());
  }

  const container = document.createElement('div');
  container.style.cssText = `
        position: fixed;
        bottom: 1em;
        right: 1em;
        z-index: 9999;
        display: flex;
        align-items: stretch;
        gap: 0.25em;
    `;

  const button = document.createElement('button');
  button.style.cssText = `
        background-color: transparent;
        color: white;
        border: none;
        padding: 1em;
        z-index: 9999;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        text-align: center;
    `;

  button.onclick = function () {
    if (getCookie('bibliotekarz') === '1') {
      deleteCookie('bibliotekarz');
      setCookie('czytelnik', '1', 1);
    } else {
      deleteCookie('czytelnik');
      setCookie('bibliotekarz', '1', 1);
    }
    window.location.reload();
  };

  const closeButton = document.createElement('button');
  closeButton.innerHTML = 'X';
  closeButton.style.cssText = button.style.cssText;

  closeButton.onclick = function () {
    container.remove();
  };

  if (getCookie('bibliotekarz') === '1') {
    closeButton.style.backgroundColor = 'firebrick';
    button.style.backgroundColor = 'firebrick';
    button.innerHTML = '<b>Tryb Bibliotekarza</b>&nbsp(naciśnij, aby przełączyć na tryb Czytelnika)';
  } else {
    closeButton.style.backgroundColor = 'teal';
    button.style.backgroundColor = 'teal';
    button.innerHTML = '<b>Tryb Czytelnika</b>&nbsp(naciśnij, aby przełączyć na tryb Bibliotekarza)';
  }

  container.appendChild(button);
  container.appendChild(closeButton);
  document.body.appendChild(container);
})();
