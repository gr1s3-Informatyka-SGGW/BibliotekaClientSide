let bg = document.createElement("div");
bg.id = 'popup-bg'
document.body.appendChild(bg);


async function showPopup(id) {
  if (popups[id] === undefined) {
    alert("Błąd: Nie zdefiniowano popupu o ID: " + id);
    return;
  }

  document.body.insertAdjacentHTML('beforeend', popups[id]);

  let popup = document.getElementById("popup_" + id);

  if (popup === null) {
    alert("Błąd: Nie można znaleźć elementu DOM o ID: popup_" + id);
    return;
  }

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
  let popupCount = getPopups().length;

  let popup = document.getElementById("popup_" + id);
  if (popup === undefined) { return; }
  popup.style.opacity = "0";
  if (popupCount === 1) { bg.style.opacity = "0"; }

  await wait(250);

  if (popupCount === 1) { bg.style.display = 'none'; }
  popup.remove();
}

async function wait(ms) {
  await new Promise(r => setTimeout(r, ms));
}

function closeActivePopup() {
  const activeBg = document.getElementById('popup-bg');
  if (activeBg && activeBg.style.display !== 'none' && activeBg.style.opacity === '1') {
    const activePopup = document.querySelector('[id^="popup_"]:not([style*="opacity: 0"])');
    if (activePopup) {
      const popupId = activePopup.id.substring(6);
      closePopup(popupId);
    }
  }
}

function getPopups() {
  return document.querySelectorAll(".popup");
}

bg.addEventListener('click', () => {
  closeActivePopup();
});


document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeActivePopup();
  }
});



let popups = {};


popups['change_card'] = `
<div class="panel popup" id="popup_change_card" style="gap: 1.5em;">
  <h3 class="header">Zmień dane karty</h3>
  <div style="display: flex; flex-direction: column;">
  <label>Numer karty:</label>
  <input type="text" name="cardNumber" placeholder="1234 5678 9012 3456">
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.5em;">
    <div style="flex: 1">
      <label>Data wygaśnięcia:</label>
      <input type="month" name="cardExp" placeholder="2027-10">
    </div>
    <div style="flex: 1">
      <label>CVV:</label>
      <input type="text" name="cardCvv" placeholder="123">
    </div>
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('change_card')">Odrzuć zmiany</button>
    <button style="flex: 1;" onclick="closePopup('change_card')">Zapisz zmiany</button>
  </div>
</div>
`

popups['change_password'] = `
<div class="panel popup" id="popup_change_password" style="gap: 1.5em;">
  <h3 class="header">Zmień hasło</h3>
    <div>
      <label>Stare hasło:</label>
      <input type="password" name="old">
    </div>
    <div>
      <label>Nowe hasło:</label>
      <input type="password" name="new1">
    </div>
    <div>
      <label>Powtórz nowe hasło:</label>
      <input type="password" name="new2">
    </div>

  <div style="display: flex; flex-direction: row; gap: 0.25em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('change_password')">Odrzuć zmiany</button>
    <button style="flex: 1;" onclick="closePopup('change_password')">Zapisz zmiany</button>
  </div>
</div>
`

popups['book_copies_added'] = `
<div class="panel popup" id="popup_book_copies_added" style="width: 30em; max-height: 90%;">
  <h3 class="header">Książka dodana. Kody egzemplarzy:</h3>

  <div style="display: flex;  flex-direction: column; gap: 0.5em; overflow-y: auto; padding-right: 1em;">
    
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
  <h3 class="header">Przedłużenie wypożyczenia</h3>
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

popups['confirm_return_librarian'] = `
<div class="panel popup" id="popup_confirm_return_librarian">
  <h3 class="header">Zwrot książki</h3>
  <p>Zwrot potwierdzony. Możesz teraz odłożyć książke na półkę.</p>
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_return_librarian')">Ok</button>
  </div>
</div>
`

popups['change_search_mode'] = `
<div class="panel popup" id="popup_change_search_mode">
  <h3 class="header">Wybierz tryb wyszukiwania</h3>
  <div style="display: flex; flex-direction: column; gap: 0.25em;">
    <button onclick="document.getElementById('search-quick').style.display='flex'; document.getElementById('search-advanced').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Szybkie</button>
    <button onclick="document.getElementById('search-advanced').style.display='flex'; document.getElementById('search-quick').style.display='none'; closePopup('change_search_mode');" style="padding: 0.75em 1em;">Zaawansowane</button>
  </div>
</div>
`;

popups['change_search_mode_simple'] = `
<div class="panel popup" id="popup_change_search_mode_simple">
  <h3 class="header">Wybierz tryb wyszukiwania</h3>
  <div style="display: flex; flex-direction: column; gap: 0.25em;">
    <button onclick="document.getElementById('search-quick').style.display='flex'; document.getElementById('search-advanced').style.display='none'; closePopup('change_search_mode_simple');" style="padding: 0.75em 1em;">Szybkie</button>
    <button onclick="document.getElementById('search-advanced').style.display='flex'; document.getElementById('search-quick').style.display='none'; closePopup('change_search_mode_simple');" style="padding: 0.75em 1em;">Zaawansowane</button>
  </div>
</div>
`;

popups['add_to_select'] = `
<div class="panel popup" id="popup_add_to_select" style="gap: 1.5em;">
  <h3 class="header">Dodaj nowy element</h3>
  <div>
    <label>Dodaj nowy element:</label>
    <input type="text" placeholder="Nazwa elementu">
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.25em; margin-top: 0.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('add_to_select')">Anuluj</button>
    <button style="flex: 1;" onclick="closePopup('add_to_select')">Dodaj</button>
  </div>
</div>
`;

popups['librarian_actions'] = `
<div class="panel popup" id="popup_librarian_actions">
  <h3 class="header">Działania dla książki</h3>
  
  <div style="display: flex; flex-direction: column; gap: 0.5em;">
    <button onclick="(async () => {closePopup('librarian_actions'); await wait(300); showPopup('add_book_copy'); })();">Dodaj egzemplarz</button>
    <button onclick="(async () => { closePopup('librarian_actions'); await wait(300); showPopup('edit_book'); })();">Edytuj książkę</button>
    
    <button onclick="(async () => {closePopup('librarian_actions'); await wait(300); showPopup('confirm_delete_book'); })();">Usuń książkę</button>
  </div>
  
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('librarian_actions')">Zamknij</button>
  </div>
</div>
`;

popups['confirm_borrow'] = `
<div class="panel popup" id="popup_confirm_borrow">
  <h3 class="header">Potwierdzenie wypożyczenia</h3>
  
  <p style="margin: 1em 0; text-align: center;">
    Czy na pewno chcesz wypożyczyć książkę 
    <strong>„Sto lat samotności”</strong> autorstwa 
    <strong>Gabriel García Márquez</strong>?
  </p>

  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_borrow')">Nie</button>
    
    <button style="flex: 1;" onclick="closePopup('confirm_borrow')">Tak, wypożycz</button>
  </div>
</div>
`;

popups['confirm_reserve'] = `
<div class="panel popup" id="popup_confirm_reserve">
  <h3 class="header">Potwierdzenie rezerwacji</h3>
  
  <p style="margin: 1em 0; text-align: center;">
    Czy na pewno chcesz zarezerwować książkę 
    <strong>„Sto lat samotności”</strong> autorstwa 
    <strong>Gabriel García Márquez</strong>?
  </p>

  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_reserve')">Nie</button>
    
    <button style="flex: 1;" onclick="closePopup('confirm_reserve')">Tak, zarezerwuj</button>
  </div>
</div>
`;

popups['edit_book'] = `
<div class="panel popup" id="popup_edit_book" style="width: 40em; overflow-y: auto; gap: 1.5em;">
        <script src="add_book.js"></script>
<h3 class="header"><img src="assets/book.svg"> Informacje o książce</h3>

        <div class="form-grid" style="overflow-y: auto; padding-right: 1em; overflow-x: hidden;">

          <div class="form-row">
            <div class="form-group">
              <label for="title">Tytuł:</label>
              <input type="text" id="title">
            </div>

            <div class="form-group">
              <label for="isbn">ISBN:</label>
              <div id="isbn-container">
                <input type="text" id="isbn">
              </div>
            </div>
          </div>
          <label for="author-select">Autorzy:</label>
          <div class="multi-select-container">
            <div class="chip">
              J.R.R. Tolkien
              <span class="chip-close">x</span>
            </div>
            <div class="chip">
              C.S. Lewis
              <span class="chip-close">x</span>
            </div>
            <select id="author-select">
              <option disabled selected value="">Wybierz lub wpisz nowego autora</option>
              <option>Wpisz nowego autora</option>
              <option>Adam Mickiewicz</option>
              <option>Henryk Sienkiewicz</option>
            </select>
            <div class="chip add">Dodaj</div>
          </div>

          <label for="genre-select">Gatunki:</label>
          <div class="multi-select-container">
            <div class="chip">
              Fantasy
              <span class="chip-close">x</span>
            </div>
            <div class="chip">
              Przygodowy
              <span class="chip-close">x</span>
            </div>
            <select id="genre-select">
              <option disabled selected value="">Wybierz lub wpisz nowy gatunek</option>
              <option>Dodaj nowy gatunek</option>
              <option>Science Fiction</option>
              <option>Kryminał</option>
              <option>Horror</option>
            </select>
            <div class="chip add">Dodaj</div>
          </div>

          <label for="tag-select">Tagi:</label>
          <div class="multi-select-container">
            <div class="chip">
              morderstwo
              <span class="chip-close">x</span>
            </div>
            <div class="chip">
              słodkie kotki
              <span class="chip-close">x</span>
            </div>
            <select id="tag-select">
              <option disabled selected value="">Wybierz lub wpisz nowy tag</option>
              <option>Dodaj nowy tag</option>
              <option>natura</option>
              <option>nauka</option>
              <option>horror</option>
            </select>
            <div class="chip add">Dodaj</div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="year">Rok wydania:</label>
              <input type="number" id="year" min="1000" max="2100">
            </div>

            <div class="form-group">
              <label for="copies">Liczba egzemplarzy:</label>
              <input type="number" id="copies" min="1" value="1" disabled>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="publisher-select">Wydawca:</label>
              <select id="publisher-select">
                <option disabled selected value="">Wybierz lub wpisz nowego wydawce</option>
                <option>Dodaj nowego wydawce</option>
                <option>Wydawca A</option>
                <option>Wydawca B</option>
                <option>Wydawca C</option>
              </select>
            </div>

            <div class="form-group">
              <label for="language-select">Język:</label>
              <select id="language-select">
                <option disabled selected value="">Wybierz lub wpisz nowy język</option>
                <option>Dodaj nowy język</option>
                <option>senegalski</option>
                <option>mongolski</option>
                <option>peruwiański</option>
              </select>
            </div>
          </div>
        </div>

<div style="display: flex; gap: 0.5em; width: 100%;">
    <button class="boring" onclick="closePopup('edit_book')" style="flex-grow: 1;">Zamknij</button>
    <button onclick="closePopup('edit_book')" style="flex-grow: 1;"><img src="assets/save.svg"></img>&nbspZapisz zmiany</button>
</div>
</div>
`;

popups['show_copy_code'] = `
<div class="panel popup" id="popup_show_copy_code">
  <h3 class="header">Kod egzemplarza</h3>
  
  <div style="display: flex; flex-direction: column; align-items: center; gap: 1em; margin: 1em 0;">
    <img src="assets/example_qr.png" alt="QR Code" style="width: 10em; height: 10em; border: 1px solid #ddd; padding: 0.5em; border-radius: 0.5em;">
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('show_copy_code')">Zamknij</button>
    <button style="flex: 1;">Zapisz do pliku</button>
    <button style="flex: 1;">Drukuj etykietę</button>
  </div>
</div>
`;

popups['add_book_copy'] = `
<div class="panel popup" id="popup_add_book_copy">
  <h3 class="header">Dodano egzemplarz</h3>
  
  <div style="display: flex; flex-direction: column; align-items: center; gap: 1em; margin: 1em 0;">
    <img src="assets/example_qr.png" alt="QR Code" style="width: 10em; height: 10em; border: 1px solid #ddd; padding: 0.5em; border-radius: 0.5em;">
  </div>

  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('add_book_copy')">Zamknij</button>
    <button style="flex: 1;">Zapisz do pliku</button>
    <button style="flex: 1;">Drukuj etykietę</button>
  </div>
</div>
`;

popups['remove_copy'] = `
<div class="panel popup" id="popup_remove_copy">
  <h3 class="header">Usuwanie egzemplarza</h3>
  <p>Czy na pewno chcesz trwale usunąć ten egzemplarz z systemu? <br><strong>Tej operacji nie można cofnąć.</strong></p>
  
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('remove_copy')">Anuluj</button>
    <button style="flex: 1; background-color: #c62828;" onclick="closePopup('remove_copy')">Usuń trwale</button>
  </div>
</div>
`;

popups['confirm_delete_book'] = `
<div class="panel popup" id="popup_confirm_delete_book">
  <h3 class="header">Usuwanie książki</h3>
  <p>Czy na pewno chcesz trwale usunąć tą książke z systemu? <br><strong>Tej operacji nie można cofnąć.</strong></p>
  
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_delete_book')">Anuluj</button>
    <button style="flex: 1; background-color: #c62828;" onclick="closePopup('confirm_delete_book')">Usuń trwale</button>
  </div>
</div>
`;

popups['mark_copy_destroyed'] = `
<div class="panel popup" id="popup_mark_copy_destroyed">
  <h3 class="header">Zgłoszenie zniszczenia</h3>
  <p>Czy chcesz oznaczyć ten egzemplarz jako zniszczony?</p>
  <p>Egzemplarz zostanie wyłączony z obiegu wypożyczeń, ale pozostanie w historii systemu.</p>
  
  <div style="display: flex; flex-direction: row; gap: 0.5em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('mark_copy_destroyed')">Anuluj</button>
    <button style="flex: 1;" onclick="closePopup('mark_copy_destroyed')">Oznacz jako zniszczony</button>
  </div>
</div>
`;

popups['confirm_librarian_return'] = `
<div class="panel popup" id="popup_confirm_librarian_return">
  <h3 class="header">Potwierdź zwrot książki</h3>
  <p>Czy potwierdzasz, że książka <strong>„Tytuł Książki”</strong> (1984, egz. #123) została fizycznie zwrócona i jest w dobrym stanie?</p>
  <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
    <button class="boring" style="flex: 1;" onclick="closePopup('confirm_librarian_return')">Anuluj</button>
    <button style="flex: 1; background-color: #28a745;" onclick="closePopup('confirm_librarian_return')">Tak, zakończ wypożyczenie</button>
  </div>
</div>
`;

