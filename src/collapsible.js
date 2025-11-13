function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    const isCollapsed = content.classList.contains('collapsed');
    const toggleTextElement = header.querySelector('.toggle-text');

    content.classList.toggle('collapsed');
    header.classList.toggle('collapsed');

    let currentText = toggleTextElement.textContent;
    let newText;

    if (isCollapsed) {
        newText = currentText.replace('Pokaż', 'Ukryj');
        content.style.maxHeight = content.scrollHeight + "px";
    } else {
        newText = currentText.replace('Ukryj', 'Pokaż');
        content.style.maxHeight = '0';
    }

    toggleTextElement.textContent = newText;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.classList.add('collapsed');
        header.nextElementSibling.classList.add('collapsed');
        header.nextElementSibling.style.maxHeight = '0';
    });
});