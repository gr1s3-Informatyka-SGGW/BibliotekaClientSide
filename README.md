# Biblioteka Online – Client Side

Interaktywna aplikacja webowa do zarządzania biblioteką, umożliwiająca użytkownikom przeglądanie zasobów i wypożyczanie książek, a administratorom pełną kontrolę nad księgozbiorem.

## Główne Funkcjonalności

### Autoryzacja i Zarządzanie Kontem
Kompletny system obsługi użytkownika zawarty w folderze `src/login`:
* **Zaawansowana Rejestracja:** Formularz z pełną walidacją danych osobowych oraz integracją danych karty płatniczej.
* **Bezpieczne Logowanie:** Obsługa sesji poprzez `AuthContext` z automatycznym przekierowaniem na odpowiedni panel (Admin/User) w zależności od uprawnień.
* **Odzyskiwanie Hasła:** System resetowania hasła z funkcjonalnością wysyłki hasła tymczasowego na adres e-mail.
* **Walidacja:** Zintegrowany system walidacji pól (e-mail, siła hasła, format karty) zapewniający poprawność wprowadzanych danych.
* **Obsługa Błędów:** Dedykowany moduł obsługi błędów (404 Not Found, 401 Access Denied) zintegrowany z systemem routingu.
* **Edycja Profilu:** Możliwość samodzielnej aktualizacji danych osobowych, zmiany hasła oraz zarządzania zapisanymi danymi karty płatniczej przez użytkownika.

### Moduł Użytkownika (Reader)
* **Katalog i Wyszukiwanie:** Zaawansowany system wyszukiwania pełnotekstowego (tytuł, autor, ISBN) połączony z dynamicznym filtrowaniem (gatunek, wydawca, język, zakres dat wydania) oraz sortowaniem wyników.
* **Zarządzanie Wypożyczeniami:** Pełna obsługa cyklu wypożyczeń – od rezerwacji pozycji, przez odbiór, aż po zwrot książki do biblioteki.
* **Profil:** Dedykowany widok (UserProfileView) agregujący dane o aktualnych wypożyczeniach i rezerwacjach.
* **Skaner kodów:** Wykorzystanie komponentu ScanButton do fizycznej interakcji z egzemplarzami (zwroty/odbioru) – funkcjonalność z automatyczną blokadą na urządzeniach desktopowych.

### Moduł Administratora
* **Zarządzanie zasobami (CRUD):** Pełny system dodawania i edycji książek (AddBookView) z dynamicznym wybieraniem autorów, wydawców i tagów.
* **System Egzemplarzy i Kodów QR:** Możliwość generowania i pobierania unikalnych kodów QR dla każdego egzemplarza książki (InstanceQR), co umożliwia łatwą identyfikację przy zwrotach.
* **Zarządzanie Użytkownikami:** Zaawansowana lista użytkowników (UsersListView) z funkcją blokowania/odblokowywania kont, usuwania profilów oraz dodawania nowych bibliotekarzy.
* **Log wypożyczeń i Kontrola Kar:** Przegląd wszystkich aktywnych wypożyczeń (RentedBooksListView) z automatycznym obliczaniem kar za przetrzymanie książek oraz monitoringiem terminów zwrotu.
* **Stan Techniczny:** Możliwość oznaczania konkretnych egzemplarzy jako zniszczone lub naprawione bezpośrednio z poziomu katalogu administratora.

## Stack Technologiczny
* **Framework:** React
* **Język:** TypeScript
* **Narzędzie budowania:** Vite
* **Stylizacja:** Responsive Web Design (RWD) z wykorzystaniem CSS Variables, obsługa widoków mobilnych (hamburger menu, responsywne tabele).
* **Dokumentacja:** JSDoc / TypeDoc
* **Zarządzanie stanem:** React Context API (AuthContext)
* **Generowanie QR:** Wykorzystanie biblioteki qrcode do dynamicznego tworzenia kodów dla egzemplarzy.
* **Komunikacja z API:** Wykorzystanie biblioteki Axios do obsługi żądań HTTP.
* **Routing:** react-router-dom (z obsługą tras chronionych i automatycznych przekierowań).

## Struktura Projektu (Kluczowe foldery)
* `src/elements_user` – Komponenty widoku użytkownika. Logika klienta: UserBookComponent (karta książki z akcjami), ProfileBookList (zarządzanie wypożyczeniami), ScanButton (integracja ze skanerem).
* `src/elements_admin` – Moduły zarządzania: AddBookView (formularz dodawania), UsersListView (baza czytelników), InstanceQR (generator kodów), RentedBooksListView (kontrola wypożyczeń).
* `public/custom_components` – Fundament UI: generyczne komponenty sterowane stanem i interfejsami (Popupy, dynamiczne selektory, system Tooltipów).
* `src/login` – Komponenty autoryzacji: `Login`, `Register`, `PasswordReset`.
* `src/general_elements` – Kluczowe komponenty nawigacyjne i wyszukiwawcze: CatalogView (główny kontroler widoku), SearchPanel (agregator filtrów), NavSidebar (dynamiczne menu zależne od roli).

## Jak uruchomić projekt?

### Wymagania

* **Node.js:** wersja 16.x lub wyższa
* **npm:** wersja 8.x lub wyższa

### Instalacja i uruchomienie

1. Sklonuj repozytorium na swój dysk.
2. Zainstaluj biblioteki: `npm install`
4. Wejść na stronę `http://localhost:[port podany przez vite]`

Możliwe jest włączenie testów przygotowanych z użyciem biblioteki Vitest: `npm run test`.
## Licencja
Projekt udostępniony na licencji MIT. Więcej informacji w pliku `LICENSE`.
