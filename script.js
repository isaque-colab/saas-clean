const body = document.body;
const toggleButton = document.querySelector('.theme-toggle');
const toggleIcon = document.querySelector('.theme-toggle__icon');
const yearNode = document.getElementById('year');
const form = document.querySelector('.lead-form');
const launcher = document.querySelector('.ai-launcher');
const chat = document.getElementById('ai-chat');
const closeButton = document.getElementById('ai-close');
const aiForm = document.getElementById('ai-form');
const aiInput = document.getElementById('ai-input');
const aiMessages = document.getElementById('ai-messages');

const addAiMessage = (role, text) => {
  const wrapper = document.createElement('div');
  wrapper.className = `ai-message ai-message--${role}`;
  wrapper.textContent = text;
  aiMessages.appendChild(wrapper);
  aiMessages.scrollTop = aiMessages.scrollHeight;
};

const askAi = async (prompt) => {
  addAiMessage('user', prompt);
  aiInput.disabled = true;
  const submitButton = aiForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = '...';

  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: prompt }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível responder agora.');
    }

    addAiMessage('bot', payload.answer || 'Não obtive uma resposta útil.');
  } catch (error) {
    addAiMessage('bot', `Não consegui processar sua mensagem. ${error.message}`);
  } finally {
    aiInput.disabled = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Enviar';
    aiInput.value = '';
    aiInput.focus();
  }
};

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

if (launcher && chat) {
  launcher.addEventListener('click', () => {
    chat.classList.toggle('is-open');
    if (chat.classList.contains('is-open')) {
      aiInput.focus();
    }
  });
}

if (closeButton && chat) {
  closeButton.addEventListener('click', () => {
    chat.classList.remove('is-open');
  });
}

if (aiForm) {
  aiForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = aiInput.value.trim();
    if (!value) return;
    askAi(value);
  });
}
