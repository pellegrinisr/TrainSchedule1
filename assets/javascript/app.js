$(document).ready(function() {
  // Initialize Firebase
    var config = {
        apiKey: "AIzaSyACIYPLKVwXPdyHwNCPOl5IEzLb-gqzP18",
        authDomain: "newtrainscheduleproject.firebaseapp.com",
        databaseURL: "https://newtrainscheduleproject.firebaseio.com",
        projectId: "newtrainscheduleproject",
        storageBucket: "newtrainscheduleproject.appspot.com",
        messagingSenderId: "57650586858"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

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
            database.ref().push({
                trainName: trainName,
                trainDestination: trainDestination,
                firstTrainTime: firstTrainTime,
                frequency: frequency,
                arrivalTimes: arrivalTimeArray
            });
            clearForm();
        }
    });
    
    database.ref().on('child_added', function(snapshot) {
        var newTrain = snapshot.val();
        console.log('inside "child_added" handler: ' + newTrain.trainName);
        var nextArrivalTime = findNextTime(newTrain.arrivalTimes);
        var nextArrivalTimeString = produceTimeString(nextArrivalTime);
        var minutesAway = calcMinutesAway(nextArrivalTime);
        console.log('next arrival time: ' + nextArrivalTime);
        addToTable(newTrain.trainName, newTrain.trainDestination, newTrain.frequency, nextArrivalTimeString, minutesAway);
        
    });

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
        return nextTrain;
    }

    function produceTimeString(timeInMinutes) {
        var nextTimeHours = parseInt(timeInMinutes / 60);
        console.log('hours: ' + nextTimeHours);
        var nextTimeMins = timeInMinutes % 60;
        var amPM = '';
        console.log('minutes: ' + nextTimeMins);
        
        if (nextTimeHours < 12) {
            amPM = 'AM';
        } else {
            amPM = 'PM'
        }
        if (nextTimeHours <= 9) {
             nextTimeHours = '0' + nextTimeHours;
        } else if (nextTimeHours >= 13) {
            nextTimeHours -= 12;
        }
        if (nextTimeMins === 0) { 
            nextTimeMins = '0' + nextTimeMins;
        }
        var nextArrivalString = nextTimeHours + ':' + nextTimeMins + ' ' + amPM;
        return nextArrivalString;
    }

    function calcMinutesAway(arrivalTimeInMinutes) {
        var time = new Date();
        var timeInMins = time.getHours() * 60 + time.getMinutes();
        var minutesAway = arrivalTimeInMinutes - timeInMins;
        if (minutesAway < 0) {
            var minsTillMidnight = 1440 - timeInMins;
            minutesAway = minsTillMidnight + arrivalTimeInMinutes;
        }
        return minutesAway;
    }
});