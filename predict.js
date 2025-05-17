document.addEventListener('DOMContentLoaded', function() {
    const symptomsInput = document.getElementById('symptoms-input');
    const infoBox = document.getElementById('conditions-info-box');
    
    if (symptomsInput.value.trim() !== '') {
        infoBox.style.display = 'none';
    }
    
    symptomsInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            infoBox.style.display = 'none';
        } else {
            infoBox.style.display = 'block';
        }
    });
});

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
                    // Remove markdown code block markers if present
                    if (responseText.startsWith("```json")) {
                        responseText = responseText.substring(7);
                    }
                    if (responseText.endsWith("```")) {
                        responseText = responseText.substring(0, responseText.length - 3);
                    }
                    responseText = responseText.trim(); // Trim again after potential modifications
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
                        let condition = latestTurn[1].trim();
                        condition = condition.split('\n')[0].split('.')[0].trim();
                        return condition; 
                    }
                }
            }
        }
        
        return null; 
    } catch (error) {
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
                    // Remove markdown code block markers if present
                    if (responseText.startsWith("```json")) {
                        responseText = responseText.substring(7);
                    }
                    if (responseText.endsWith("```")) {
                        responseText = responseText.substring(0, responseText.length - 3);
                    }
                    responseText = responseText.trim(); // Trim again after potential modifications
                    try {
                        const jsonResponse = JSON.parse(responseText);
                        if (jsonResponse.predictions && Array.isArray(jsonResponse.predictions)) {
                            const predictions = jsonResponse.predictions;
                            let totalPercentage = 0;

                            if (predictions.length !== 10) {
                            }

                            predictions.forEach(p => {
                                if (typeof p.condition === 'string' && typeof p.percentage === 'number') {
                                    totalPercentage += p.percentage;
                                } else {
                                }
                            });

                            if (Math.abs(totalPercentage - 100) > 1) { 
                            }
                            
                            
                            return predictions.length > 0 ? predictions : null;
                        } else {
                        }
                    } catch (e) {
                        const lines = responseText.split('\n');
                        const predictions = [];
                        let totalPercentage = 0;
                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (!trimmedLine) continue;
                            const match = trimmedLine.match(/(.+?):\s*(\d+(?:\.\d+)?)%/);
                            if (match) {
                                predictions.push({
                                    condition: match[1].trim(),
                                    percentage: parseFloat(match[2])
                                });
                                totalPercentage += parseFloat(match[2]);
                            } else {
                            }
                        }
                        if (predictions.length > 0) {
                             return predictions;
                        }
                    }
                }
            }
        }
        
        return null; 
    } catch (error) {
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
                    // Remove markdown code block markers if present
                    if (responseText.startsWith("```json")) {
                        responseText = responseText.substring(7);
                    }
                    if (responseText.endsWith("```")) {
                        responseText = responseText.substring(0, responseText.length - 3);
                    }
                    responseText = responseText.trim(); // Trim again after potential modifications
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
                        return null;
                    }
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error in getVerifiedDrugs:", error);
        return null;
    }
}

// Handle prediction submission
document.getElementById('predict-btn').addEventListener('click', async function() {
    let symptomsInput = document.getElementById('symptoms-input').value.trim();
    const durationSelect = document.getElementById('symptom-duration');
    const severitySelect = document.getElementById('symptom-severity');
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
    
    // Append duration and severity to symptoms if selected
    if (durationSelect.value) {
        symptomsInput += `. Duration: ${durationSelect.value}`;
    }
    
    if (severitySelect.value) {
        symptomsInput += `. Severity: ${severitySelect.value}`;
    }
    
    // Show loading spinner
    loadingElement.classList.remove('hidden');
    
    try {
        // Make the prediction using the API wrapper
        const result = await window.gradioApi.predict(symptomsInput);
        
        // Extract and format the data from result.data
        const modelConditionPredictions = extractConditionPredictions(result.data[0]);
        const predictedCondition = extractPredictedCondition(result.data[1]);
        // const recommendedDrugs = extractRecommendedDrugs(result.data[2]); // Line removed as we use getVerifiedDrugs

        // Get verification from chat model for primary condition
        const verifiedCondition = await getVerifiedCondition(symptomsInput);
        
        // Get verified condition predictions with percentages
        const verifiedConditionPredictions = await getVerifiedConditionPredictions(symptomsInput);
        
        // Use verified predictions if available, otherwise use model predictions
        const conditionPredictions = verifiedConditionPredictions || modelConditionPredictions;
        
        // Determine the condition to use for display, drugs, and history
        let displayCondition;
        let actualConditionForDisplayAndDrugs = null;

        if (verifiedCondition === "INSUFFICIENT_SYMPTOMS") {
            displayCondition = "Insufficient symptoms for a reliable assessment.";
            actualConditionForDisplayAndDrugs = null; // No specific condition for drugs/history
        } else if (verifiedCondition) {
            displayCondition = verifiedCondition;
            actualConditionForDisplayAndDrugs = verifiedCondition;
        } else if (predictedCondition) {
            displayCondition = predictedCondition;
            actualConditionForDisplayAndDrugs = predictedCondition;
        } else {
            displayCondition = "Condition could not be determined.";
            actualConditionForDisplayAndDrugs = null;
        }
        
        // Display results
        document.getElementById('condition-predictions').innerHTML = formatConditionPredictions(conditionPredictions);
        document.getElementById('primary-condition').textContent = displayCondition;
        
        // Get verified drugs for the determined condition
        let finalDrugRecommendations = [];
        if (actualConditionForDisplayAndDrugs) { // Only fetch if we have a specific condition
            const verifiedDrugs = await getVerifiedDrugs(actualConditionForDisplayAndDrugs);
            finalDrugRecommendations = verifiedDrugs || []; // Use verified drugs or empty array if null
        } else {
            // If no actual condition, we might still want to clear or hide old drug recommendations
            // For now, finalDrugRecommendations remains empty, leading to "No drug recommendations" message by formatRecommendedDrugs
        }
        
        // Update drugs.com link
        const drugsComLink = document.getElementById('drugs-com-link');
        const newDrugsComLink = drugsComLink.cloneNode(true); // Clone to remove old listeners
        drugsComLink.parentNode.replaceChild(newDrugsComLink, drugsComLink);

        if (actualConditionForDisplayAndDrugs) {
            newDrugsComLink.style.display = ''; // Make it visible
            newDrugsComLink.href = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(actualConditionForDisplayAndDrugs)}`;
            newDrugsComLink.target = '_blank';
            // Re-attach event listener if it was doing more than just opening a link, or if preferred for consistency
            newDrugsComLink.addEventListener('click', function(e) {
                 e.preventDefault(); 
                 window.open(this.href, '_blank');
            });
        } else {
            newDrugsComLink.style.display = 'none'; // Hide if no condition
            newDrugsComLink.href = '#'; // Reset href
        }
        
        document.getElementById('drug-recommendations').innerHTML = formatRecommendedDrugs(finalDrugRecommendations);
        
        // Store prediction in history
        savePrediction(symptomsInput, displayCondition); // Save the displayed condition
        
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
        // Clear the server-side chat context that might have been set by prediction calls
        if (window.gradioApi && typeof window.gradioApi.clearChat === 'function') {
            try {
                await window.gradioApi.clearChat();
                
            } catch (clearError) {
                
            }
        }
    }
});

// Helper functions to extract data from HTML responses using DOMParser
function extractConditionPredictions(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const predictions = [];
    // Assuming the structure is simple divs or similar containing the strong tag and text
    // This selector might need adjustment based on the actual HTML structure
    doc.querySelectorAll('body > *').forEach(element => {
        const strongTag = element.querySelector('strong');
        if (strongTag) {
            const textContent = element.textContent || '';
            const match = textContent.match(/:\s*([0-9.]+)%/);
            if (match) {
                predictions.push({
                    condition: strongTag.textContent.trim(),
                    percentage: parseFloat(match[1]),
                });
            }
        }
    });
    // Sort by percentage descending if needed (assuming API doesn't guarantee order)
    predictions.sort((a, b) => b.percentage - a.percentage);
    return predictions;
}

function extractPredictedCondition(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    // Assuming the condition is in a specific paragraph tag
    const pTag = doc.querySelector('p[style*="font-weight:bold"]');
    return pTag ? pTag.textContent.trim() : null;
}

function extractRecommendedDrugs(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const drugs = [];
    // Convert NodeList to Array to safely use array methods and to have a stable list
    const potentialDrugTitleTags = Array.from(doc.querySelectorAll('strong[style*="font-size:1.1em"]'));

    potentialDrugTitleTags.forEach((strongTag, index) => {
        const currentDrugEMs = [];
        let currentNode = strongTag.nextSibling; // Start searching from the node immediately after the strongTag

        while (currentNode) {
            // Stop condition 1: Reached the next identified drug title tag
            if (index + 1 < potentialDrugTitleTags.length && currentNode === potentialDrugTitleTags[index + 1]) {
                break;
            }

            // Stop condition 2: Encountered another strong tag that wasn't in our initial list of drug titles.
            // This is a heuristic to prevent reading too far if the structure is unexpected.
            if (currentNode.nodeType === Node.ELEMENT_NODE && currentNode.nodeName === 'STRONG' && !potentialDrugTitleTags.includes(currentNode)) {
                break;
            }
            
            // Collect relevant EM tags
            if (currentNode.nodeType === Node.ELEMENT_NODE && currentNode.matches('em[style*="color:#ffcc00"]')) {
                currentDrugEMs.push(currentNode);
            }
            
            // Optimization: if we've found 4 EM tags for the current drug, we can stop searching for this drug.
            if (currentDrugEMs.length >= 4) {
                break; 
            }
            
            currentNode = currentNode.nextSibling;
        }

        if (currentDrugEMs.length >= 4) {
            try {
                drugs.push({
                    drug: strongTag.textContent.trim().replace(/:$/, ''), // Remove trailing colon if present
                    rating: parseFloat(currentDrugEMs[0].textContent),
                    reviews: parseInt(currentDrugEMs[1].textContent.replace(/,/g, '')), // Remove commas from numbers
                    usefulVotes: parseInt(currentDrugEMs[2].textContent.replace(/,/g, '')), // Remove commas from numbers
                    sideEffects: currentDrugEMs[3].textContent.trim(),
                });
            } catch (e) {
                console.error("Error parsing drug element for:", strongTag.textContent.trim(), e, currentDrugEMs.map(em => em.outerHTML).join(''));
            }
        } else {
            // console.warn(`[extractRecommendedDrugs] Not enough EM tags for drug: '${strongTag.textContent.trim()}'. Found ${currentDrugEMs.length}, expected 4.`);
        }
    });
    return drugs;
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

// Clear symptoms input
document.getElementById('clear-symptoms-btn').addEventListener('click', function() {
    document.getElementById('symptoms-input').value = '';
    document.getElementById('symptom-duration').value = '';
    document.getElementById('symptom-severity').value = '';
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
