const API_BASE_URL = 'http://localhost:8001/api/v1';
const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9); // Random user ID for persistent session

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const welcomeState = document.getElementById('welcome-state');

    // For simplicity in direct chat, we don't have tickets, 
    // but the backend API still requires a ticket_id.
    // We'll auto-generate one for this user's session.
    let currentTicketId = null;

    async function ensureTicket() {
        if (currentTicketId) return currentTicketId;
        
        // This is a bit of a hack to get a ticket ID without explicit creation
        // The /message endpoint creates a ticket if ticket_id is null.
        // So we don't strictly need a separate initialization.
        return null;
    }

    // --- Utility Functions ---

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendMessage(text, isUser) {
        if (welcomeState) welcomeState.classList.add('hidden');
        
        const wrapper = document.createElement('div');
        wrapper.className = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`;
        
        const bubble = document.createElement('div');
        bubble.className = `max-w-[80%] p-3 rounded-2xl shadow-sm ${
            isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-gray-200 text-gray-800 rounded-tl-none'
        }`;
        bubble.textContent = text;
        
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        scrollToBottom();
    }

    // --- Message Logic ---

    async function sendMessage(e) {
        e.preventDefault();
        const content = chatInput.value.trim();
        if (!content) return;

        appendMessage(content, true);
        chatInput.value = '';
        
        // Show a "typing" indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex justify-start mb-4';
        typingDiv.innerHTML = `<div class="bg-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm animate-pulse">AI is thinking...</div>`;
        typingDiv.id = 'typing-indicator';
        chatMessages.appendChild(typingDiv);
        scrollToBottom();

        try {
            const response = await fetch(`${API_BASE_URL}/chat/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: currentTicketId, // Backend handles null to create new ticket
                    user_id: USER_ID,
                    content: content
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            const data = await response.json();
            
            // If this was our first message, store the ticket ID
            if (!currentTicketId) {
                currentTicketId = data.ticket_id;
            }
            
            // Remove typing indicator and add real response
            document.getElementById('typing-indicator')?.remove();
            appendMessage(data.response, false);
            
        } catch (error) {
            console.error('Error sending message:', error);
            document.getElementById('typing-indicator')?.remove();
            appendMessage('Sorry, something went wrong. Please try again.', false);
        }
    }

    // ...
    chatForm.addEventListener('submit', sendMessage);
    chatInput.focus();
});
