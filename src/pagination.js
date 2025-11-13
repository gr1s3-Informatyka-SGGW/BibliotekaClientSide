// pagination.js
document.addEventListener("DOMContentLoaded", function() {
    const content = document.querySelector(".content");

    if (content) {
        // Tworzenie struktury paginacji
        const paginationHTML = `
            <div id="pagination-panel" style="display: flex; justify-content: center; align-items: center; gap: 0.5em; margin-top: 1.5em; margin-bottom: 1em;">
                <button id="prev-page" class="boring" disabled>
                    <img src="assets/arrow_back.svg" style="filter: invert(1);">
                    Poprz.
                </button>
                <div id="page-info" style="color: #6B1737; font-weight: bold; padding: 0.5em 0.75em; border-radius: 0.5em; background-color: #ffe8ef;">
                    Strona 1 z 10
                </div>
                <button id="next-page" class="boring">
                    Nast.
                    <img src="assets/arrow_forward.svg" style="filter: invert(1);">
                </button>
            </div>
        `;

        // Dodanie panelu na koniec elementu .content
        content.insertAdjacentHTML('beforeend', paginationHTML);
    }
});