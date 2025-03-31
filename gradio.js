// Import the Gradio client library as an ES Module
import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1.14.0/dist/index.min.js";

/**
 * Gradio API wrapper for MediSense
 * Uses Client.connect() and object parameters based on working example.
 */

// The main Gradio API URL (use the base space URL)
const GRADIO_API_URL = "puneeth1/Disease-Drug-RoBERTa"; // Space name format for Client.connect

// Keep track of the client instance
let apiClient = null;
let apiTested = false;
let apiWorking = false;
let connectionInProgress = false;

// Store API endpoints (relative paths)
const API_ENDPOINTS = {
    PREDICT: "/predict_and_recommend",
    CHAT: "/chat_with_medisense",
    CLEAR_CHAT: "/clear_chat"
};

/**
 * Initialize the Gradio client using Client.connect()
 * @returns {Promise<Object>} The Gradio client instance
 */
async function initGradioClient() {
    if (apiClient) return apiClient;
    if (connectionInProgress) {
        // Wait for the existing connection attempt to finish
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
    console.log(`Initializing Gradio client with Client.connect('${GRADIO_API_URL}')...`);

    try {
        // Use the imported Client class directly
        apiClient = await Client.connect(GRADIO_API_URL);
        console.log("Gradio client initialized successfully via Client.connect()");
        connectionInProgress = false;
        return apiClient;
    } catch (error) {
        console.error("Error initializing Gradio client via Client.connect():", error);
        connectionInProgress = false;
        apiClient = null; // Reset client on failure
        throw error; // Re-throw the error to be caught by callers
    }
}

/**
 * Test the Gradio API connection
 * @param {boolean} force Force testing even if already tested
 * @returns {Promise<boolean>} Whether the API is working
 */
async function testGradioAPI(force = false) {
    if (apiTested && !force) {
        console.log(`API already tested. Status: ${apiWorking ? 'Working' : 'Not Working'}`);
        return apiWorking;
    }
    
    console.log("Testing Gradio API connection...");
    apiTested = false; // Mark as testing
    apiWorking = false; // Assume not working until proven otherwise
    
    try {
        const client = await initGradioClient(); // Attempt to initialize/get client
        
        // Optional: Try view_api() for more robust check, but connection itself is the main test
        // We'll make the connection itself the success criteria for now, given potential issues with view_api
        // try {
        //     const apiInfo = await client.view_api();
        //     console.log("Gradio API info retrieved:", apiInfo);
        // } catch (infoError) {
        //     console.warn("Could not get API info via view_api(), but connection likely succeeded:", infoError);
        // }
        
        apiTested = true;
        apiWorking = true;
        console.log("Gradio API connection test successful (init succeeded).");
        return true;
    } catch (error) {
        apiTested = true;
        apiWorking = false;
        console.error("Gradio API connection test failed:", error);
        return false;
    }
}

/**
 * Make a prediction using the Gradio API (using object parameter)
 * @param {string} symptoms The symptoms text
 * @returns {Promise<Object>} The prediction result object from Gradio
 */
async function predictDisease(symptoms) {
    if (!apiWorking && !(await testGradioAPI())) {
        throw new Error("Gradio API is not available. Please try again later.");
    }
    
    console.log(`Making prediction via API endpoint: ${API_ENDPOINTS.PREDICT}`);
    
    try {
        const client = await initGradioClient();
        // Use object format for parameters as per working example
        const result = await client.predict(API_ENDPOINTS.PREDICT, { 
            text: symptoms 
        });
        
        console.log("Prediction API raw result:", result);

        // Basic validation of expected Gradio structure
        if (!result || typeof result !== 'object' || !result.hasOwnProperty('data')) {
            throw new Error("Invalid response structure received from prediction API");
        }
        if (!Array.isArray(result.data) || result.data.length !== 3) {
             console.warn("Prediction API returned data array with unexpected length:", result.data.length);
             // Decide if this is a critical error or just a warning
             // throw new Error("Unexpected data format from prediction API (expected 3 items in data array)");
        }
        
        console.log("Prediction successful.");
        return result; // Return the full Gradio result object
    } catch (error) {
        console.error("Prediction API call failed:", error);
        if (error.message.includes("Could not connect")) { 
            apiWorking = false;
            apiTested = false; 
        }
        throw error; // Re-throw for handling in UI
    }
}

/**
 * Send a message to the chatbot using the Gradio API (using object parameters)
 * @param {string} message The user's message
 * @param {Array} history The chat history array
 * @returns {Promise<Object>} The chat response object from Gradio
 */
async function sendChatMessage(message, history) {
    if (!apiWorking && !(await testGradioAPI())) {
        throw new Error("Gradio API is not available. Please try again later.");
    }
    
    console.log(`Sending chat message via API endpoint: ${API_ENDPOINTS.CHAT}`);
    
    try {
        const client = await initGradioClient();
        // Use correct parameter names based on API docs

        // --- Add logging here ---
        console.log("*** Sending to Gradio API ***");
        console.log("Message:", message);
        console.log("History:", JSON.stringify(history)); // Stringify for better console readability
        // ----------------------

        const result = await client.predict(API_ENDPOINTS.CHAT, { 
            user_message: message, // Corrected key
            history: history 
        });
        
        console.log("Chat API raw result:", result);

        // Basic validation
        if (!result || typeof result !== 'object' || !result.hasOwnProperty('data')) {
            throw new Error("Invalid response structure received from chat API");
        }
         if (!Array.isArray(result.data) || result.data.length !== 2) {
             console.warn("Chat API returned data array with unexpected length:", result.data.length);
             // throw new Error("Unexpected data format from chat API (expected 2 items in data array)");
        }

        console.log("Chat message sent successfully.");
        return result; // Return the full Gradio result object
    } catch (error) {
        console.error("Chat API call failed:", error);
        if (error.message.includes("Could not connect")) { 
            apiWorking = false;
            apiTested = false;
        }
        throw error;
    }
}

/**
 * Clear the chat history using the Gradio API
 * @returns {Promise<void>}
 */
async function clearChat() {
    if (!apiWorking && !(await testGradioAPI())) {
        console.warn("Gradio API is not available. Cannot clear chat history on server.");
        return; 
    }
    
    console.log(`Clearing chat history via API endpoint: ${API_ENDPOINTS.CLEAR_CHAT}`);
    
    try {
        const client = await initGradioClient();
        // Send history parameter as per API docs, even if just an empty array
        await client.predict(API_ENDPOINTS.CLEAR_CHAT, { history: [] }); // Corrected payload
        console.log("Clear chat request sent successfully.");
    } catch (error) {
        console.error("Clear chat API call failed:", error);
        if (error.message.includes("Could not connect")) {
             apiWorking = false;
             apiTested = false;
        }
    }
}

// Export the API functions under window.gradioApi
// NOTE: Since this is a module, direct assignment to window might not be the standard way.
// However, for compatibility with existing non-module scripts (auth.js, etc.), we'll keep it.
// A better long-term solution would be to make all scripts modules or use a build tool.
window.gradioApi = {
    init: initGradioClient,
    test: testGradioAPI,
    predict: predictDisease,
    chat: sendChatMessage,
    clearChat: clearChat,
    getApiStatus: () => ({ tested: apiTested, working: apiWorking }),
    endpoints: API_ENDPOINTS
};

// Perform an initial test on script load
testGradioAPI().then(status => {
    console.log(`Initial Gradio API test completed. Status: ${status ? 'Working' : 'Failed'}`);
    // Trigger a custom event or use a callback if other modules need to know when the test is done
    document.dispatchEvent(new CustomEvent('gradioApiReady', { detail: { status: status } }));
}).catch(err => {
    console.error("Initial Gradio API test failed unexpectedly:", err);
    document.dispatchEvent(new CustomEvent('gradioApiReady', { detail: { status: false, error: err } }));
}); 