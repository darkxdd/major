// MediSense Chatbot functionality

// Initialize chat state
let chatHistory = [
    ["Hello! I'm MediSense, your AI health assistant. How can I help you today?", ""]
];

// Add initial bot message to UI if API was available on load
// This relies on the initial test in gradio.js
if (window.gradioApi && window.gradioApi.getApiStatus().working) {
    addBotMessage(chatHistory[0][0]);
} else {
    // Optionally, display a message indicating chat is unavailable until connection succeeds
    console.warn("Chat API not immediately available. Initial message delayed.");
    // You could add a placeholder message in the chat UI here
}

// Add user message to chat UI
function addUserMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add bot message to chat UI
function addBotMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Process the message for formatting
    const lines = message.split('\n');
    let htmlContent = '';
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            return; // Skip empty lines
        }

        let processedLine = trimmedLine;
        let isListItem = false;

        if (processedLine.startsWith('* ')) {
            isListItem = true;
            processedLine = processedLine.substring(2).trim(); // Remove leading '* ' and trim again
        }

        // 1. Replace **bold** first
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 2. Replace *italic* 
        processedLine = processedLine.replace(/(?<![\*\w])\*(?!\*|\s)(.*?)(?<!\s|\*)\*(?![\*\w])/g, '<em>$1</em>');

        // 3. Final trim and check if the line is effectively empty after processing
        processedLine = processedLine.trim();
        if (processedLine === '') {
            return; // Skip lines that become empty after processing markdown
        }

        if (isListItem) {
            htmlContent += `<p style="margin-left: 1em; text-indent: -1em;">•&nbsp;${processedLine}</p>`;
        } else {
            htmlContent += `<p>${processedLine}</p>`;
        }
    });
    
    // Set the processed HTML content
    contentDiv.innerHTML = htmlContent;
    // Fallback if processing results in empty content
    if (contentDiv.innerHTML.trim() === '') {
        contentDiv.textContent = message;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle sending a message
async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const errorElement = document.getElementById('chat-error');
    const loadingElement = document.getElementById('chat-loading');
    
    const message = chatInput.value.trim();
    
    // Clear previous errors
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
    
    // Validate input
    if (!message) {
        return;
    }
    
    // Add user message to UI
    addUserMessage(message);
    
    // Clear input
    chatInput.value = '';
    
    // Show loading indicator
    loadingElement.classList.remove('hidden');
    
    try {
        // Format the history for the API call
        const formattedHistory = [...chatHistory];
        
        // Send message using the API wrapper
        const result = await window.gradioApi.chat(message, formattedHistory);

        console.log("Gradio API chat result:", result); // Log the raw result
        
        // Validate the result structure based on LATEST observed logs
        // Expect result.data[0] = [ [user1, bot1], [user2, bot2], ... ] (full history)
        if (result && result.data && Array.isArray(result.data) && result.data.length > 0 &&
            Array.isArray(result.data[0])) 
        {
            // The backend is returning the full updated history in result.data[0]
            const fullUpdatedHistory = result.data[0];

            // --- Verification Log --- 
            console.log("*** Received Full History from Backend: ***", JSON.stringify(fullUpdatedHistory));
            // ----------------------

            // Replace local history with the full history from the backend
            chatHistory = fullUpdatedHistory;

            console.log("Replaced local history. Updated chat history:", chatHistory);

            // Get the latest bot response from the last turn in the received history
            if (chatHistory.length > 0) {
                const latestTurn = chatHistory[chatHistory.length - 1];
                if (Array.isArray(latestTurn) && latestTurn.length > 1 && typeof latestTurn[1] === 'string') {
                    const botResponse = latestTurn[1];
                    // Add the latest bot message to UI
                    addBotMessage(botResponse);
                } else {
                    console.error("Latest turn in received history has unexpected format:", latestTurn);
                    throw new Error("Received an unexpected format for the latest chat turn.");
                }
            } else {
                 // Should not happen if data[0] is a non-empty array, but handle defensively
                 console.warn("Received history array from backend is empty.");
                 // Optionally add a generic error message to UI? 
            }
           
        } else {
            console.error("Invalid or unexpected response structure received from chat API (expected full history in data[0]):", result);
            // Fallback logic remains the same
            let potentialResponse = "Received an invalid response structure from the chatbot.";
            if (result && result.data && Array.isArray(result.data) && result.data.length > 0 && Array.isArray(result.data[0]) && result.data[0].length > 0 && typeof result.data[0][0] === 'string'){
                potentialResponse = result.data[0][0]; 
                 addBotMessage(potentialResponse); 
                 throw new Error("Received an invalid response structure, but attempting to display potential response text."); 
            } else if (result && result.data && typeof result.data === 'string') {
                 potentialResponse = result.data; 
                 addBotMessage(potentialResponse);
                 throw new Error("Received string data instead of expected array structure.");
            }
            
            throw new Error("Received an invalid response structure from the chatbot.");
        }
        
    } catch (error) {
        console.error("Chat error:", error);
        // Avoid overwriting specific error messages thrown above if they exist
        if (!errorElement.textContent) { 
             errorElement.textContent = error.message || "Error processing your request. Please try again later.";
        }
        errorElement.classList.remove('hidden');
    } finally {
        // Hide loading indicator
        loadingElement.classList.add('hidden');
    }
}

// Send message button click handler
document.getElementById('send-message-btn').addEventListener('click', sendMessage);

// Send message on Enter key
document.getElementById('chat-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Clear chat button click handler
document.getElementById('clear-chat-btn').addEventListener('click', async function() {
    // Clear UI
    document.getElementById('chat-messages').innerHTML = '';
    
    // Reset local chat history
    chatHistory = [
        ["Hello! I'm MediSense, your AI health assistant. How can I help you today?", ""]
    ];
    
    try {
        // Attempt to clear chat history on server via wrapper
        await window.gradioApi.clearChat();
        
        // Add initial message back to chat UI
        addBotMessage(chatHistory[0][0]);
    } catch (error) {
        // Error during clearChat is already logged by the wrapper
        // Optionally display a message, but might not be necessary
        console.error("Failed to clear chat history on server:", error);
        const errorElement = document.getElementById('chat-error');
        errorElement.textContent = "Could not clear server chat history. Local chat cleared.";
        errorElement.classList.remove('hidden');
        // Still add the bot message locally
        addBotMessage(chatHistory[0][0]);
    }
});
