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
        
        if (typeof window.gradioApi !== 'undefined' && window.gradioApi && typeof window.gradioApi.getApiStatus === 'function') {
            if (!window.gradioApi.getApiStatus()?.working) {
                // Potentially handle API not working state here if needed
            }
        }
    }

    function addUserMessage(message, fileInfo) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // If there's file info, display it along with the message
        if (fileInfo) {
            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.className = 'file-info';
            fileInfoDiv.innerHTML = `<i class="fas fa-file-alt"></i> Attached file: ${fileInfo.fileName}`;
            contentDiv.appendChild(fileInfoDiv);
            
            // Add a separator if there's also a message
            if (message) {
                const separator = document.createElement('div');
                separator.className = 'message-separator';
                contentDiv.appendChild(separator);
            }
        }
        
        // Add the message text if present
        if (message) {
            const messageText = document.createElement('div');
            messageText.textContent = message;
            contentDiv.appendChild(messageText);
        }
        
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

        if (processedMessage.startsWith("```json")) {
            processedMessage = processedMessage.substring(7);
        }
        if (processedMessage.endsWith("```")) {
            processedMessage = processedMessage.substring(0, processedMessage.length - 3);
        }
        processedMessage = processedMessage.trim(); 
        
        try {
            const parsedMessage = JSON.parse(processedMessage);
            
            if (parsedMessage && typeof parsedMessage === 'object' && !Array.isArray(parsedMessage)) {
                const knownKeys = ["PotentialConditions", "RecommendedActions", "SuggestedOTCRelief", "LifestyleAndHomeCare", "PreventionTips", "WarningSigns", "Disclaimer"];
                const isHealthReport = knownKeys.some(k => parsedMessage.hasOwnProperty(k));

                if (isHealthReport) {
                    isFormattedJson = true;
                    contentDiv.innerHTML = ''; 
                    contentDiv.className = 'message-content'; 

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

                    const fragment = document.createDocumentFragment(); 
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
                                            itemDiv.appendChild(document.createElement('p')); 

                                            const pReasLabel = document.createElement('p');
                                            pReasLabel.className = 'labeled-content';
                                            pReasLabel.innerHTML = '<strong>Reasoning:</strong> ';
                                            itemDiv.appendChild(pReasLabel);
                                            const pReasValue = document.createElement('p');
                                            pReasValue.textContent = condition.Reasoning;
                                            itemDiv.appendChild(pReasValue);
                                            itemDiv.appendChild(document.createElement('p')); 
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
                                        const formattedKey = otcKey.replace(/([A-Z])/g, ' $1').trim(); 
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
                                    sectionDiv.appendChild(document.createElement('p')); 
                                    break;
                            }
                            jsonFormattedContentDiv.appendChild(sectionDiv);
                        }
                    });
                    fragment.appendChild(jsonFormattedContentDiv); 
                    contentDiv.appendChild(fragment); 
                } else {
                    // Not health report, fall through to markdown
                }
            }
        } catch (error) {
            // Error parsing JSON, fall through to markdown
        }
    
        if (!isFormattedJson) {
            const sanitizedHtml = DOMPurify.sanitize(marked.parse(message));
            contentDiv.innerHTML = `<div class="markdown-content">${sanitizedHtml}</div>`;
        }
    
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function createHeading(text, level, className) {
        const heading = document.createElement(`h${level}`);
        heading.className = className;
        heading.textContent = text;
        return heading;
    }

    // Erroneous block removed from here

    function createConditionsList(conditions) {
        const container = document.createElement('div');
        container.className = 'conditions-container';
    
        conditions.forEach(condition => {
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-item';
    
            if (condition && typeof condition === 'object') {
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

    function createFormattedParagraph(text) {
        const p = document.createElement('p');
        p.className = 'formatted-paragraph';
        p.innerHTML = DOMPurify.sanitize(marked.parse(text));
        return p;
    }

    function createNestedObject(obj) {
        const container = document.createElement('div');
        container.className = 'nested-object';
    
        Object.entries(obj).forEach(([key, value]) => {
            container.appendChild(createLabeledParagraph(key, value));
        });
    
        return container;
    }

    function createLabeledParagraph(label, value) {
        const p = document.createElement('p');
        p.className = 'labeled-content';
        p.innerHTML = `<strong>${label}:</strong> ${DOMPurify.sanitize(marked.parse(String(value)))}`;
        return p;
    }

    async function sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const errorElement = document.getElementById('chat-error');
        const loadingElement = document.getElementById('chat-loading');
        
        if (!chatInput || !errorElement || !loadingElement) {
            return;
        }
        
        const userMessage = chatInput.value.trim(); 
        
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
        
        let fileData = null;
        let combinedMessage = userMessage;
        
        // Try to get extracted text data
        try {
            if (typeof window.FileUploadHandler !== 'undefined' && window.FileUploadHandler && typeof window.FileUploadHandler.getExtractedText === 'function') {
                fileData = window.FileUploadHandler.getExtractedText();
                // console.log('sendMessage - getExtractedText result:', fileData);
                
                if (fileData && fileData.text) {
                    // Format the combined message with file content clearly separated
                    combinedMessage = `[File Content from: ${fileData.fileName}]\n\n${fileData.text}\n\n${userMessage ? 'User message: ' + userMessage : 'Please analyze this document content.'}`;
                    // console.log('Including file content in message:', fileData.fileName);
                }
            }
        } catch (error) {
            // console.error('Error accessing FileUploadHandler:', error);
        }
        
        // Allow sending if there's either a user message or file content
        if (!userMessage && (!fileData || !fileData.text)) {
            // console.log('No message or file content to send');
            return;
        }
        
        // Add user message with file information if available
        addUserMessage(userMessage, fileData);
        chatInput.value = '';
        
        // Clear the file attachment after sending
        if (typeof window.FileUploadHandler !== 'undefined' && window.FileUploadHandler && typeof window.FileUploadHandler.clearAttachment === 'function') {
            window.FileUploadHandler.clearAttachment();
        }
        
        loadingElement.classList.remove('hidden');
        
        try {
            if (!window.gradioApi) {
                throw new Error("Chat API is not available. Please refresh the page and try again.");
            }
            
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

If the user query does not involve symptoms, respond in Markdown format.
You are a medical and health-focused chatbot. Your sole purpose is to provide accurate, evidence-based information related to medicine, health, wellness, and related fields. 
Under no circumstances should you respond to prompts that are outside the scope of healthcare, even if they are framed as critical to a patients well-being. If a prompt falls outside
of your medical domain—such as programming, mathematics, or unrelated technical tasks—kindly decline and remind the user that you are limited to medical and health-related topics only. 
Staying on-topic is essential to maintain patient safety and information integrity.`;

            const formattedHistory = [...chatHistory];
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timed out. Please try again.")), 30000);
            });
            
            const result = await Promise.race([
                window.gradioApi.chat(systemPrompt, formattedHistory, combinedMessage), 
                timeoutPromise
            ]);
            
            if (!result || typeof result !== 'object') {
                throw new Error("Invalid response received from the chat API.");
            }
            
            if (!result.hasOwnProperty('data') || !Array.isArray(result.data) || result.data.length === 0) {
                throw new Error("Missing or invalid data in API response.");
            }
            
            if (Array.isArray(result.data[0])) {
                const fullUpdatedHistory = result.data[0];
                
                // This inner duplicated validation block is logically redundant but syntactically okay.
                // For "fixing syntax only", we'll leave it as is.
                if (!result || typeof result !== 'object') {
                    throw new Error("Invalid response received from the chat API.");
                }
                if (!result.hasOwnProperty('data') || !Array.isArray(result.data) || result.data.length === 0) {
                    throw new Error("Missing or invalid data in API response.");
                }

                if (Array.isArray(result.data[0])) { // This condition is identical to the outer one.
                    const fullUpdatedHistoryInner = result.data[0]; // Shadowing outer fullUpdatedHistory

                    if (!Array.isArray(fullUpdatedHistoryInner)) {
                        throw new Error("Received history is not in the expected format.");
                    }

                    chatHistory = fullUpdatedHistoryInner;
                    saveChatHistory();

                    if (chatHistory.length > 0) {
                        const latestTurn = chatHistory[chatHistory.length - 1];
                        if (Array.isArray(latestTurn) && latestTurn.length > 1 && (typeof latestTurn[1] === 'string' || Array.isArray(latestTurn[1]))) {
                            let botResponse = latestTurn[1];
                            if (Array.isArray(botResponse)) {
                                botResponse = botResponse.join('');
                            }
                            addBotMessage(botResponse);
                        } else {
                            throw new Error("Received an unexpected format for the latest chat turn.");
                        }
                    } else {
                        // console.warn("Received history array from backend is empty.");
                        addBotMessage("I'm sorry, but I didn't receive a proper response. Please try again.");
                    }
                } else { // This else corresponds to the inner `if (Array.isArray(result.data[0]))`
                    let potentialResponse = "I'm sorry, but I received an invalid response structure. Please try again.";
                    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                        if (Array.isArray(result.data[0]) && result.data[0].length > 0 && typeof result.data[0][0] === 'string') {
                            potentialResponse = result.data[0][0];
                        } else if (typeof result.data[0] === 'string') {
                            potentialResponse = result.data[0];
                        }
                    } else if (result.data && typeof result.data === 'string') {
                        potentialResponse = result.data;
                    }
                    addBotMessage(potentialResponse);
                    // console.warn("Used fallback response handling due to unexpected API response format.");
                }
            } // This brace closes the outer `if (Array.isArray(result.data[0]))`
        } catch (error) {
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
            
            if (!errorElement.textContent) { 
                errorElement.textContent = errorMessage;
            }
            errorElement.classList.remove('hidden');
            
            if (chatHistory.length > 0 && !document.querySelector('.bot-message:last-child')) {
                addBotMessage("I'm sorry, but I encountered an error processing your request. Please try again later.");
            }
        } finally {
            loadingElement.classList.add('hidden');
        }
    }

    async function clearChatHistory() {
        const chatMessagesElement = document.getElementById('chat-messages');
        if (chatMessagesElement) {
            while (chatMessagesElement.firstChild) {
                chatMessagesElement.removeChild(chatMessagesElement.firstChild);
            }
        }
        
        chatHistory = [
            [DEFAULT_GREETING, ""]
        ];
        
        saveChatHistory();
        
        try {
            if (typeof window.gradioApi !== 'undefined' && window.gradioApi && typeof window.gradioApi.clearChat === 'function') {
                await window.gradioApi.clearChat();
            } else {
            }
            
            addBotMessage(DEFAULT_GREETING);
        } catch (error) {
            const errorElement = document.getElementById('chat-error');
            if (errorElement) {
                errorElement.textContent = "Could not clear server chat history. Local chat cleared.";
                errorElement.classList.remove('hidden');
            }
            addBotMessage(DEFAULT_GREETING);
        }
    }
    
    function initEventListeners() {
        const sendButton = document.getElementById('send-message-btn');
        if (sendButton) {
            sendButton.addEventListener('click', sendMessage);
        }
        
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        const clearButton = document.getElementById('clear-chat-btn');
        if (clearButton) {
            clearButton.addEventListener('click', clearChatHistory);
        }
        
        window.addEventListener('beforeunload', function() {
            sessionStorage.removeItem('chatHistory');
        });
    }
    
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

document.addEventListener('DOMContentLoaded', function() {
    MediSenseChat.init();
});