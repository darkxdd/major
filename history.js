// Prediction History functionality

// Display user's prediction history
function displayPredictionHistory() {
    const historyBody = document.getElementById('history-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    
    // Clear previous history
    historyBody.innerHTML = '';
    
    // Get user's prediction history
    const userPredictions = getUserPredictions();
    
    if (userPredictions.predictions.length === 0) {
        // Show no history message
        noHistoryMessage.classList.remove('hidden');
        return;
    }
    
    // Hide no history message
    noHistoryMessage.classList.add('hidden');
    
    // Display each prediction
    userPredictions.predictions.forEach(prediction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(prediction.timestamp);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Create date cell
        const dateCell = document.createElement('td');
        dateCell.textContent = formattedDate;
        row.appendChild(dateCell);
        
        // Create symptoms cell
        const symptomsCell = document.createElement('td');
        symptomsCell.textContent = prediction.symptoms;
        row.appendChild(symptomsCell);
        
        // Create condition cell
        const conditionCell = document.createElement('td');
        conditionCell.textContent = prediction.condition;
        row.appendChild(conditionCell);
        
        historyBody.appendChild(row);
    });
}
