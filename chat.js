const DEFAULT_GREETING = "Hello! I'm MediSense, your AI health assistant. How can I help you today?";

const MediSenseChat = (function() {
    let chatHistory;
    try {
        const savedHistory = sessionStorage.getItem('chatHistory');
        chatHistory = savedHistory ? JSON.parse(savedHistory) : [[DEFAULT_GREETING, ""]];
        
        if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
            chatHistory = [[DEFAULT_GREETING, ""]];
        }
    } catch (error) {
        chatHistory = [[DEFAULT_GREETING, ""]];
    }

    function saveChatHistory() {
        try {
            sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        } catch (error) {
        }
    }

    function initializeChatUI() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            return;
        }
        
        while (chatMessages.firstChild) chatMessages.removeChild(chatMessages.firstChild);

        const isEffectivelyEmpty = chatHistory.length === 1 && chatHistory[0][0] === "" && chatHistory[0][1] === "";
        const startsWithCorrectGreeting = chatHistory.length > 0 && chatHistory[0][0] === DEFAULT_GREETING;

        if (isEffectivelyEmpty) {
            addBotMessage(DEFAULT_GREETING);
        } else if (!startsWithCorrectGreeting) {
            addBotMessage(DEFAULT_GREETING);
            chatHistory.forEach(([userMsg, botMsg]) => {
                if (userMsg?.trim()) addUserMessage(userMsg);
                if (botMsg?.trim()) addBotMessage(botMsg);
            });
        } else { // startsWithCorrectGreeting is true
            addBotMessage(chatHistory[0][0]);
            for (let i = 1; i < chatHistory.length; i++) {
                const [userMsg, botMsg] = chatHistory[i];
                if (userMsg?.trim()) addUserMessage(userMsg);
                if (botMsg?.trim()) addBotMessage(botMsg);
            }
        }
    }

    function init() {
        initializeChatUI();
        
        if (!window.gradioApi?.getApiStatus()?.working) {
        }
    }

    function addUserMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message; 
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    const MARKED_OPTIONS = {
        breaks: true,
        gfm: true,
        headerIds: false,
        mangle: false,
        smartLists: true,
        smartypants: true
    };
    
    const HEALTH_KEYS = [
        "Potential Condition(s)",
        "Recommended Actions",
        "Suggested Over-the-Counter Relief",
        "Lifestyle and Home Care Recommendations",
        "Prevention Tips", 
        "Warning Signs"
    ];
    
    function addBotMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
    
        marked.setOptions(MARKED_OPTIONS);
    
        let isFormattedJson = false;
        let processedMessage = message.trim();

        // Remove markdown code block markers if present
        if (processedMessage.startsWith("```json")) {
            processedMessage = processedMessage.substring(7);
        }
        if (processedMessage.endsWith("```")) {
            processedMessage = processedMessage.substring(0, processedMessage.length - 3);
        }
        processedMessage = processedMessage.trim(); // Trim again after potential modifications
        
        try {
            const parsedMessage = JSON.parse(processedMessage);
            
            if (parsedMessage && typeof parsedMessage === 'object' && !Array.isArray(parsedMessage)) {
                // Check if it's the specific health report format
                const knownKeys = ["PotentialConditions", "RecommendedActions", "SuggestedOTCRelief", "LifestyleAndHomeCare", "PreventionTips", "WarningSigns", "Disclaimer"];
                const isHealthReport = knownKeys.some(k => parsedMessage.hasOwnProperty(k));

                if (isHealthReport) {
                    isFormattedJson = true;
                    contentDiv.innerHTML = ''; // Clear existing content
                    contentDiv.className = 'message-content'; // Ensure base class is set

                    const sectionTitles = {
                        PotentialConditions: "Potential Condition",
                        RecommendedActions: "Recommended Actions",
                        SuggestedOTCRelief: "Suggested Over-the-Counter Relief",
                        LifestyleAndHomeCare: "Lifestyle and Home Care Recommendations",
                        PreventionTips: "Prevention Tips",
                        WarningSigns: "Warning Signs",
                        Disclaimer: "Disclaimer"
                    };

                    const sectionOrder = [
                        "PotentialConditions", "RecommendedActions", "SuggestedOTCRelief",
                        "LifestyleAndHomeCare", "PreventionTips", "WarningSigns", "Disclaimer"
                    ];

                    const jsonFormattedContentDiv = document.createElement('div');
                    jsonFormattedContentDiv.className = 'json-formatted-content';

                    sectionOrder.forEach(key => {
                        if (parsedMessage.hasOwnProperty(key)) {
                            const value = parsedMessage[key];
                            const sectionDiv = document.createElement('div');
                            sectionDiv.className = 'bot-message-section';

                            const titleH3 = document.createElement('h3');
                            titleH3.className = 'section-title';
                            titleH3.textContent = sectionTitles[key] || key;
                            sectionDiv.appendChild(titleH3);

                            switch (key) {
                                case "PotentialConditions":
                                    const conditionsContainer = document.createElement('div');
                                    conditionsContainer.className = 'conditions-container';
                                    if (Array.isArray(value)) {
                                        value.forEach(condition => {
                                            const itemDiv = document.createElement('div');
                                            itemDiv.className = 'condition-item';
                                            const nameH4 = document.createElement('h4');
                                            nameH4.className = 'condition-name-title';
                                            nameH4.textContent = condition.Name;
                                            itemDiv.appendChild(nameH4);

                                            const pLikeLabel = document.createElement('p');
                                            pLikeLabel.className = 'labeled-content';
                                            pLikeLabel.innerHTML = '<strong>Likelihood:</strong> ';
                                            itemDiv.appendChild(pLikeLabel);
                                            const pLikeValue = document.createElement('p');
                                            pLikeValue.textContent = condition.Likelihood;
                                            itemDiv.appendChild(pLikeValue);
                                            itemDiv.appendChild(document.createElement('p')); // Empty p

                                            const pReasLabel = document.createElement('p');
                                            pReasLabel.className = 'labeled-content';
                                            pReasLabel.innerHTML = '<strong>Reasoning:</strong> ';
                                            itemDiv.appendChild(pReasLabel);
                                            const pReasValue = document.createElement('p');
                                            pReasValue.textContent = condition.Reasoning;
                                            itemDiv.appendChild(pReasValue);
                                            itemDiv.appendChild(document.createElement('p')); // Empty p
                                            conditionsContainer.appendChild(itemDiv);
                                        });
                                    }
                                    sectionDiv.appendChild(conditionsContainer);
                                    break;

                                case "RecommendedActions":
                                case "LifestyleAndHomeCare":
                                case "PreventionTips":
                                    const ul = document.createElement('ul');
                                    ul.className = 'bot-message-list';
                                    if (Array.isArray(value)) {
                                        value.forEach(itemStr => {
                                            const li = document.createElement('li');
                                            li.className = 'bot-message-list-item';
                                            const p = document.createElement('p');
                                            p.textContent = itemStr;
                                            li.appendChild(p);
                                            ul.appendChild(li);
                                        });
                                    }
                                    sectionDiv.appendChild(ul);
                                    break;

                                case "WarningSigns":
                                    const wsUl = document.createElement('ul');
                                    wsUl.className = 'bot-message-list';
                                    // Preamble based on theme.html
                                    const preambleLi = document.createElement('li');
                                    preambleLi.className = 'bot-message-list-item';
                                    const preambleP = document.createElement('p');
                                    preambleP.textContent = "Seek immediate emergency medical care if you experience any of the following:";
                                    preambleLi.appendChild(preambleP);
                                    wsUl.appendChild(preambleLi);

                                    if (Array.isArray(value)) {
                                        value.forEach(itemStr => {
                                            const outerLi = document.createElement('li');
                                            outerLi.className = 'bot-message-list-item';
                                            const innerUl = document.createElement('ul');
                                            const innerLi = document.createElement('li');
                                            innerLi.textContent = itemStr;
                                            innerUl.appendChild(innerLi);
                                            outerLi.appendChild(innerUl);
                                            wsUl.appendChild(outerLi);
                                        });
                                    }
                                    sectionDiv.appendChild(wsUl);
                                    break;

                                case "SuggestedOTCRelief":
                                    const otcUl = document.createElement('ul');
                                    otcUl.className = 'bot-message-list';
                                    Object.entries(value).forEach(([otcKey, otcValue]) => {
                                        const li = document.createElement('li');
                                        li.className = 'bot-message-list-item';
                                        const p = document.createElement('p');
                                        let textContent = '';
                                        const formattedKey = otcKey.replace(/([A-Z])/g, ' $1').trim(); // e.g., PainRelievers -> Pain Relievers
                                        if (otcKey === 'Note') {
                                            textContent = `Note: ${otcValue}`;
                                        } else {
                                            textContent = `${formattedKey}: ${Array.isArray(otcValue) ? otcValue.join(', ') : otcValue}`;
                                        }
                                        p.textContent = textContent;
                                        li.appendChild(p);
                                        otcUl.appendChild(li);
                                    });
                                    sectionDiv.appendChild(otcUl);
                                    break;

                                case "Disclaimer":
                                    const pEmptyFormatted = document.createElement('p');
                                    pEmptyFormatted.className = 'formatted-paragraph';
                                    sectionDiv.appendChild(pEmptyFormatted);
                                    const pDisclaimer = document.createElement('p');
                                    pDisclaimer.textContent = value;
                                    sectionDiv.appendChild(pDisclaimer);
                                    sectionDiv.appendChild(document.createElement('p')); // Empty p
                                    break;
                            }
                            jsonFormattedContentDiv.appendChild(sectionDiv);
                        }
                    });
                    contentDiv.appendChild(jsonFormattedContentDiv);
                } else {
                    // It's an object, but not the specific health report, treat as generic JSON or fallback
                    // For now, let it fall through to markdown rendering if not specifically handled.
                    // console.log("Object message, but not recognized health report structure.");
                }
            }
        } catch (error) {
            
        }
    
        // If not JSON or no health data, render as markdown
        if (!isFormattedJson) {
            // Use the original message for markdown rendering if JSON parsing failed
            // or if it wasn't health data, to avoid showing a stripped version.
            const sanitizedHtml = DOMPurify.sanitize(marked.parse(message));
            // Add wrapper class for consistent styling
            contentDiv.innerHTML = `<div class="markdown-content">${sanitizedHtml}</div>`;
        }
    
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Helper function to create formatted condition list
    function createConditionsList(conditions) {
        const container = document.createElement('div');
        container.className = 'conditions-container';
    
        conditions.forEach(condition => {
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-item';
    
            if (condition && typeof condition === 'object') {
                // Handle structured condition object
                const fields = {
                    'Condition': ['condition', 'Condition', 'name', 'Name'],
                    'Likelihood': ['likelihood', 'Likelihood', 'probability', 'Probability'],
                    'Reasoning': ['reasoning', 'Reasoning', 'explanation', 'Explanation']
                };
    
                Object.entries(fields).forEach(([label, keys]) => {
                    const value = keys.reduce((val, key) => val || condition[key], null);
                    if (value) {
                        const element = label === 'Condition' ? 
                            createHeading(value, 4, 'condition-name-title') :
                            createLabeledParagraph(label, value);
                        conditionDiv.appendChild(element);
                    }
                });
            } else if (typeof condition === 'string') {
                conditionDiv.appendChild(createHeading(condition, 4, 'condition-name-title'));
            }
    
            container.appendChild(conditionDiv);
        });
    
        return container;
    }

    // Helper function to create formatted list
    function createFormattedList(items) {
        const ul = document.createElement('ul');
        ul.className = 'bot-message-list';
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'bot-message-list-item';
    
            if (item && typeof item === 'object') {
                if (item.point || item.Point) {
                    li.innerHTML = DOMPurify.sanitize(marked.parse(item.point || item.Point));
                    
                    const subpoints = item.subpoints || item.Subpoints;
                    if (Array.isArray(subpoints)) {
                        li.appendChild(createSubpointsList(subpoints));
                    }
                } else {
                    li.textContent = JSON.stringify(item, null, 2);
                }
            } else {
                li.innerHTML = DOMPurify.sanitize(marked.parse(String(item)));
            }
            
            ul.appendChild(li);
        });
    
        return ul;
    }

    // Helper function to create subpoints list
    function createSubpointsList(subpoints) {
        const subUl = document.createElement('ul');
        subUl.className = 'bot-message-sublist';
        
        subpoints.forEach(subpoint => {
            const subLi = document.createElement('li');
            subLi.className = 'bot-message-sublist-item';
            subLi.innerHTML = DOMPurify.sanitize(marked.parse(String(subpoint)));
            subUl.appendChild(subLi);
        });
    
        return subUl;
    }

    // Helper function to create formatted paragraph
    function createFormattedParagraph(text) {
        const p = document.createElement('p');
        p.className = 'formatted-paragraph';
        p.innerHTML = DOMPurify.sanitize(marked.parse(text));
        return p;
    }

    // Helper function to create nested object
    function createNestedObject(obj) {
        const container = document.createElement('div');
        container.className = 'nested-object';
    
        Object.entries(obj).forEach(([key, value]) => {
            container.appendChild(createLabeledParagraph(key, value));
        });
    
        return container;
    }

    // Helper function to create labeled paragraph
    function createLabeledParagraph(label, value) {
        const p = document.createElement('p');
        p.className = 'labeled-content';
        p.innerHTML = `<strong>${label}:</strong> ${DOMPurify.sanitize(marked.parse(String(value)))}`;
        return p;
    }

    // Helper function to create heading
    function createHeading(text, level, className) {
        const heading = document.createElement(`h${level}`);
        heading.className = className;
        heading.textContent = text;
        return heading;
    }

    // Handle sending a message with improved error handling
    async function sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const errorElement = document.getElementById('chat-error');
        const loadingElement = document.getElementById('chat-loading');
        
        if (!chatInput || !errorElement || !loadingElement) {
            
            return;
        }
        
        const userMessage = chatInput.value.trim(); // Renamed for clarity
        
        // Clear previous errors
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
        
        // Validate input
        if (!userMessage) {
            return;
        }
        
        // Add user message to UI
        addUserMessage(userMessage);
        
        // Clear input
        chatInput.value = '';
        
        // Show loading indicator
        loadingElement.classList.remove('hidden');
        
        try {
            // Check if API is available
            if (!window.gradioApi) {
                throw new Error("Chat API is not available. Please refresh the page and try again.");
            }
            
            // Construct the prompt for the AI model
            const systemPrompt = `You are a helpful AI assistant. The user's query is: ${userMessage}
When the user provides symptoms, your response MUST be a JSON object with the following structure:
{
  "PotentialConditions": [
    {
      "Name": "Sinusitis (Acute or Chronic)",
      "Likelihood": "High",
      "Reasoning": "Pain and pressure in the forehead, cheeks, and under the eyes are classic symptoms associated with inflammation or infection of the sinus cavities located in these areas."
    },
    {
      "Name": "Tension Headache",
      "Likelihood": "Moderate",
      "Reasoning": "Tension headaches can cause pressure, often described as a band around the head or pressure in the forehead, though less commonly affects the cheeks and under the eyes specifically."
    },
    {
      "Name": "Migraine",
      "Likelihood": "Low",
      "Reasoning": "While migraines can sometimes cause facial pain, the description of 'pressure' and the specific locations (under eyes, cheeks) are less typical than the throbbing, often unilateral pain associated with migraines."
    },
    {
      "Name": "Dental Abscess or Infection",
      "Likelihood": "Low",
      "Reasoning": "Infections in the upper teeth can sometimes cause pain that radiates to the cheek or under the eye area, but the description of pressure across multiple areas (forehead, cheeks, under eyes) makes this less likely as the primary cause unless multiple teeth are involved."
    }
  ],
  "RecommendedActions": [
    "Consult a doctor: It is important to see a healthcare professional for an accurate diagnosis, especially if symptoms are severe, persistent (lasting more than a week to 10 days), worsening, or accompanied by fever.",
    "Describe your symptoms clearly: Be prepared to tell your doctor about the location, nature, severity, duration, and any other associated symptoms.",
    "Follow medical advice: Adhere strictly to any treatment plan prescribed by your doctor."
  ],
  "SuggestedOTCRelief": {
    "PainRelievers": [
      "Paracetamol (e.g., Crocin, Dolo)",
      "Ibuprofen (e.g., Brufen, Combiflam)"
    ],
    "Decongestants": [
      "Nasal sprays (e.g., Otrivin, Nasivion - use with caution and only for a few days to avoid rebound congestion)",
      "Oral decongestants"
    ],
    "Note": "Always follow the dosage instructions on the packaging and consult a pharmacist or doctor, especially if you have other health conditions or are taking other medications. Availability and specific brand names may vary by location within India."
  },
  "LifestyleAndHomeCare": [
    "Steam Inhalation: Inhaling steam from a bowl of hot water (with a towel over your head) or taking a hot shower can help open nasal passages and relieve pressure.",
    "Warm Compresses: Applying a warm, moist cloth to your face (forehead, cheeks, around the eyes) several times a day can help ease pain.",
    "Stay Hydrated: Drink plenty of fluids like water, juice, or clear broth. This helps thin mucus.",
    "Rest: Get adequate rest to help your body recover."
  ],
  "PreventionTips": [
    "Manage Allergies: If allergies contribute to sinus issues, work with a doctor to manage them effectively.",
    "Avoid Irritants: Stay away from cigarette smoke, strong perfumes, and other airborne irritants.",
    "Practice Good Hygiene: Wash hands frequently to prevent infections.",
    "Use a Humidifier: Keeping the air moist, especially during dry seasons or in heated rooms, can help prevent sinus congestion."
  ],
  "WarningSigns": [
    "Severe headache or facial pain that comes on suddenly or is unbearable.",
    "High fever (above 102°F or 39°C).",
    "Vision changes (e.g., double vision, decreased vision, swelling or redness around the eyes).",
    "Swelling or redness around the eyes or cheeks that is rapidly worsening.",
    "Stiff neck.",
    "Confusion or difficulty staying awake."
  ],
  "Disclaimer": "This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment."
}

If the user query does not involve symptoms, respond in Markdown format.`;

            // Format the history for the API call - create a copy to avoid direct mutation
            const formattedHistory = [...chatHistory];
            
            // Add a timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timed out. Please try again.")), 30000);
            });
            
            // Send message using the API wrapper with timeout
            const result = await Promise.race([
                window.gradioApi.chat(systemPrompt, formattedHistory), // Use systemPrompt here
                timeoutPromise
            ]);

            // Log the raw result at debug level
            
            
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
                        
                        throw new Error("Received an unexpected format for the latest chat turn.");
                    }
                } else {
                    // Should not happen if data[0] is a non-empty array, but handle defensively
                    console.warn("Received history array from backend is empty.");
                    addBotMessage("I'm sorry, but I didn't receive a proper response. Please try again.");
                }
            } else {
                
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