$(document).ready(function() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBfkrcYB3NxjPy7jTxLNO4MDnwfCES47Wk",
        authDomain: "trainscheduleproject-98879.firebaseapp.com",
        databaseURL: "https://trainscheduleproject-98879.firebaseio.com",
        projectId: "trainscheduleproject-98879",
        storageBucket: "",
        messagingSenderId: "637219215012"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    database.ref('trains/').on('value', onValueUpdate);

    $('#add-train-button').on('click', function() {
        if (validateInput()) {
            initialLoad = false;
            var arrivalTimeArray = [];
            var trainName = $('#train-name').val().trim();
            var trainDestination = $("#destination").val().trim();
            var firstTrainTime = $('#first-train-time').val().trim();
            var frequency = $('#frequency').val().trim();
            console.log(trainName);
            console.log(trainDestination);
            console.log(firstTrainTime);
            console.log(frequency);
            $('#name-error').hide();
            $('#destination-error').hide();
            $('#first-time-error').hide();
            $('#frequency-error').hide();
            var firstTimeAfterSplit = firstTrainTime.split(':');
            var firstTimeInMins = firstTimeAfterSplit[0] * 60 + parseInt(firstTimeAfterSplit[1]);
            for (var i = firstTimeInMins; i <= 1440; i+=parseInt(frequency)) {
                arrivalTimeArray.push(i);
            }
            database.ref('trains/' + trainName).set({
                trainDestination: trainDestination,
                firstTrainTime: firstTrainTime,
                frequency: frequency,
                arrivalTimes: arrivalTimeArray
            });
            clearForm();
        }
    });

    function onValueUpdate(snapshot) {
        $('.train-data').html('');
        snapshot.forEach(function(childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            console.log('child data array: ' + childData.arrivalTimes);
            var nextArrivalTime = findNextTime(childData.arrivalTimes);
            console.log(childKey + ' ' + childData.trainDestination + ' ' + childData.firstTrainTime + ' ' + childData.frequency);
            var minutesAway = calcMinutesAway(nextArrivalTime);
            addToTable(childKey, childData.trainDestination, childData.frequency, nextArrivalTime, minutesAway);
        });
    }

    function addToTable(name, dest, freq, nextArrivalString, minutesAway) {
        var newRowTag = $('<tr>');
        newRowTag.addClass('data-for-train');
        var trainNameDataTag = $('<td>');
        trainNameDataTag.html(name);
        newRowTag.append(trainNameDataTag);
        var destinationDataTag = $('<td>');
        destinationDataTag.html(dest);
        newRowTag.append(destinationDataTag);
        var frequencyDataTag = $('<td>');
        frequencyDataTag.html(freq);
        newRowTag.append(frequencyDataTag);
        var nextArrivalDataTag = $('<td>');
        nextArrivalDataTag.html(nextArrivalString);
        newRowTag.append(nextArrivalDataTag);
        var minutesAwayDataTag = $('<td>');
        minutesAwayDataTag.html(minutesAway);
        newRowTag.append(minutesAwayDataTag);
        $('.train-data').append(newRowTag);
    }

    function validateInput() {
        var validEntry = true;
        var firstTimeString = $('#first-train-time').val(); 
        var trainFrequency = $('#frequency').val();
        if (!$('#train-name').val()) {
            $('#name-error').show();
            validEntry = false;
        } else {
            $('#name-error').hide();
        }
        if (!$('#destination').val()) {
            $('#destination-error').show();
            validEntry = false;
        } else {
            $('#destination-error').hide();
        }
        if (!firstTimeString) {
            $('#first-time-error').html('Please Add First Departure Time')
            $('#first-time-error').show();
            validEntry = false;
        } else if (firstTimeString[2] !== ':' || firstTimeString.length !== 5) {
            $('#first-time-error').html('Invalid Time Format.  Please Enter Time HH:MM.');
            $('#first-time-error').show();
            validEntry = false;
        } else {
            $('#first-time-error').hide();
        }
        if (!trainFrequency) {
            $('#frequency-error').html('Please Add Frequency');
            $('#frequency-error').show();
            validEntry = false;
        } else if (trainFrequency > 1440 || trainFrequency <= 0) {
            $('#frequency-error').html('Train Frequency Invalid -- Value Must Be Between 1 and 1440');
            $('#frequency-error').show();
            validEntry = false;
        } else {
            $('#frequency-error').hide();
        }
        return validEntry;
    }

    function clearForm() {
        $('#train-name').val('');
        $('#destination').val('');
        $('#first-train-time').val('');
        $('#frequency').val('');
    }

    function findNextTime(arrayArrivalTimes) {
        var currentTime = new Date();
        var currentHours = currentTime.getHours();
        var currentMins = currentTime.getMinutes();
        var currentSeconds = currentTime.getSeconds();
        var nextTrain;
        var isFound = false;
        var i = 0;
        var currentTimeInMins = (currentHours * 60) + currentMins + (currentSeconds / 60);
        console.log(currentTimeInMins);
        while(!isFound && i < arrayArrivalTimes.length) {
            console.log(arrayArrivalTimes[i]);
            if (currentTimeInMins < arrayArrivalTimes[i]) {
                console.log(i);
                nextTrain = arrayArrivalTimes[i];
                isFound = true;
            } else if (i === arrayArrivalTimes.length - 1) {
                isFound = true;
                nextTrain = arrayArrivalTimes[0];
            } else {
                i++;
            }
        }
        console.log(nextTrain);
        var nextTimeHours = parseInt(nextTrain / 60);
        console.log('hours: ' + nextTimeHours);
        var nextTimeMins = nextTrain % 60;
        console.log('minutes: ' + nextTimeMins);

        if (nextTimeHours <= 9) {
            nextTimeHours = '0' + nextTimeHours;
        }
        if (nextTimeMins === 0) { 
            nextTimeMins = '0' + nextTimeMins;
        }
        var nextArrivalString = nextTimeHours + ':' + nextTimeMins;
        return nextArrivalString;
    }

    function calcMinutesAway(arrivalTimeString) {
        var time = new Date();
        var timeInMins = time.getHours() * 60 + time.getMinutes();
        var nextTimeAfterSplit = arrivalTimeString.split(':');
        var nextTimeInMins = nextTimeAfterSplit[0] * 60 + parseInt(nextTimeAfterSplit[1]);
        var minutesAway = nextTimeInMins - timeInMins;
        if (minutesAway < 0) {
            var minsTillMidnight = 1440 - timeInMins;
            minutesAway = minsTillMidnight + nextTimeInMins;
        }
        return minutesAway;
    }
});