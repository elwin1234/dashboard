var sendDesiredTimer;

// get current desiredTemperature
// @TODO dit kan ook met view
var currentDesiredTemperature;
$.couch.db(DB).openDoc(STATE_DOC_ID, {
    success: function(doc) {
        currentDesiredTemperature = doc.desiredTemperature;
    },
    error: function(status) {
        console.log(status);
    }
});

// view to retrieve latest doc
var viewLatestDesired = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {
            device:'desired',
            limit:1,
            endkey:["desired"],
            startkey:["desired", {}],
            descending: true
        },
        baseOptions
    )
);

var desired = new LiveKnobNumberTile(
    '#desiredTemperature',
    viewLatestDesired.takeLast(1)
      .concat(desiredTemperatureStream)
      // .debounce(150)
      .map(
    // desiredTemperatureStream.map(
        function(doc){
            console.debug('desired doc', doc);
            return doc.desiredTemperature;
        }
    ),
    {
        name:"Gewenste temperatuur",
        min:DESIRED_MIN_TEMP,
        max:DESIRED_MAX_TEMP,
        step:DESIRED_STEP,
        readOnly: false,
        release : function (v) {
            console.debug('release');
            clearTimeout(sendDesiredTimer);
            sendDesiredTimer = setTimeout(function(){
                console.debug('sendDesiredTemperatureToCouch');
                sendDesiredTemperatureToCouch(v);
            },POST_TIMEOUT);
        },
        change: function() {
            console.debug('change!');
        },
        draw: function() {
            // console.debug('draw!');
        }
        // , format: function(v) {
        //     return v+' C';
        // },
    }
);

sendDesiredTemperatureToCouch = function(desiredTemperature) {
    console.debug('this is sendDesiredTemperatureToCouch');
    if (currentDesiredTemperature == desiredTemperature) {
        console.log("return, new desired temp is same as old");
        return;
    }

    function updateDesired() {
        console.debug('updateDesired');
        // create new document with
        // current time mapped to => current temperature
        // first
        desiredDoc = {
            'dev':'desired',
            'desiredTemperature':desiredTemperature,
            time:new Date().getTime()
        };
        console.debug('desiredDoc JA DEZE2', desiredDoc);

        $oDB.saveDoc(desiredDoc, {
            success: function(data) {
                currentDesiredTemperature = desiredTemperature;
                console.debug('save done');
                // desiredDoc.desiredTemperature = desiredTemperature;
                // desiredDoc.time = new Date().getTime();
                //  $oDB.saveDoc(desiredDoc, {
                //     success: function(data) {
                //         console.log('new desiredTemperature doc created!');
                //         currentDesiredTemperature = desiredTemperature;
                //     },
                //     error: function(status) {
                //         console.log(status);
                //     }
                // });
            },
            error: function(status) {
                console.log(status);
            }
        });
    }

    // save desired temp to global state
    $.ajax({
        type: 'POST',
        url: '/update/'+STATE_DOC_ID,
        dataType: 'json',
        data: {"desiredTemperature":desiredTemperature},
        success: function(result) {
            console.log('desired temp (state doc) success:');
            console.log(result);
            updateDesired();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log("Error while trying to save new doc state to db");
            console.log(xhr.status);
            console.log(thrownError);
        }
    });

    updateDesired();
    
};