// Cache DOM elements at module scope or within DOMContentLoaded
let symptomsInputElement, conditionsInfoBox, emergencyContactsBox, durationSelectElement, severitySelectElement,
    predictButton, clearSymptomsButton, predictionErrorElement, predictionLoadingElement,
    predictionResultsElement, conditionPredictionsDiv, primaryConditionP, 
    drugsComLinkButton, drugRecommendationsDiv;

document.addEventListener('DOMContentLoaded', function() {
    symptomsInputElement = document.getElementById('symptoms-input');
    conditionsInfoBox = document.getElementById('conditions-info-box');
    emergencyContactsBox = document.getElementById('emergency-contacts-box');
    durationSelectElement = document.getElementById('symptom-duration');
    severitySelectElement = document.getElementById('symptom-severity');
    predictButton = document.getElementById('predict-btn');
    clearSymptomsButton = document.getElementById('clear-symptoms-btn');
    predictionErrorElement = document.getElementById('prediction-error');
    predictionLoadingElement = document.getElementById('prediction-loading');
    predictionResultsElement = document.getElementById('prediction-results');
    conditionPredictionsDiv = document.getElementById('condition-predictions');
    primaryConditionP = document.getElementById('primary-condition');
    drugsComLinkButton = document.getElementById('drugs-com-link'); // Initial reference
    drugRecommendationsDiv = document.getElementById('drug-recommendations');

    if (symptomsInputElement && conditionsInfoBox) {
        if (symptomsInputElement.value.trim() !== '') {
            conditionsInfoBox.style.display = 'none';
            if (emergencyContactsBox) emergencyContactsBox.style.display = 'none';
        }
        
        symptomsInputElement.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                conditionsInfoBox.style.display = 'none';
                if (emergencyContactsBox) emergencyContactsBox.style.display = 'none';
            } else {
                conditionsInfoBox.style.display = 'block';
                if (emergencyContactsBox) emergencyContactsBox.style.display = 'block';
            }
        });
    }

    if (predictButton) {
        predictButton.addEventListener('click', handlePredictionSubmit);
    }

    if (clearSymptomsButton) {
        clearSymptomsButton.addEventListener('click', handleClearSymptoms);
    }
});

async function getCleanedGradioChatResponse(prompt) {
    const tempHistory = [];
    const result = await window.gradioApi.chat(prompt, tempHistory);

    if (result && result.data && Array.isArray(result.data) && 
        result.data.length > 0 && Array.isArray(result.data[0]) && 
        result.data[0].length > 0) {
        const fullUpdatedHistory = result.data[0];
        if (fullUpdatedHistory.length > 0) {
            const latestTurn = fullUpdatedHistory[fullUpdatedHistory.length - 1];
            if (Array.isArray(latestTurn) && latestTurn.length > 1 && typeof latestTurn[1] === 'string') {
                let responseText = latestTurn[1].trim();
                if (responseText.startsWith("```json")) {
                    responseText = responseText.substring(7);
                }
                if (responseText.endsWith("```")) {
                    responseText = responseText.substring(0, responseText.length - 3);
                }
                return responseText.trim();
            }
        }
    }
    return null; 
}

async function getVerifiedCondition(symptoms) {
    try {
        const prompt = `You are a medical diagnostic assistant responding to a user query about symptoms. Your response MUST be a JSON object. 

INSTRUCTIONS:
1. Analyze the following symptoms: ${symptoms}
2. If the symptoms are insufficient for making a reliable assessment, respond with a JSON object: {"error": "INSUFFICIENT_SYMPTOMS"}.
3. If the symptoms are sufficient, respond with a JSON object: {"condition": "[Most Likely Condition Name]"}.
4. Be precise with terminology, using the standard medical condition name.
5. Do not provide any disclaimers, explanations, questions, or additional context in the JSON values, other than what is specified.
6. Do not suggest seeking medical attention even if the condition seems serious.

Example for sufficient symptoms: {"condition": "Common Cold"}
Example for insufficient symptoms: {"error": "INSUFFICIENT_SYMPTOMS"}`;        
        
        const responseText = await getCleanedGradioChatResponse(prompt);
        
        if (responseText) {
            try {
                const jsonResponse = JSON.parse(responseText);
                if (jsonResponse.condition) {
                    let condition = jsonResponse.condition.trim();
                    condition = condition.split('\n')[0].split('.')[0].trim();
                    return condition;
                } else if (jsonResponse.error && jsonResponse.error === "INSUFFICIENT_SYMPTOMS") {
                    return "INSUFFICIENT_SYMPTOMS"; 
                }
            } catch (e) {
                // If JSON.parse fails, try to extract condition from plain text
                let condition = responseText.trim();
                condition = condition.split('\n')[0].split('.')[0].trim();
                // Basic validation: if it's too long or contains characters not typical for a condition name, it might be a full sentence.
                if (condition.length > 0 && condition.length < 50 && !condition.includes("{") && !condition.includes("}") && !condition.includes(":")) {
                    return condition;
                }
                console.error("Error parsing or validating condition response:", e, responseText);
            }
        }
        return null; 
    } catch (error) {
        console.error("Error in getVerifiedCondition:", error);
        return null; 
    }
}

async function getVerifiedConditionPredictions(symptoms) {
    try {
        const prompt = `You are a medical diagnostic assistant. Based on these symptoms: "${symptoms}", identify the 10 most likely medical conditions with their probability percentages. Your response MUST be a JSON object. 

Requirements for the JSON object:
1. The JSON object should have a single key "predictions".
2. The value of "predictions" should be an array of EXACTLY 10 prediction objects.
3. Each prediction object in the array must have two keys: "condition" (string) and "percentage" (number).
4. Assign a percentage likelihood to each condition. Percentages can include up to one decimal place (e.g., 0.5).
5. The sum of all percentages in the "predictions" array must be exactly 100.
6. Order the prediction objects in the array from highest to lowest percentage.
7. Only include medically plausible conditions given the symptoms.
8. Do not include any explanations, warnings, or disclaimers in the JSON values.

Format your response exactly like this example:
{
  "predictions": [
    {"condition": "Condition1", "percentage": 35},
    {"condition": "Condition2", "percentage": 25},
    {"condition": "Condition3", "percentage": 15},
    {"condition": "Condition4", "percentage": 8},
    {"condition": "Condition5", "percentage": 5},
    {"condition": "Condition6", "percentage": 4},
    {"condition": "Condition7", "percentage": 3},
    {"condition": "Condition8", "percentage": 2},
    {"condition": "Condition9", "percentage": 2},
    {"condition": "Condition10", "percentage": 1}
  ]
}

Do not deviate from this JSON format.`;
        
        const responseText = await getCleanedGradioChatResponse(prompt);

        if (responseText) {
            try {
                const jsonResponse = JSON.parse(responseText);
                if (jsonResponse.predictions && Array.isArray(jsonResponse.predictions)) {
                    const predictions = jsonResponse.predictions;
                    let totalPercentage = 0;

                    if (predictions.length !== 10) {
                        console.warn("API returned " + predictions.length + " predictions, expected 10.");
                    }

                    predictions.forEach(p => {
                        if (typeof p.condition === 'string' && typeof p.percentage === 'number') {
                            totalPercentage += p.percentage;
                        } else {
                            console.warn("Invalid prediction object format:", p);
                        }
                    });

                    if (Math.abs(totalPercentage - 100) > 1) { // Allowing a small tolerance for floating point issues
                        console.warn("Total percentage from API is " + totalPercentage + ", expected 100.");
                    }
                                        
                    return predictions.length > 0 ? predictions : null;
                } else {
                     console.warn("No 'predictions' array in JSON response:", jsonResponse);
                }
            } catch (e) {
                 console.error("Error parsing JSON for condition predictions:", e, responseText);
                 // Fallback for non-JSON (though prompt requests JSON)
                const lines = responseText.split('\n');
                const predictions = [];
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;
                    const match = trimmedLine.match(/(.+?):\s*(\d+(?:\.\d+)?)%/);
                    if (match) {
                        predictions.push({
                            condition: match[1].trim(),
                            percentage: parseFloat(match[2])
                        });
                    }
                }
                if (predictions.length > 0) {
                     return predictions;
                }
            }
        }
        return null; 
    } catch (error) {
        console.error("Error in getVerifiedConditionPredictions:", error);
        return null; 
    }
}

async function getVerifiedDrugs(condition) {
    try {
        const prompt = `You are a medical information assistant. For the medical condition "${condition}", provide a list of commonly recommended drugs which is rated high to low ranking use that to sort the drugs. Your response MUST be a JSON object.

Requirements for the JSON object:
1. The JSON object should have a single key "drug_recommendations".
2. The value of "drug_recommendations" should be an array of drug objects. Aim for 3-5 relevant drugs.
3. Each drug object in the array must have the following keys:
    - "drug_name" (string): The name of the drug.
    - "rating" (string): A string representing the drug's rating and number of reviews, formatted as "[NUMERIC_RATING] ([NUMBER_OF_REVIEWS] reviews)". Example: "4.5 (120 reviews)".
    - "useful_votes" (string): A string representing the number of useful votes. Example: "300".
    - "side_effects" (string): A comma-separated string listing common side effects. Example: "Nausea, Dizziness, Headache".
    - "notes" (string): Brief additional notes about the drug, its usage, or important considerations. Example: "Take with food to minimize stomach upset. Not recommended for pregnant women."
4. Only include relevant and commonly recognized drugs for the specified condition.
5. Do not include any explanations, warnings, or disclaimers in the JSON values, other than what is specified for the "notes" field.

Format your response exactly like this example:
{
  "drug_recommendations": [
    {
      "drug_name": "Amoxicillin",
      "rating": "4.7 (953 reviews)",
      "useful_votes": "529",
      "side_effects": "Diarrhea, Nausea, Rash",
      "notes": "Commonly prescribed antibiotic. Complete the full course as directed by your doctor."
    },
    {
      "drug_name": "Ibuprofen",
      "rating": "4.5 (541 reviews)",
      "useful_votes": "414",
      "side_effects": "Stomach pain, Heartburn, Nausea",
      "notes": "NSAID for pain and inflammation. Do not exceed recommended dosage."
    }
  ]
}

Do not deviate from this JSON format.`;

        const responseText = await getCleanedGradioChatResponse(prompt);

        if (responseText) {
            try {
                const jsonResponse = JSON.parse(responseText);
                if (jsonResponse.drug_recommendations && Array.isArray(jsonResponse.drug_recommendations)) {
                    return jsonResponse.drug_recommendations.map(drug => {
                        let ratingValue = null;
                        let reviewsCount = null;
                        const ratingMatch = drug.rating ? String(drug.rating).match(/(\d+(?:\.\d+)?)\s*\((\d+)\s*reviews\)/) : null;
                        if (ratingMatch) {
                            ratingValue = parseFloat(ratingMatch[1]);
                            reviewsCount = parseInt(ratingMatch[2]);
                        }
                        
                        let usefulVotesValue = null;
                        if (drug.useful_votes) {
                            usefulVotesValue = parseInt(String(drug.useful_votes).replace(/,/g, ''));
                        }

                        return {
                            drug: drug.drug_name,
                            rating: ratingValue,
                            reviews: reviewsCount,
                            usefulVotes: usefulVotesValue,
                            sideEffects: drug.side_effects,
                            notes: drug.notes
                        };
                    }).filter(d => d.drug); // Ensure drug name is present
                }
            } catch (e) {
                console.error("Error parsing JSON for drug recommendations:", e, responseText);
            }
        }
        return null;
    } catch (error) {
        console.error("Error in getVerifiedDrugs:", error);
        return null;
    }
}

// Encapsulate prediction logic in a separate function
async function handlePredictionSubmit() {
    let symptomsText = symptomsInputElement.value.trim(); // Use cached element
    // durationSelectElement and severitySelectElement are cached
    
    // Clear previous results and errors using cached elements
    if (predictionErrorElement) {
        predictionErrorElement.textContent = '';
        predictionErrorElement.classList.add('hidden');
    }
    if (predictionResultsElement) predictionResultsElement.classList.add('hidden');
    
    // Validate input
    if (!symptomsText) {
        if (predictionErrorElement) {
            predictionErrorElement.textContent = 'Please describe your symptoms';
            predictionErrorElement.classList.remove('hidden');
        }
        return;
    }
    
    // Append duration and severity to symptoms if selected
    if (durationSelectElement.value) {
        symptomsText += `. Duration: ${durationSelectElement.value}`;
    }
    
    if (severitySelectElement.value) {
        symptomsText += `. Severity: ${severitySelectElement.value}`;
    }
    
    // Show loading spinner using cached element
    if (predictionLoadingElement) predictionLoadingElement.classList.remove('hidden');
    
    try {
        // Make the prediction using the API wrapper
        // const result = await window.gradioApi.predict(symptomsInput); // Commented out
        
        // Extract and format the data from result.data
        // const modelConditionPredictions = extractConditionPredictions(result.data[0]); // Commented out
        // const predictedCondition = extractPredictedCondition(result.data[1]); // Commented out
        // const recommendedDrugs = extractRecommendedDrugs(result.data[2]); // Line removed as we use getVerifiedDrugs

        // Get verification from chat model for primary condition
        const verifiedCondition = await getVerifiedCondition(symptomsText);
        
        // Get verified condition predictions with percentages
        const verifiedConditionPredictions = await getVerifiedConditionPredictions(symptomsText);
        
        // Use verified predictions. If null, it means no reliable data was fetched.
        const conditionPredictions = verifiedConditionPredictions || []; // Default to empty array if null
        
        // Determine the condition to use for display, drugs, and history
        let displayCondition;
        let actualConditionForDisplayAndDrugs = null;

        if (verifiedCondition === "INSUFFICIENT_SYMPTOMS") {
            displayCondition = "Insufficient symptoms for a reliable assessment.";
            actualConditionForDisplayAndDrugs = null; 
        } else if (verifiedCondition) {
            displayCondition = verifiedCondition;
            actualConditionForDisplayAndDrugs = verifiedCondition;
        } else {
            displayCondition = "Condition could not be determined.";
            actualConditionForDisplayAndDrugs = null;
        }
        
        // Display results using cached elements
        if (conditionPredictionsDiv) conditionPredictionsDiv.innerHTML = formatConditionPredictions(conditionPredictions);
        if (primaryConditionP) primaryConditionP.textContent = displayCondition;
        
        // Get verified drugs for the determined condition
        let finalDrugRecommendations = [];
        if (actualConditionForDisplayAndDrugs) { // Only fetch if we have a specific condition
            const verifiedDrugs = await getVerifiedDrugs(actualConditionForDisplayAndDrugs);
            finalDrugRecommendations = verifiedDrugs || []; // Use verified drugs or empty array if null
        } else {
            finalDrugRecommendations = []; 
        }
        
        // Update drugs.com link - drugsComLinkButton is the initial cached button
        if (drugsComLinkButton) {
            const newDrugsComLink = drugsComLinkButton.cloneNode(true); // Clone to remove old listeners
            drugsComLinkButton.parentNode.replaceChild(newDrugsComLink, drugsComLinkButton);
            drugsComLinkButton = newDrugsComLink; // Update cached reference to the new button

            if (actualConditionForDisplayAndDrugs) {
                drugsComLinkButton.style.display = ''; 
                drugsComLinkButton.href = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(actualConditionForDisplayAndDrugs)}`;
                drugsComLinkButton.target = '_blank';
                drugsComLinkButton.addEventListener('click', function(e) {
                    e.preventDefault(); 
                    window.open(this.href, '_blank');
                });
            } else {
                drugsComLinkButton.style.display = 'none'; 
                drugsComLinkButton.href = '#'; 
            }
        }
        
        if (drugRecommendationsDiv) drugRecommendationsDiv.innerHTML = formatRecommendedDrugs(finalDrugRecommendations);
        
        // Store prediction in history
        savePrediction(symptomsText, displayCondition); // Use symptomsText (which has appended duration/severity)
        
        // Show results using cached element
        if (predictionResultsElement) predictionResultsElement.classList.remove('hidden');
    } catch (error) {
        console.error("Prediction error:", error);
        if (predictionErrorElement) {
            predictionErrorElement.textContent = error.message || "Error processing your request. Please try again later.";
            predictionErrorElement.classList.remove('hidden');
        }
    } finally {
        // Hide loading spinner using cached element
        if (predictionLoadingElement) predictionLoadingElement.classList.add('hidden');
        // Clear the server-side chat context that might have been set by prediction calls
        if (window.gradioApi && typeof window.gradioApi.clearChat === 'function') {
            try {
                await window.gradioApi.clearChat();
                
            } catch (clearError) {
                
            }
        }
    }
}

// Helper functions to format data for display
function formatConditionPredictions(predictions) {
    return predictions.map((pred, index) => 
        `<div class="prediction-item">
            <strong>${index + 1}. ${pred.condition}</strong>: ${pred.percentage.toFixed(1)}%
        </div>`
    ).join('');
}

function formatRecommendedDrugs(drugs) {
    if (!drugs || drugs.length === 0) {
        return '<p>No drug recommendations available for this condition at this time.</p>';
    }
    return drugs.map(drug => {
        let ratingDisplay = "N/A";
        if (drug.rating !== null && typeof drug.rating !== 'undefined' && drug.reviews !== null && typeof drug.reviews !== 'undefined') {
            ratingDisplay = `${Number(drug.rating).toFixed(1)} (${drug.reviews} reviews)`;
        } else if (drug.rating !== null && typeof drug.rating !== 'undefined') {
             ratingDisplay = `${Number(drug.rating).toFixed(1)}`;
        }

        const usefulVotesDisplay = (drug.usefulVotes !== null && typeof drug.usefulVotes !== 'undefined') ? drug.usefulVotes : "N/A";
        const sideEffectsDisplay = drug.sideEffects || "N/A";
        const notesDisplay = drug.notes ? `<br>Notes: ${drug.notes}` : "";

        return `<div class="drug-item">
            <strong>${drug.drug || "Unknown Drug"}</strong><br>
            Rating: ${ratingDisplay}<br>
            Useful Votes: ${usefulVotesDisplay}<br>
            Side Effects: ${sideEffectsDisplay}
            ${notesDisplay}
        </div>`;
    }).join('');
}

// Encapsulate clear symptoms logic
function handleClearSymptoms() {
    if (symptomsInputElement) {
        symptomsInputElement.value = '';
        if (conditionsInfoBox) conditionsInfoBox.style.display = 'block';
        if (emergencyContactsBox) emergencyContactsBox.style.display = 'block';
    }
    
    if (durationSelectElement) durationSelectElement.value = '';
    if (severitySelectElement) severitySelectElement.value = '';
    
    if (predictionResultsElement) predictionResultsElement.classList.add('hidden');
    if (predictionErrorElement) predictionErrorElement.classList.add('hidden');
}

// Save prediction to local storage
function savePrediction(symptomsText, predictedCondition) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Error handling is now in userData.js, but still good to return early.
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
