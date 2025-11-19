let bg_sidebar = document.createElement("div");
bg_sidebar.id = 'sidebar-bg'
document.body.appendChild(bg_sidebar);

document.body.insertAdjacentHTML('beforeend', `
<button id="menu-toggle" onclick="toggleMenu()">
    <span class="bar bar-top"></span>
    <span class="bar bar-middle"></span>
    <span class="bar bar-bottom"></span>
</button>

<nav class="sidebar" id="sidebar">
<div style="display: flex; margin: auto; align-items: center; gap: 0.5em; color: #891E49; margin-bottom: 0.75em;">
    <div id="menu-toggle-padding"></div>
    <img src="assets/logo.png" style="height: 2.5em; width: auto; filter: none;"> 
    <h2 style="margin: 0; color: white;">Biblioteka</h2>
    <div style="flex-grow: 1;"></div>
</div>

    <hr style="width: 100%; color: #ffffff20;">

    <a class="sidebar-elem" id="sidebar-button-catalog" href="catalog.html"><img src="assets/newsstand.svg"></img> Katalog</a>
    <a class="sidebar-elem" id="sidebar-button-profile" href="profile.html"><img src="assets/account_circle.svg"></img> Twój profil</a>
    <a class="sidebar-elem bibliotekarz" id="sidebar-button-users" href="users.html"><img src="assets/group.svg"></img> Użytkownicy</a>
    <a class="sidebar-elem bibliotekarz" id="sidebar-button-add-book" href="add_book.html"><img src="assets/add_box.svg"></img> Dodaj książkę</a>
    <a class="sidebar-elem bibliotekarz" id="sidebar-button-pending" href="pending.html"><img src="assets/borrow.svg"></img> Aktywne</a>
    <a class="sidebar-elem bibliotekarz" id="sidebar-button-returns" href="returns.html"><img src="assets/returns.svg"></img> Zwroty</a>

    <div style="flex: 1 1 auto;"></div>

    <a class="sidebar-elem" id="sidebar-button-about" href="about.html"><img src="assets/local_library.svg"></img> O bibliotece</a>

    <hr style="width: 100%; color: #ffffff20;">

      <div class="login-info" onclick="window.location.href = 'profile.html';" style="cursor: pointer; display: flex; align-items: center; gap: 15px; background: #FFFFFF33; padding: 10px; border-radius: 8px;">
      <img src="assets/person.svg" style="height: 40px; width: auto; filter: invert(1.0) brightness(500%);">
        <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.2;">
          <span style="font-weight: bold; color: #ffffff;">Jan Paweł</span>
          <span style="font-size: 0.9em; color: #ffffff90;">jan.pawel@example.com</span>
        </div>
      </div>

    <a class="sidebar-elem" href="index.html"><img src="assets/logout.svg"></img> Wyloguj się</a>
</nav>
`);

const path = window.location.pathname;
if (path.includes("catalog.html")) {
  document.getElementById("sidebar-button-catalog").classList.add('selected');
} else if (path.includes("profile.html")) {
  document.getElementById("sidebar-button-profile").classList.add('selected');
} else if (path.includes("users.html")) {
  document.getElementById("sidebar-button-users").classList.add('selected');
} else if (path.includes("add_book.html")) {
  document.getElementById("sidebar-button-add-book").classList.add('selected');
} else if (path.includes("returns.html")) {
  document.getElementById("sidebar-button-returns").classList.add('selected');
} else if (path.includes("about.html")) {
  document.getElementById("sidebar-button-about").classList.add('selected');
} else if (path.includes("pending.html")) {
  document.getElementById("sidebar-button-pending").classList.add('selected');
}

async function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('menu-toggle').classList.toggle('open');

  if (document.getElementById('sidebar').classList.contains('open')) {
    bg_sidebar.style.display = 'block';
    bg_sidebar.style.opacity = "1.0";
  } else {
    bg_sidebar.style.opacity = "0";
    await new Promise(r => setTimeout(r, 250));
    bg_sidebar.style.display = 'none';
  }
}
