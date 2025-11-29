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
          <a href="catalog.html">
      <img src="../assets/logo.png" alt="" style="height: 2.5em; width: auto; filter: none;"> 
      <h2 style="margin: 0; color: white;">Biblioteka</h2>
      </a>
    <div style="flex-grow: 1;"></div>
</div>

      <div class="login-info" onclick="window.location.href = 'profile.html';" style="cursor: pointer; display: flex; align-items: center; gap: 15px; background: #FFFFFF33s; padding: 10px; border-radius: 8px;">
      <img src="../assets/person.svg" style="height: 40px; width: auto; filter: invert(1.0) brightness(500%);">
        <div style="display: flex; flex-direction: column; justify-content: center; line-height: 1.2;">
          <span style="font-weight: bold; color: #ffffff;">Jan Paweł</span>
          <span style="font-size: 0.9em; color: #ffffff90;">jan.pawel@example.com</span>
        </div>
      </div>

    <hr style="width: 100%; color: #ffffff20;">
    <div style="overflow-y: auto;">
    <a class="sidebar-elem" id="sidebar-button-catalog" href="catalog.html"><img src="../assets/newsstand.svg"></img> Katalog</a>
    <a class="sidebar-elem" id="sidebar-button-profile" href="profile.html"><img src="../assets/account_circle.svg"></img> Twój profil</a>
    <a class="sidebar-elem" id="sidebar-button-users" href="users.html"><img src="../assets/group.svg"></img> Użytkownicy</a>
    <a class="sidebar-elem" id="sidebar-button-add-book" href="add_book.html"><img src="../assets/add_box.svg"></img> Dodaj książkę</a>
    <a class="sidebar-elem" id="sidebar-button-loans" href="loans.html"><img src="../assets/borrow.svg"></img> Wypożyczenia</a>
    </div>

    <div style="flex: 1 1 auto;"></div>

    <a class="sidebar-elem" id="sidebar-button-about" href="/about-us"><img src="../assets/local_library.svg"></img> O bibliotece</a>

    <hr style="width: 100%; color: #ffffff20;">


    <a class="sidebar-elem" href="/login"><img src="../assets/logout.svg"></img> Wyloguj się</a>
</nav>
`);

const path = window.location.pathname;
document.querySelectorAll('.sidebar-elem').forEach(el => {
  if (typeof el.href === "string" && path.split('/').pop() == el.href.split('/').pop()) {
    el.classList.add('selected');
  }
});

async function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('menu-toggle').classList.toggle('open');

  if (document.getElementById('sidebar').classList.contains('open')) {
    bg_sidebar.style.display = 'block';
    bg_sidebar.style.opacity = "1.0";
    document.getElementById('menu-toggle').style.top = "1em";
  } else {
    bg_sidebar.style.opacity = "0";
    await new Promise(r => setTimeout(r, 250));
    bg_sidebar.style.display = 'none';
  }
}

(() => {
  let lastY = window.scrollY || document.documentElement.scrollTop;
  let ticking = false;
  const threshold = 4;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const currentY = window.scrollY || document.documentElement.scrollTop;
      const delta = currentY - lastY;

      if (document.getElementById('sidebar').classList.contains('open')) {
        document.getElementById('menu-toggle').style.top = "1em";
      } else {
        if (Math.abs(delta) > threshold) {
          if (delta > 0) {
            document.getElementById('menu-toggle').style.top = "-3.55em";
          } else {
            document.getElementById('menu-toggle').style.top = "1em";
          }
          lastY = currentY;
        }
      }


      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();
