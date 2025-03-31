// Disease Prediction & Drug Recommendation functionality

// Add event listener for symptoms input to hide/show info box
document.addEventListener('DOMContentLoaded', function() {
    const symptomsInput = document.getElementById('symptoms-input');
    const infoBox = document.getElementById('conditions-info-box');
    
    // Initial check in case there's already text in the field
    if (symptomsInput.value.trim() !== '') {
        infoBox.style.display = 'none';
    }
    
    // Add input event listener to check for text changes
    symptomsInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            infoBox.style.display = 'none';
        } else {
            infoBox.style.display = 'block';
        }
    });
});

// Handle prediction submission
document.getElementById('predict-btn').addEventListener('click', async function() {
    const symptomsInput = document.getElementById('symptoms-input').value.trim();
    const errorElement = document.getElementById('prediction-error');
    const loadingElement = document.getElementById('prediction-loading');
    const resultsElement = document.getElementById('prediction-results');
    
    // Clear previous results and errors
    errorElement.textContent = '';
    errorElement.classList.add('hidden');
    resultsElement.classList.add('hidden');
    
    // Validate input
    if (!symptomsInput) {
        errorElement.textContent = 'Please describe your symptoms';
        errorElement.classList.remove('hidden');
        return;
    }
    
    // Show loading spinner
    loadingElement.classList.remove('hidden');
    
    try {
        // Make the prediction using the API wrapper
        const result = await window.gradioApi.predict(symptomsInput);
        
        // Extract and format the data from result.data
        const conditionPredictions = extractConditionPredictions(result.data[0]);
        const predictedCondition = extractPredictedCondition(result.data[1]);
        const recommendedDrugs = extractRecommendedDrugs(result.data[2]);
        
        // Get verification from chat model
        const verifiedCondition = await getVerifiedCondition(symptomsInput);
        
        // Display results
        document.getElementById('condition-predictions').innerHTML = formatConditionPredictions(conditionPredictions);
        document.getElementById('primary-condition').textContent = verifiedCondition || predictedCondition;
        document.getElementById('drug-recommendations').innerHTML = formatRecommendedDrugs(recommendedDrugs);
        
        // Store prediction in history
        savePrediction(symptomsInput, verifiedCondition || predictedCondition);
        
        // Show results
        resultsElement.classList.remove('hidden');
    } catch (error) {
        console.error("Prediction error:", error);
        // Display user-friendly error message based on the error
        errorElement.textContent = error.message || "Error processing your request. Please try again later.";
        errorElement.classList.remove('hidden');
    } finally {
        // Hide loading spinner
        loadingElement.classList.add('hidden');
    }
});

// Function to get verified condition from chat model
async function getVerifiedCondition(symptoms) {
    try {
        // Create a prompt that asks for just the condition name
        const prompt = `Based on these symptoms, what is the most likely medical condition? Please respond with ONLY the condition name and nothing else: ${symptoms}`;
        
        // Create a temporary chat history for this verification
        const tempHistory = [];
        
        // Send the verification request to the chat model
        const result = await window.gradioApi.chat(prompt, tempHistory);
        
        // Extract the condition from the response
        if (result && result.data && Array.isArray(result.data) && 
            result.data.length > 0 && Array.isArray(result.data[0]) && 
            result.data[0].length > 0) {
            
            const fullUpdatedHistory = result.data[0];
            
            // Get the latest bot response
            if (fullUpdatedHistory.length > 0) {
                const latestTurn = fullUpdatedHistory[fullUpdatedHistory.length - 1];
                if (Array.isArray(latestTurn) && latestTurn.length > 1 && typeof latestTurn[1] === 'string') {
                    // Clean up the response to ensure it's just the condition name
                    let condition = latestTurn[1].trim();
                    
                    // Remove any extra text, keeping only the first line or sentence
                    condition = condition.split('\n')[0].split('.')[0].trim();
                    
                    console.log("Verified condition from chat model:", condition);
                    return condition;
                }
            }
        }
        
        return null; // Return null if verification failed
    } catch (error) {
        console.error("Verification error:", error);
        return null; // Return null if verification failed
    }
}

// Helper functions to extract data from HTML responses
function extractConditionPredictions(html) {
    const regex = /<strong style='color:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6});'>([^<]+)<\/strong>: ([0-9.]+)%/g;
    let match;
    const predictions = [];

    while ((match = regex.exec(html)) !== null) {
        predictions.push({
            condition: match[1].trim(),
            percentage: parseFloat(match[2]),
        });
    }

    return predictions;
}

function extractPredictedCondition(html) {
    const regex = /<p style='color:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}); font-size:1.2em; font-weight:bold;'>([^<]+)<\/p>/;
    const match = regex.exec(html);
    return match ? match[1].trim() : null;
}

function extractRecommendedDrugs(html) {
    const regex = /<strong style='color:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}); font-size:1.1em;'>([^<]+)<\/strong><br>Rating: <em style='color:#ffcc00;'>([0-9.]+)<\/em> from <em style='color:#ffcc00;'>([0-9]+)<\/em> reviews<br>Useful Votes: <em style='color:#ffcc00;'>([0-9]+)<\/em><br>Side Effects: <em style='color:#ffcc00;'>([^<]+)<\/em>/g;
    let match;
    const drugs = [];

    while ((match = regex.exec(html)) !== null) {
        drugs.push({
            drug: match[1].trim(),
            rating: parseFloat(match[2]),
            reviews: parseInt(match[3]),
            usefulVotes: parseInt(match[4]),
            sideEffects: match[5].trim(),
        });
    }

    return drugs;
}

// Helper functions to format data for display
function formatConditionPredictions(predictions) {
    return predictions.map(pred => 
        `<div class="prediction-item">
            <strong>${pred.condition}</strong>: ${pred.percentage}%
        </div>`
    ).join('');
}

function formatRecommendedDrugs(drugs) {
    return drugs.map(drug => 
        `<div class="drug-item">
            <strong>${drug.drug}</strong><br>
            Rating: ${drug.rating} (${drug.reviews} reviews)<br>
            Useful Votes: ${drug.usefulVotes}<br>
            Side Effects: ${drug.sideEffects}
        </div>`
    ).join('');
}

// Clear symptoms input
document.getElementById('clear-symptoms-btn').addEventListener('click', function() {
    document.getElementById('symptoms-input').value = '';
    document.getElementById('prediction-results').classList.add('hidden');
    document.getElementById('prediction-error').classList.add('hidden');
    
    // Show the info box again when clearing the input
    document.getElementById('conditions-info-box').style.display = 'block';
});

// Save prediction to local storage
function savePrediction(symptomsText, predictedCondition) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        console.error("Cannot save prediction: No user logged in");
        return;
    }
    
    // Get user's prediction history
    const userPredictions = getUserPredictions();
    
    // Add new prediction
    const timestamp = new Date().toISOString();
    userPredictions.predictions.unshift({
        timestamp: timestamp,
        symptoms: symptomsText,
        condition: predictedCondition
    });
    
    // Save updated prediction history
    saveUserPredictions(userPredictions);
}

// Get current user's prediction history
function getUserPredictions() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        console.error("Cannot get predictions: No user logged in");
        return { email: '', predictions: [] };
    }
    
    // Get all user predictions
    const allUserPredictions = JSON.parse(localStorage.getItem('userPredictions')) || [];
    
    // Find current user's predictions
    let userPredictions = allUserPredictions.find(up => up.email === currentUser.email);
    
    // If not found, create new entry
    if (!userPredictions) {
        userPredictions = {
            email: currentUser.email,
            predictions: []
        };
        allUserPredictions.push(userPredictions);
        localStorage.setItem('userPredictions', JSON.stringify(allUserPredictions));
    }
    
    return userPredictions;
}

// Save user's prediction history
function saveUserPredictions(userPredictions) {
    // Get all user predictions
    const allUserPredictions = JSON.parse(localStorage.getItem('userPredictions')) || [];
    
    // Find index of current user's predictions
    const index = allUserPredictions.findIndex(up => up.email === userPredictions.email);
    
    if (index !== -1) {
        // Update existing entry
        allUserPredictions[index] = userPredictions;
    } else {
        // Add new entry
        allUserPredictions.push(userPredictions);
    }
    
    // Save to local storage
    localStorage.setItem('userPredictions', JSON.stringify(allUserPredictions));
}
