// Chat interaction logic
const API_BASE_URL = '/api/v1';

// Mock user_id for now
const USER_ID = 'user_123';

async function fetchTickets() {
    console.log('Fetching sessions...');
    // Renamed endpoint to sessions as requested
    try {
        const response = await fetch(`${API_BASE_URL}/chat/list-sessions/${USER_ID}`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const sessions = await response.json();
        renderSessionList(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
    }
}

function renderSessionList(sessions) {
    const list = document.getElementById('sessionList');
    list.innerHTML = sessions.map(session => `
        <div class="p-3 bg-white rounded-lg shadow-sm mb-2 cursor-pointer hover:bg-blue-50" onclick="loadChat('${session.id}')">
            <h4 class="font-bold text-sm truncate">Chat ${session.id.slice(0,8)}</h4>
        </div>
    `).join('');
}

async function loadChat(sessionId) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = 'Loading...';
    try {
        const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
        const messages = await response.json();
        chatMessages.innerHTML = messages.map(msg => `
            <div class="flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} mb-4">
                <div class="max-w-[70%] p-3 rounded-lg ${msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}">
                    ${msg.content}
                </div>
            </div>
        `).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (e) {
        chatMessages.innerHTML = 'Error loading chat.';
    }
}

// Send Message Logic
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content) return;

    // UI Update immediately
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML += `
        <div class="flex justify-end mb-4">
            <div class="max-w-[70%] p-3 rounded-lg bg-blue-600 text-white">
                ${content}
            </div>
        </div>
    `;
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Post message
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticket_id: null, content, user_id: USER_ID })
        });
        
        if (!response.ok) throw new Error('Failed to send');
        
        // Refresh messages
        // In real app, we should append the new AI message instead of reload
    } catch (e) {
        console.error('Error:', e);
    }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Initial load
fetchTickets();
