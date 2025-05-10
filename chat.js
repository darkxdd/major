// MediSense Chatbot functionality

// Initialize chat state
// Use sessionStorage instead of a variable to persist only during the current session
const DEFAULT_GREETING = "Hello! I'm MediSense, your AI health assistant. How can I help you today?";

// Create a module-level IIFE to encapsulate variables and prevent global scope pollution
const MediSenseChat = (function() {
    // Initialize chat history with proper error handling
    let chatHistory;
    try {
        const savedHistory = sessionStorage.getItem('chatHistory');
        chatHistory = savedHistory ? JSON.parse(savedHistory) : [[DEFAULT_GREETING, ""]];
        
        // Validate the structure of the loaded chat history
        if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
            // Reset to default if structure is invalid
            chatHistory = [[DEFAULT_GREETING, ""]];
        }
    } catch (error) {
        console.error("Error loading chat history from session storage:", error);
        chatHistory = [[DEFAULT_GREETING, ""]];
    }

    // Save chat history to session storage with error handling
    function saveChatHistory() {
        try {
            sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        } catch (error) {
            console.error("Error saving chat history to session storage:", error);
        }
    }

    // Add initial bot message to UI if API was available on load
    // This relies on the initial test in gradio.js
    function initializeChatUI() {
        // Get chat container element once
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            console.error("Chat messages container not found");
            return;
        }
        
        // Clear existing messages first - use safer method
        while (chatMessages.firstChild) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
        
        // If we have chat history from session storage, display all messages
        if (chatHistory.length > 0) {
            // Special case for the initial bot greeting message
            if (chatHistory[0]?.[0]?.includes("MediSense")) {
                // This is the initial bot greeting, display as bot message
                addBotMessage(chatHistory[0][0]);
                
                // Start from index 1 to skip the initial greeting when processing the rest
                for (let i = 1; i < chatHistory.length; i++) {
                    const [userMsg, botMsg] = chatHistory[i];
                    // If user message exists
                    if (userMsg?.trim()) {
                        addUserMessage(userMsg);
                    }
                    // If bot message exists
                    if (botMsg?.trim()) {
                        addBotMessage(botMsg);
                    }
                }
            } else {
                // Regular processing for non-initial messages
                chatHistory.forEach(([userMsg, botMsg]) => {
                    // If user message exists
                    if (userMsg?.trim()) {
                        addUserMessage(userMsg);
                    }
                    // If bot message exists
                    if (botMsg?.trim()) {
                        addBotMessage(botMsg);
                    }
                });
            }
        } else {
            // Just add the initial bot message
            addBotMessage(DEFAULT_GREETING);
        }
    }

    // Initialize the chat UI when the page loads
    function init() {
        // Always initialize the chat UI with the default message
        initializeChatUI();
        
        // Still log a warning if the API isn't available
        if (!window.gradioApi?.getApiStatus()?.working) {
            console.warn("Chat API not immediately available. Using default message only.");
        }
    }

    // Add user message to chat UI
    function addUserMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message; // No need to sanitize user messages as we use textContent
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Auto scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add bot message to chat UI with improved markdown processing
    function addBotMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        
        try {
            const parsedMessage = JSON.parse(message);
            // Check if it's the specific JSON structure we want to format
            if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage["Potential Condition(s)"]) {
                // Clear existing content in contentDiv if any (though it should be new)
                contentDiv.innerHTML = ''; 

                for (const key in parsedMessage) {
                    if (parsedMessage.hasOwnProperty(key)) {
                        const sectionDiv = document.createElement('div');
                        sectionDiv.className = 'bot-message-section';

                        const title = document.createElement('h3');
                        // Remove (s) and potential $1 issue, trim whitespace
                        title.textContent = key.replace(/\(\s*s\s*\)/gi, '').trim(); 
                        sectionDiv.appendChild(title);

                        const value = parsedMessage[key];
                        if (Array.isArray(value)) {
                            if (key === "Potential Condition(s)") {
                                value.forEach(condition => {
                                    const conditionDiv = document.createElement('div');
                                    conditionDiv.className = 'condition-item';
                                    
                                    const conditionTitle = document.createElement('h4'); // Changed from h5 to h4
                                    conditionTitle.className = 'condition-name-title'; // Added class for styling
                                    conditionTitle.textContent = condition.Condition;
                                    conditionDiv.appendChild(conditionTitle);

                                    const likelihood = document.createElement('p');
                                    likelihood.innerHTML = `<strong>Likelihood:</strong> ${condition.Likelihood}`;
                                    conditionDiv.appendChild(likelihood);

                                    const reasoning = document.createElement('p');
                                    reasoning.innerHTML = `<strong>Reasoning:</strong> ${condition.Reasoning}`;
                                    conditionDiv.appendChild(reasoning);
                                    
                                    sectionDiv.appendChild(conditionDiv);
                                });
                            } else {
                                const ul = document.createElement('ul');
                                ul.className = 'bot-message-list'; // Added class for styling
                                ul.style.listStylePosition = 'inside'; // Ensure bullets are inside
                                value.forEach(item => {
                                    const li = document.createElement('li');
                                    li.className = 'bot-message-list-item'; // Added class for styling
                                    // Basic handling for nested structures (can be expanded)
                                    if (typeof item === 'object' && item !== null && item.hasOwnProperty('point')) {
                                        li.textContent = item.point;
                                        if (item.hasOwnProperty('subpoints') && Array.isArray(item.subpoints)) {
                                            const subUl = document.createElement('ul');
                                            subUl.className = 'bot-message-sublist';
                                            item.subpoints.forEach(subItem => {
                                                const subLi = document.createElement('li');
                                                subLi.className = 'bot-message-sublist-item';
                                                subLi.textContent = subItem;
                                                subUl.appendChild(subLi);
                                            });
                                            li.appendChild(subUl);
                                        }
                                    } else {
                                        li.textContent = item;
                                    }
                                    ul.appendChild(li);
                                });
                                sectionDiv.appendChild(ul);
                            }
                        } else if (typeof value === 'string') {
                            const p = document.createElement('p');
                            p.textContent = value;
                            sectionDiv.appendChild(p);
                        }
                        contentDiv.appendChild(sectionDiv);
                    }
                }
            } else {
                // Not the specific JSON or not an object, display as plain text
                contentDiv.textContent = message;
            }
        } catch (error) {
            // Not JSON, display as plain text
            contentDiv.textContent = message;
        }

        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle sending a message with improved error handling and performance
    async function sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const errorElement = document.getElementById('chat-error');
        const loadingElement = document.getElementById('chat-loading');
        
        if (!chatInput || !errorElement || !loadingElement) {
            console.error("Required UI elements not found");
            return;
        }
        
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
            // Check if API is available
            if (!window.gradioApi) {
                throw new Error("Chat API is not available. Please refresh the page and try again.");
            }
            
            // Format the history for the API call - create a copy to avoid direct mutation
            const formattedHistory = [...chatHistory];
            
            // Add a timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timed out. Please try again.")), 30000);
            });
            
            // Send message using the API wrapper with timeout
            const result = await Promise.race([
                window.gradioApi.chat(message, formattedHistory),
                timeoutPromise
            ]);

            // Log the raw result at debug level
            console.log("Gradio API chat result:", result);
            
            // Validate the result structure
            if (!result || typeof result !== 'object') {
                throw new Error("Invalid response received from the chat API.");
            }
            
            if (!result.hasOwnProperty('data') || !Array.isArray(result.data) || result.data.length === 0) {
                throw new Error("Missing or invalid data in API response.");
            }
            
            // Expect result.data[0] = [ [user1, bot1], [user2, bot2], ... ] (full history)
            if (Array.isArray(result.data[0])) {
                // The backend is returning the full updated history in result.data[0]
                const fullUpdatedHistory = result.data[0];

                // Verification Log at debug level
                console.log("*** Received Full History from Backend: ***", JSON.stringify(fullUpdatedHistory));

                // Validate the history structure
                if (!Array.isArray(fullUpdatedHistory)) {
                    throw new Error("Received history is not in the expected format.");
                }

                // Replace local history with the full history from the backend
                chatHistory = fullUpdatedHistory;
                
                // Save to session storage
                saveChatHistory();

                // Get the latest bot response from the last turn in the received history
                if (chatHistory.length > 0) {
                    const latestTurn = chatHistory[chatHistory.length - 1];
                    // Check if the latest turn is valid and contains a bot message (string or array of strings)
                    if (Array.isArray(latestTurn) && latestTurn.length > 1 && (typeof latestTurn[1] === 'string' || Array.isArray(latestTurn[1]))) {
                        let botResponse = latestTurn[1];
                        // If the bot response is an array of strings, concatenate them
                        if (Array.isArray(botResponse)) {
                            botResponse = botResponse.join('');
                        }
                        // Add the latest bot message to UI
                        addBotMessage(botResponse);
                    } else {
                        console.error("Latest turn in received history has unexpected format or missing bot message:", latestTurn);
                        throw new Error("Received an unexpected format for the latest chat turn.");
                    }
                } else {
                    // Should not happen if data[0] is a non-empty array, but handle defensively
                    console.warn("Received history array from backend is empty.");
                    addBotMessage("I'm sorry, but I didn't receive a proper response. Please try again.");
                }
            } else {
                console.error("Invalid or unexpected response structure received from chat API (expected full history in data[0]):", result);
                // Fallback logic with improved structure
                let potentialResponse = "I'm sorry, but I received an invalid response structure. Please try again.";
                
                // Try to extract a usable response from various possible formats
                if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                    if (Array.isArray(result.data[0]) && result.data[0].length > 0 && typeof result.data[0][0] === 'string') {
                        potentialResponse = result.data[0][0];
                    } else if (typeof result.data[0] === 'string') {
                        potentialResponse = result.data[0];
                    }
                } else if (result.data && typeof result.data === 'string') {
                    potentialResponse = result.data;
                }
                
                // Display the best response we could find
                addBotMessage(potentialResponse);
                console.warn("Used fallback response handling due to unexpected API response format.");
            }
            
        } catch (error) {
            console.error("Chat error:", error);
            
            // Categorize errors for better user feedback
            let errorMessage = "";
            if (error.message.includes("timed out")) {
                errorMessage = "The request took too long to process. Please try again with a shorter message.";
            } else if (error.message.includes("network") || error.message.includes("connection")) {
                errorMessage = "Network connection issue. Please check your internet connection and try again.";
            } else if (error.message.includes("API")) {
                errorMessage = error.message || "The chat service is currently unavailable. Please try again later.";
            } else {
                errorMessage = error.message || "Error processing your request. Please try again later.";
            }
            
            // Avoid overwriting specific error messages thrown above if they exist
            if (!errorElement.textContent) { 
                errorElement.textContent = errorMessage;
            }
            errorElement.classList.remove('hidden');
            
            // Add a user-friendly message to the chat if there was an error
            if (chatHistory.length > 0 && !document.querySelector('.bot-message:last-child')) {
                addBotMessage("I'm sorry, but I encountered an error processing your request. Please try again later.");
            }
        } finally {
            // Hide loading indicator
            loadingElement.classList.add('hidden');
        }
    }

    // Function to clear chat history with improved error handling
    async function clearChatHistory() {
        // Clear UI safely
        const chatMessagesElement = document.getElementById('chat-messages');
        if (chatMessagesElement) {
            // Use safer DOM manipulation method
            while (chatMessagesElement.firstChild) {
                chatMessagesElement.removeChild(chatMessagesElement.firstChild);
            }
        }
        
        // Reset local chat history using the constant
        chatHistory = [
            [DEFAULT_GREETING, ""]
        ];
        
        // Update session storage
        saveChatHistory();
        
        try {
            // Check if API is available before attempting to clear
            if (window.gradioApi && typeof window.gradioApi.clearChat === 'function') {
                // Attempt to clear chat history on server via wrapper
                await window.gradioApi.clearChat();
            } else {
                console.warn("Gradio API not available for clearing chat history on server.");
            }
            
            // Add initial message back to chat UI
            addBotMessage(DEFAULT_GREETING);
        } catch (error) {
            // Error during clearChat is already logged by the wrapper
            console.error("Failed to clear chat history on server:", error);
            
            // Display error message if element exists
            const errorElement = document.getElementById('chat-error');
            if (errorElement) {
                errorElement.textContent = "Could not clear server chat history. Local chat cleared.";
                errorElement.classList.remove('hidden');
            }
            
            // Still add the bot message locally
            addBotMessage(DEFAULT_GREETING);
        }
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Send message button click handler
        const sendButton = document.getElementById('send-message-btn');
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
        
        // Send message on Enter key
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        // Clear chat button click handler
        const clearButton = document.getElementById('clear-chat-btn');
        if (clearButton) {
            clearButton.addEventListener('click', clearChatHistory);
        }
        
        // Clear chat history when the page is unloaded (browser close or refresh)
        window.addEventListener('beforeunload', function() {
            // We don't need to call clearChatHistory() here as that would try to update the UI
            // Just clear the session storage is sufficient
            sessionStorage.removeItem('chatHistory');
        });
    }
    
    // Public API
    return {
        init: function() {
            init();
            initEventListeners();
        },
        sendMessage,
        clearChatHistory,
        addUserMessage,
        addBotMessage
    };
})();

// Initialize the chat module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    MediSenseChat.init();
});
