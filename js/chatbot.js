/* ==========================================================
   Willow & Bloom Clinic — AI Assistant Widget
   Talks to the backend at /api/chat, which forwards the
   conversation to the Gemini API with a clinic-specific
   system prompt. No API key ever touches the browser.
   ========================================================== */
(function () {
  // Point this at your deployed backend if the API isn't served
  // from the same origin as the website, e.g. 'https://api.yourclinic.com'
  const API_BASE = window.CLINIC_API_BASE || '';

  const SUGGESTIONS = [
    'What are your clinic hours?',
    'How do I book an appointment?',
    'Do you accept my insurance?',
    'What services do you offer?'
  ];

  const state = {
    open: false,
    history: [], // {role: 'user'|'model', text: string}
    loading: false
  };

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => c && node.appendChild(c));
    return node;
  }

  function buildWidget() {
    const launcher = el('button', {
      id: 'clinic-chat-launcher',
      'aria-label': 'Open clinic assistant chat',
      html: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="pulse-dot"></span>
      `
    });

    const chatWindow = el('div', { class: 'chat-window', id: 'clinic-chat-window', role: 'dialog', 'aria-label': 'Clinic assistant chat' });

    chatWindow.appendChild(el('div', { class: 'chat-header' }, [
      el('div', { class: 'avatar', html: `<svg viewBox="0 0 24 24" fill="none" stroke="#1F4B43" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 1 1-8 0V6a4 4 0 0 1 4-4z"></path><path d="M6 12v1a6 6 0 0 0 12 0v-1M12 19v3"></path></svg>` }),
      el('div', { class: 'info' }, [
        el('h4', {}, document.createTextNode('Willow Assistant')),
        el('span', {}, [el('span', { class: 'dot' }), document.createTextNode(' Usually replies instantly')])
      ]),
      el('button', {
        class: 'chat-close', id: 'clinic-chat-close', 'aria-label': 'Close chat',
        html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
      })
    ]));

    const body = el('div', { class: 'chat-body', id: 'clinic-chat-body' });
    chatWindow.appendChild(body);

    const suggestions = el('div', { class: 'chat-suggestions', id: 'clinic-chat-suggestions' });
    SUGGESTIONS.forEach(s => {
      const chip = el('button', { class: 'chip', type: 'button' }, document.createTextNode(s));
      chip.addEventListener('click', () => sendMessage(s));
      suggestions.appendChild(chip);
    });
    chatWindow.appendChild(suggestions);

    const inputRow = el('div', { class: 'chat-input-row' });
    const input = el('input', { type: 'text', placeholder: 'Type your question…', id: 'clinic-chat-input', autocomplete: 'off' });
    const sendBtn = el('button', {
      class: 'chat-send', id: 'clinic-chat-send', 'aria-label': 'Send message',
      html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`
    });
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    chatWindow.appendChild(inputRow);

    chatWindow.appendChild(el('div', { class: 'chat-disclaimer' },
      document.createTextNode('This assistant provides general clinic info only, not medical advice. In an emergency, call 911.')
    ));

    document.body.appendChild(launcher);
    document.body.appendChild(chatWindow);

    launcher.addEventListener('click', toggleChat);
    document.getElementById('clinic-chat-close').addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage(input.value);
    });

    // Greet on first open
    addMessage('bot', "Hi there! 👋 I'm the Willow & Bloom virtual assistant. I can help with clinic hours, services, insurance, and booking appointments. How can I help today?");
  }

  function toggleChat() {
    const win = document.getElementById('clinic-chat-window');
    state.open = !state.open;
    win.classList.toggle('open', state.open);
    if (state.open) document.getElementById('clinic-chat-input').focus();
  }

  function addMessage(role, text) {
    const body = document.getElementById('clinic-chat-body');
    const bubble = el('div', { class: `msg ${role === 'user' ? 'user' : 'bot'}` });
    bubble.textContent = text;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
  }

  function setLoading(isLoading) {
    state.loading = isLoading;
    const body = document.getElementById('clinic-chat-body');
    let dots = document.getElementById('clinic-chat-typing');
    if (isLoading) {
      dots = el('div', { class: 'typing-dots', id: 'clinic-chat-typing' }, [el('span'), el('span'), el('span')]);
      body.appendChild(dots);
      body.scrollTop = body.scrollHeight;
    } else if (dots) {
      dots.remove();
    }
    document.getElementById('clinic-chat-send').disabled = isLoading;
  }

  async function sendMessage(rawText) {
    const text = (rawText || '').trim();
    if (!text || state.loading) return;

    const input = document.getElementById('clinic-chat-input');
    input.value = '';
    document.getElementById('clinic-chat-suggestions').style.display = 'none';

    addMessage('user', text);
    state.history.push({ role: 'user', text });
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: state.history.slice(0, -1) })
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setLoading(false);

      const reply = data.reply || "I'm sorry, I couldn't process that. Please call the front desk at (555) 010-2345 for help.";
      addMessage('bot', reply);
      state.history.push({ role: 'model', text: reply });
    } catch (err) {
      setLoading(false);
      addMessage('bot', "I'm having trouble connecting right now. Please try again shortly, or call us at (555) 010-2345.");
      console.error('Clinic chat error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
