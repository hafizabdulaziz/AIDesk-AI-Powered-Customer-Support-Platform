const API_BASE_URL = 'http://localhost:8001/api/v1';
const USER_ID = 'user_123'; // Placeholder user ID

document.addEventListener('DOMContentLoaded', () => {
    const ticketsList = document.getElementById('tickets-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const currentTicketTitle = document.getElementById('current-ticket-title');
    const ticketMeta = document.getElementById('ticket-meta');
    const ticketStatus = document.getElementById('ticket-status');
    const ticketPriority = document.getElementById('ticket-priority');
    const welcomeState = document.getElementById('welcome-state');

    let currentTicketId = null;

    // --- Modal Logic ---

    const ticketModal = document.getElementById('ticket-modal');
    const modalContainer = document.getElementById('modal-container');
    const newTicketBtn = document.getElementById('new-ticket-btn');
    const closeModal = document.getElementById('close-modal');
    const cancelModal = document.getElementById('cancel-modal');
    const ticketForm = document.getElementById('ticket-form');

    function openModal() {
        ticketModal.classList.remove('hidden');
        setTimeout(() => {
            modalContainer.classList.remove('scale-95', 'opacity-0');
            modalContainer.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function hideModal() {
        modalContainer.classList.remove('scale-100', 'opacity-100');
        modalContainer.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            ticketModal.classList.add('hidden');
        }, 200);
    }

    if (newTicketBtn) {
        newTicketBtn.onclick = openModal;
    }

    if (closeModal) {
        closeModal.onclick = hideModal;
    }

    if (cancelModal) {
        cancelModal.onclick = hideModal;
    }

    async function handleCreateTicket(e) {
        e.preventDefault();
        
        const subject = document.getElementById('ticket-subject').value;
        const category = document.getElementById('ticket-category').value;
        const priority = document.getElementById('ticket-priority-select').value;
        const description = document.getElementById('ticket-description').value;
        
        const submitBtn = document.getElementById('submit-ticket');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

        try {
            // Since we don't have a dedicated /api/v1/tickets endpoint yet (based on my read),
            // we use /api/v1/chat/message as a way to initialize a ticket if the backend supports it,
            // OR we assume /api/v1/tickets/ exists and create it.
            // Based on Step 4 requirements, we use /api/v1/tickets/
            const response = await fetch(`${API_BASE_URL}/tickets/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: USER_ID,
                    title: subject,
                    category: category,
                    priority: priority,
                    description: description
                })
            });

            if (!response.ok) throw new Error('Failed to create ticket');
            
            const data = await response.json();
            hideModal();
            ticketForm.reset();
            
            // Load tickets again and select the new one
            await loadTickets();
            selectTicket(data.ticket_id, data.title || subject);
            
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Failed to create ticket. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Ticket';
        }
    }

    if (ticketForm) {
        ticketForm.onsubmit = handleCreateTicket;
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

    // --- API Calls ---

    async function loadTickets() {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/list-sessions/${USER_ID}`);
            if (!response.ok) throw new Error('Failed to fetch tickets');
            
            const tickets = await response.json();
            ticketsList.innerHTML = '';

            if (tickets.length === 0) {
                ticketsList.innerHTML = '<div class="p-3 text-sm text-gray-500 text-center italic">No tickets found.</div>';
                return;
            }

            tickets.forEach(ticket => {
                const div = document.createElement('div');
                div.className = 'p-3 text-sm font-medium text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300';
                div.textContent = ticket.title || 'Untitled Ticket';
                div.onclick = () => selectTicket(ticket.id, ticket.title);
                ticketsList.appendChild(div);
            });
        } catch (error) {
            console.error('Error loading tickets:', error);
            ticketsList.innerHTML = '<div class="p-3 text-sm text-red-500 text-center">Error loading tickets.</div>';
        }
    }

    async function selectTicket(ticketId, title) {
        currentTicketId = ticketId;
        currentTicketTitle.textContent = title || 'Chat Session';
        ticketMeta.classList.remove('hidden');
        chatInput.disabled = false;
        sendBtn.disabled = false;
        
        chatMessages.innerHTML = ''; // Clear current messages
        appendMessage('Loading conversation...', false);

        try {
            const response = await fetch(`${API_BASE_URL}/agent/tickets/${ticketId}/history`);
            if (!response.ok) throw new Error('Failed to fetch history');
            
            const messages = await response.json();
            chatMessages.innerHTML = ''; // Remove loading message

            if (messages.length === 0) {
                appendMessage('No messages yet. Start the conversation!', false);
            } else {
                messages.forEach(msg => {
                    // Based on backend: sender is often stored as an Enum or string
                    // We assume 'USER' or 'AI' / 'assistant'
                    const isUser = msg.sender === 'USER' || msg.sender === 1; 
                    appendMessage(msg.content, isUser);
                });
            }
        } catch (error) {
            console.error('Error loading history:', error);
            chatMessages.innerHTML = '';
            appendMessage('Error loading chat history.', false);
        }
    }

    async function sendMessage(e) {
        e.preventDefault();
        const content = chatInput.value.trim();
        if (!content || !currentTicketId) return;

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
                    ticket_id: currentTicketId,
                    user_id: USER_ID,
                    content: content
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            
            const data = await response.json();
            
            // Remove typing indicator and add real response
            document.getElementById('typing-indicator')?.remove();
            appendMessage(data.response, false);
            
            // Update status if it changed
            if (data.status) {
                ticketStatus.textContent = data.status;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            document.getElementById('typing-indicator')?.remove();
            appendMessage('Sorry, something went wrong. Please try again.', false);
        }
    }

    chatForm.onsubmit = sendMessage;

    // Initial load
    loadTickets();
});
