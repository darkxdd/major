// userData.js

function getUserPredictions() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        console.error("Cannot get predictions: No user logged in");
        return { email: '', predictions: [] };
    }
    
    const allUserPredictions = JSON.parse(localStorage.getItem('userPredictions')) || [];
    let userPredictions = allUserPredictions.find(up => up.email === currentUser.email);
    
    if (!userPredictions) {
        userPredictions = {
            email: currentUser.email,
            predictions: []
        };
        // No need to save here, getUserPredictions is read-only for the main array structure.
        // If a user has no predictions, an empty structure is returned.
        // It will be saved if saveUserPredictions is called later.
    }
    
    return userPredictions;
}

function saveUserPredictions(userPredictionsObject) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !userPredictionsObject || currentUser.email !== userPredictionsObject.email) {
        console.error("Cannot save predictions: No user logged in or email mismatch.");
        return;
    }

    let allUserPredictions = JSON.parse(localStorage.getItem('userPredictions')) || [];
    const index = allUserPredictions.findIndex(up => up.email === userPredictionsObject.email);
    
    if (index !== -1) {
        allUserPredictions[index] = userPredictionsObject;
    } else {
        allUserPredictions.push(userPredictionsObject);
    }
    
    localStorage.setItem('userPredictions', JSON.stringify(allUserPredictions));
}
