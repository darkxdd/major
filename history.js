// Prediction History functionality

// Format date in a relative way (Today, Yesterday, or date with year)
function formatRelativeDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    // Format time
    const timeFormat = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    
    if (isToday) {
        return `Today, ${timeFormat}`;
    } else if (isYesterday) {
        return `Yesterday, ${timeFormat}`;
    } else {
        // Format date for older entries
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}, ${timeFormat}`;
    }
}

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
        
        // Format date in a relative way
        const formattedDate = formatRelativeDate(prediction.timestamp);
        
        // Create date cell
        const dateCell = document.createElement('td');
        dateCell.textContent = formattedDate;
        row.appendChild(dateCell);
        
        // Create symptoms cell
        const symptomsCell = document.createElement('td');
        symptomsCell.textContent = prediction.symptoms;
        row.appendChild(symptomsCell);
        
        // Create condition cell with Google search link
        const conditionCell = document.createElement('td');
        const conditionLink = document.createElement('a');
        conditionLink.href = `https://www.google.com/search?q=${encodeURIComponent(prediction.condition)}`;
        conditionLink.target = '_blank';
        conditionLink.textContent = prediction.condition;
        conditionLink.style.color = 'var(--primary-color)';
        conditionLink.style.textDecoration = 'none';
        conditionLink.style.fontWeight = '500';
        conditionLink.addEventListener('mouseover', () => {
            conditionLink.style.textDecoration = 'underline';
        });
        conditionLink.addEventListener('mouseout', () => {
            conditionLink.style.textDecoration = 'none';
        });
        conditionCell.appendChild(conditionLink);
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

