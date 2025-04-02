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
        
        // Create drugs.com link cell
        const drugsLinkCell = document.createElement('td');
        const drugsLink = document.createElement('a');
        drugsLink.href = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(prediction.condition)}`;
        drugsLink.target = '_blank';
        drugsLink.className = 'drugs-com-link';
        drugsLink.innerHTML = '<i class="fa-solid fa-pills"></i> View Medications';
        drugsLinkCell.appendChild(drugsLink);
        row.appendChild(drugsLinkCell);
        
        historyBody.appendChild(row);
    });
}
