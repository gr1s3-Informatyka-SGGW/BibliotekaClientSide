let bg = document.createElement("div");
bg.id = 'popup-bg'
document.body.appendChild(bg);


async function showPopup(id) {
  document.body.insertAdjacentHTML('beforeend', popups[id]);

  let popup = document.getElementById("popup_" + id);
  popup.style.opacity = "0.0";
  bg.style.display = 'block';
  bg.style.opacity = "0.0";

  await wait(50);

  bg.style.opacity = "1.0";
  popup.style.opacity = "1.0";
  popup.style.position = 'fixed';
  popup.style.display = 'flex';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.zIndex = "1001";
}

async function closePopup(id) {
  let popup = document.getElementById("popup_" + id);
  popup.style.opacity = "0";
  bg.style.opacity = "0";

  await wait(250);

  bg.style.display = 'none';
  popup.remove();
}

async function wait(ms) {
  await new Promise(r => setTimeout(r, ms));
}


document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const activeBg = document.getElementById('popup-bg');
    if (activeBg && activeBg.style.display !== 'none') {
      const activePopup = document.querySelector('[id^="popup_"]:not([style*="opacity: 0"])');
      if (activePopup) {
        // Extracts the ID part after 'popup_'
        const popupId = activePopup.id.substring(6);
        closePopup(popupId);
      }
    }
  }
});


let popups = {};


popups['change_card'] = `
<div class="panel popup" id="popup_change_card">
  <h3 class="header">Zmień dane karty</h3>
  <label>Numer karty:</label>
  <input type="text" name="cardNumber" placeholder="1234 5678 9012 3456">


  <div style="display: flex; flex-direction: row; gap: 0.25em;">
    <div style="flex: 1">
      <label>Data wygaśnięcia:</label>
      <input type="month" name="cardExp" placeholder="2027-10">
    </div>
    <div style="flex: 1">
      <label>CVV:</label>
      <input type="text" name="cardCvv" placeholder="123">
    </div>
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.25em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('change_card')">Odrzuć zmiany</button>
    <button style="flex: 1;" onclick="closePopup('change_card')">Zapisz zmiany</button>
  </div>
</div>
`

popups['change_password'] = `
<div class="panel popup" id="popup_change_password">
  <h3 class="header">Zmień hasło</h3>
  <div class="row">
    <div class="col">
      <label>Stare hasło:</label>
      <input type="password" name="old">
    </div>
    <div class="col">
      <label>Nowe hasło:</label>
      <input type="password" name="new1">
    </div>
    <div class="col">
      <label>Powtórz nowe hasło:</label>
      <input type="password" name="new2">
    </div>
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.25em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('change_password')">Odrzuć zmiany</button>
    <button style="flex: 1;" onclick="closePopup('change_password')">Zapisz zmiany</button>
  </div>
</div>
`

popups['book_copies_added'] = `
<div class="panel popup" id="popup_book_copies_added">
  <h3 class="header">Książka dodana. Kody egzemplarzy:</h3>

  <div style="display: flex;  flex-direction: column; gap: 0.5em; max-height: 20em; overflow-y: auto; padding-right: 1em;">
    
    <fieldset>
      <legend>Egzemplarz #1</legend>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1em;">
          <img src="assets/example_qr.png" alt="Kod QR Egzemplarza 1" style="width: 5em; padding: 0.5em;">
        <div style="display: flex; flex-direction: column; gap: 0.5em;">
          <button style="padding: 0.5em 1em;">Zapisz</button>
          <button style="padding: 0.5em 1em;">Drukuj</button>
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Egzemplarz #2</legend>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1em;">
          <img src="assets/example_qr.png" alt="Kod QR Egzemplarza 2" style="width: 5em; padding: 0.5em;">
        <div style="display: flex; flex-direction: column; gap: 0.5em;">
          <button style="padding: 0.5em 1em;">Zapisz</button>
          <button style="padding: 0.5em 1em;">Drukuj</button>
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Egzemplarz #3</legend>
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1em;">
          <img src="assets/example_qr.png" alt="Kod QR Egzemplarza 3" style="width: 5em; padding: 0.5em;">
        <div style="display: flex; flex-direction: column; gap: 0.5em;">
          <button style="padding: 0.5em 1em;">Zapisz</button>
          <button style="padding: 0.5em 1em;">Drukuj</button>
        </div>
      </div>
    </fieldset>

  </div>

  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('book_copies_added')">Zamknij</button>
    <button style="flex: 1;">Drukuj wszystkie</button>
    <button style="flex: 1;">Zapisz wszystkie</button>
  </div>
</div>
`

popups['confirm_cancel'] = `
<div class="panel popup" id="popup_confirm_cancel">
  <h3 class="header">Anulowanie rezerwacji</h3>
  <p>Czy na pewno chcesz anulować rezerwację tej pozycji?</p>
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_cancel')">Nie, kontynuuj rezerwację</button>
    <button style="flex: 1;" onclick="closePopup('confirm_cancel')">Tak, anuluj rezerwację</button>
  </div>
</div>
`

popups['confirm_pickup'] = `
<div class="panel popup" id="popup_confirm_pickup">
  <h3 class="header">Odbiór książki</h3>
  <p>Czy książka została pobrana z półki?</p>
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_pickup')">Jeszcze nie odbieram</button>
    <button style="flex: 1;" onclick="closePopup('confirm_pickup')">Tak, książka została odebrana</button>
  </div>
</div>
`

popups['confirm_prolong'] = `
<div class="panel popup" id="popup_confirm_prolong">
  <h3 class="header">Prolongowanie wypożyczenia</h3>
  <p>Termin wypożyczenia został pomyślnie przedłużony o 30 dni.</p>
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button style="flex: 1;" class="boring" onclick="closePopup('confirm_prolong')">OK</button>
  </div>
</div>
`

popups['confirm_return'] = `
<div class="panel popup" id="popup_confirm_return">
  <h3 class="header">Zwrot książki</h3>
  <p>Czy książka została odłożona w wyznaczonym miejscu zwrotu?</p>
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_return')">Jeszcze nie zwracam</button>
    <button style="flex: 1;" onclick="closePopup('confirm_return')">Tak, zwróć</button>
  </div>
</div>
`

popups['change_search_mode'] = `
<div class="panel popup" id="popup_change_search_mode">
  <h3 class="header">Zmień tryb wyszukiwania</h3>
  <div style="display: flex; flex-direction: column; gap: 0.5em; margin-top: 1em;">
    <button onclick="document.getElementById('search-quick').style.display='flex'; document.getElementById('search-advanced').style.display='none'; document.getElementById('search-code').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Szybkie</button>
    <button onclick="document.getElementById('search-advanced').style.display='flex'; document.getElementById('search-quick').style.display='none'; document.getElementById('search-code').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Zaawansowane</button>
    <button onclick="document.getElementById('search-code').style.display='flex'; document.getElementById('search-quick').style.display='none'; document.getElementById('search-advanced').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Szukaj po kodzie</button>
  </div>
</div>
`

popups['change_search_mode'] = `
<div class="panel popup" id="popup_change_search_mode">
  <h3 class="header">Wybierz tryb wyszukiwania</h3>
  <div style="display: flex; flex-direction: column; gap: 0.25em;">
    <button onclick="document.getElementById('search-quick').style.display='flex'; document.getElementById('search-advanced').style.display='none'; document.getElementById('search-code').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Szybkie</button>
    <button onclick="document.getElementById('search-advanced').style.display='flex'; document.getElementById('search-quick').style.display='none'; document.getElementById('search-code').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Zaawansowane</button>
    <button onclick="document.getElementById('search-code').style.display='flex'; document.getElementById('search-quick').style.display='none'; document.getElementById('search-advanced').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Szukaj po kodzie</button>
  </div>
</div>
`;

// NOWY POPUP DLA USERS.HTML I RETURNS.HTML (BEZ TRYBU KODU)
popups['change_search_mode_simple'] = `
<div class="panel popup" id="popup_change_search_mode_simple">
  <h3 class="header">Wybierz tryb wyszukiwania</h3>
  <div style="display: flex; flex-direction: column; gap: 0.25em;">
    <button onclick="document.getElementById('search-quick').style.display='flex'; document.getElementById('search-advanced').style.display='none'; closePopup('change_search_mode_simple');" style="padding: 0.75em 1em;">Szybkie</button>
    <button onclick="document.getElementById('search-advanced').style.display='flex'; document.getElementById('search-quick').style.display='none'; closePopup('change_search_mode_simple');" style="padding: 0.75em 1em;">Zaawansowane</button>
  </div>
</div>
`;

popups['add_new_author'] = `
<div class="panel popup" id="popup_add_new_author">
  <h3 class="header">Dodaj nowego autora</h3>
  <label for="newAuthorName">Imię i nazwisko autora:</label>
  <input type="text" id="newAuthorName" placeholder="Wpisz imię i nazwisko">

  <div style="display: flex; flex-direction: row; gap: 0.25em; margin-top: 0.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('add_new_author')">Anuluj</button>
    <button style="flex: 1;" onclick="closePopup('add_new_author')">Dodaj autora</button>
  </div>
</div>
`;

popups['add_new_genre'] = `
<div class="panel popup" id="popup_add_new_genre">
  <h3 class="header">Dodaj nowy gatunek</h3>
  <label for="newGenreName">Nazwa gatunku:</label>
  <input type="text" id="newGenreName" placeholder="Wpisz nazwę gatunku">

  <div style="display: flex; flex-direction: row; gap: 0.25em; margin-top: 0.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('add_new_genre')">Anuluj</button>
    <button style="flex: 1;" onclick="closePopup('add_new_genre')">Dodaj gatunek</button>
  </div>
</div>
`;