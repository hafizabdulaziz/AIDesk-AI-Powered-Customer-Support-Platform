// Chat interaction logic
const API_BASE_URL = '/api/v1';

// Mock user_id for now
const USER_ID = 'user_123';

async function fetchTickets() {
    console.log('Fetching sessions...');
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
            <h4 class="font-bold text-sm truncate">${session.title || 'New Chat'}</h4>
        </div>
    `).join('');
}

async function loadChat(sessionId) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = 'Loading...';
    try {
        const response = await fetch(`${API_BASE_URL}/agent/tickets/${sessionId}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const messages = await response.json();
        
        if (messages.length === 0) {
            chatMessages.innerHTML = 'No messages yet.';
            return;
        }

        chatMessages.innerHTML = messages.map(msg => `
            <div class="flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} mb-4">
                <div class="max-w-[70%] p-3 rounded-lg ${msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}">
                    ${msg.content}
                </div>
            </div>
        `).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (e) {
        console.error(e);
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

    // Add Thinking indicator
    chatMessages.innerHTML += `
        <div class="flex justify-start mb-4" id="thinkingIndicator">
            <div class="max-w-[70%] p-3 rounded-lg bg-gray-200 text-gray-800 animate-pulse">
                Thinking...
            </div>
        </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Send message to /message endpoint
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ticket_id: null, 
                content: content, 
                user_id: USER_ID 
            })
        });

        if (!response.ok) throw new Error('Failed to send');

        const data = await response.json();
        
        // Remove Thinking indicator
        document.getElementById('thinkingIndicator').remove();
        
        // Append AI response
        chatMessages.innerHTML += `
            <div class="flex justify-start mb-4">
                <div class="max-w-[70%] p-3 rounded-lg bg-gray-200 text-gray-800">
                    ${data.response}
                </div>
            </div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (e) {
        document.getElementById('thinkingIndicator')?.remove();
        console.error('Error:', e);
        chatMessages.innerHTML += `
            <div class="text-red-500 text-xs text-center mt-2">Error sending message.</div>
        `;
    }
}

document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Initial load
fetchTickets();
