const tooltip = document.createElement('div');
tooltip.className = 'custom-tooltip';
document.body.appendChild(tooltip);

const updatePosition = (target) => {
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = rect.top - tooltipRect.height - 10;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

  if (top < 0) {
    top = rect.bottom + 10;
    tooltip.classList.add('bottom');
  } else {
    tooltip.classList.remove('bottom');
  }

  if (left < 0) left = 10;
  if (left + tooltipRect.width > window.innerWidth) left = window.innerWidth - tooltipRect.width - 10;

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
};

document.addEventListener('mouseover', (e) => {
  const target = e.target.closest('[data-tooltip]');
  if (target) {
    tooltip.textContent = target.getAttribute('data-tooltip');
    tooltip.classList.add('visible');
    updatePosition(target);
  }
});

document.addEventListener('mouseout', (e) => {
  const target = e.target.closest('[data-tooltip]');
  if (target) {
    tooltip.classList.remove('visible');
  }
});