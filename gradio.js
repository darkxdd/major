import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.14.0/dist/index.min.js";

const getGradioApiUrl = () => atob('cHVuZWV0aDEvRGlzZWFzZS1EcnVnLVJvQkVSVGEx');
const GRADIO_API_URL = getGradioApiUrl();

let apiClient = null;
let apiTested = false;
let apiWorking = false;
let connectionInProgress = false;

const API_ENDPOINTS = {
    PREDICT: "/predict_and_recommend",
    CHAT: "/chat_with_medisense",
    CLEAR_CHAT: "/clear_chat"
};

async function initGradioClient() {
    if (apiClient) return apiClient;
    if (connectionInProgress) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (!connectionInProgress) {
                    clearInterval(checkInterval);
                    if (apiClient) {
                        resolve(apiClient);
                    } else {
                        reject(new Error("Gradio API connection failed during wait."));
                    }
                }
            }, 100);
        });
    }

    connectionInProgress = true;

    try {
        apiClient = await Client.connect(GRADIO_API_URL);
        connectionInProgress = false;
        apiWorking = true;
        apiTested = true;
        return apiClient;
    } catch (error) {
        connectionInProgress = false;
        apiClient = null;
        apiWorking = false;
        apiTested = true;
        throw new Error(`Failed to connect to Gradio API. ${error.message}`);
    }
}

async function testGradioAPI(force = false) {
    if (apiTested && !force) {
        return apiWorking;
    }
    
    apiTested = false;
    apiWorking = false;
    
    try {
        const client = await initGradioClient();
        
        apiTested = true;
        apiWorking = true;
        document.dispatchEvent(new CustomEvent('gradioApiReady', { detail: { status: true } }));
        return true;
    } catch (error) {
        apiTested = true;
        apiWorking = false;
        document.dispatchEvent(new CustomEvent('gradioApiReady', { detail: { status: false, error: error } }));
        return false;
    }
}

async function predictDisease(symptoms) {
    if (!apiWorking && !(await testGradioAPI())) {
        throw new Error("Gradio API is not available. Please try again later.");
    }
    
    try {
        const client = await initGradioClient();
        const result = await client.predict(API_ENDPOINTS.PREDICT, { 
            text: symptoms 
        });

        if (!result || typeof result !== 'object' || !result.hasOwnProperty('data')) {
            throw new Error("Invalid response structure received from prediction API");
        }

        return result;
    } catch (error) {
        if (error.message.includes("connect") || error.message.includes("API is not available")) { 
            apiWorking = false;
            apiTested = false;
            if (typeof showApiError === 'function') {
                showApiError("Connection to AI service lost. Please check your connection or try again later.");
            }
        }
        throw error;
    }
}

async function sendChatMessage(message, history) {
    if (!apiWorking && !(await testGradioAPI())) {
        throw new Error("Gradio API is not available. Please try again later.");
    }
    
    try {
        const client = await initGradioClient();
        const result = await client.predict(API_ENDPOINTS.CHAT, { 
            user_message: message,
            history: history 
        });

        if (!result || typeof result !== 'object' || !result.hasOwnProperty('data')) {
            throw new Error("Invalid response structure received from chat API");
        }

        return result;
    } catch (error) {
        if (error.message.includes("connect") || error.message.includes("API is not available")) { 
            apiWorking = false;
            apiTested = false;
            if (typeof showApiError === 'function') {
                showApiError("Connection to AI service lost. Please check your connection or try again later.");
            }
        }
        throw error;
    }
}

async function clearChat() {
    if (!apiWorking && !(await testGradioAPI())) {
        return; 
    }
    
    try {
        const client = await initGradioClient();
        await client.predict(API_ENDPOINTS.CLEAR_CHAT, { history: [] });
    } catch (error) {
        if (error.message.includes("connect") || error.message.includes("API is not available")) { 
             apiWorking = false;
             apiTested = false;
             if (typeof showApiError === 'function') {
                 showApiError("Connection to AI service lost. Please check your connection or try again later.");
             }
        }
    }
}

window.gradioApi = {
    init: initGradioClient,
    test: testGradioAPI,
    predict: predictDisease,
    chat: sendChatMessage,
    clearChat: clearChat,
    getApiStatus: () => ({ tested: apiTested, working: apiWorking }),
    endpoints: API_ENDPOINTS
};

testGradioAPI().then(status => {
    document.dispatchEvent(new CustomEvent('gradioApiReady', { detail: { status: status } }));
}).catch(err => {
    document.dispatchEvent(new CustomEvent('gradioApiReady', { detail: { status: false, error: err } }));
});