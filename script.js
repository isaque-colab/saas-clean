const body = document.body;
const toggleButton = document.querySelector('.theme-toggle');
const toggleIcon = document.querySelector('.theme-toggle__icon');
const yearNode = document.getElementById('year');
const form = document.querySelector('.lead-form');

const savedTheme = localStorage.getItem('fluxo-theme');
if (savedTheme === 'light') {
  body.classList.add('light');
  toggleIcon.textContent = '🌙';
}

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    const isLight = body.classList.toggle('light');
    localStorage.setItem('fluxo-theme', isLight ? 'light' : 'dark');
    toggleIcon.textContent = isLight ? '🌙' : '☀️';
  });
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    const previousText = button.textContent;

    button.textContent = 'Solicitado ✓';
    button.disabled = true;

    setTimeout(() => {
      button.textContent = previousText;
      button.disabled = false;
      form.reset();
    }, 1800);
  });
}
