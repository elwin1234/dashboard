var TEMPERATURE_SENSOR_0 = '28-0000053b3842';
var TEMPERATURE_SENSOR_1 = '28-0000055d4808';

$oDB = $.couch.db('temperature');
//One stream to rule them all!
var dbStream = Rx.Observable.fromCouchDB($oDB);

/*GENERAL OPTIONS*/
var range1week = {
    min:(new Date()).getTime()-7*24*3600*1000,
    max:(new Date()).getTime()
};

var range3days = {
  min:(new Date()).getTime()-3*24*3600*1000,
  max:(new Date()).getTime()
};

var range24hours = {
    min:(new Date()).getTime()-24*3600*1000,
    max:(new Date()).getTime()
};

var range60minutes = {
    min:(new Date()).getTime()-3600*1000,
    max:(new Date()).getTime()
};

var baseOptions = {
    view:'time',
    designDoc:"dashboard",
    include_docs:true
};

var graphOptions = {
    stroke: true,
    renderer:'multi',
    offset: 'value',
    min: 0,
    unstack: true,
    interpolation: 'linear'
};
var baseOptions1w = $.extend({range:range1week},baseOptions);
var baseOptions3d = $.extend({range:range3days},baseOptions);
var baseOptions24h = $.extend({range:range24hours},baseOptions);
var baseOptions60m = $.extend({range:range60minutes},baseOptions);

//Get the historic values
// var viewTemperature_1w = Rx.Observable.fromCouchDBView(
//     $oDB,
//     $.extend(
//         {device:TEMPERATURE_SENSOR_0},
//         baseOptions1w));


var viewTemperature_24h = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:TEMPERATURE_SENSOR_0},
        baseOptions24h));

var viewTemperature_60m = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:TEMPERATURE_SENSOR_0},
        baseOptions60m));

// var viewTemperature_1w_kweek = Rx.Observable.fromCouchDBView(
//     $oDB,
//     $.extend(
//         {device:TEMPERATURE_SENSOR_1},
//         baseOptions1w));
//
//
// var viewTemperature_24h_kweek = Rx.Observable.fromCouchDBView(
//     $oDB,
//     $.extend(
//         {device:TEMPERATURE_SENSOR_1},
//         baseOptions24h));
//
// var viewTemperature_60m_kweek = Rx.Observable.fromCouchDBView(
//     $oDB,
//     $.extend(
//         {device:TEMPERATURE_SENSOR_1},
//         baseOptions60m));

/*
 *    LOAD
 */
var viewLoadVps_3d = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:'loadvps'},
        baseOptions3d));

/////// LOAD 24H
var viewLoadVps_24h = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:'loadvps'},
        baseOptions24h));

var viewThermActive_24h = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:'therm_active'},
        baseOptions24h  ));

var viewThermActive_60m = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:'therm_active'},
        baseOptions60m));

var viewDesired_24h = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:'desired'},
        baseOptions24h));

var viewDesired_60m = Rx.Observable.fromCouchDBView(
    $oDB,
    $.extend(
        {device:'desired'},
        baseOptions60m));

//Create the live stream for one sensor/device
var temperatureStream = viewTemperature_60m.takeLast(1).concat(dbStream).filter(
    function(doc){
        return doc.sensor_id == TEMPERATURE_SENSOR_0;
    }
);

var desiredTemperatureStream = dbStream.filter(
    function(doc){
        return doc.dev == "desired";
    }
);

var temperatureStream_kweek = dbStream.filter(
    function(doc){
        return doc.sensor_id == TEMPERATURE_SENSOR_1;
    }
);

var loadVpsStream = dbStream.filter(
    function(doc){
        return doc.dev == "loadvps";
    }
);

var activeThermStream = dbStream.filter(
    function(doc){
        return doc.dev == "therm_active";
    }
);

// Helper function to map values of db to values to graph.
function mapTemp(doc){
    return {
        x:Math.round(doc.time/1000),
        y:doc.temperature
    };
}

// Helper function to map values of db to values to graph.
function mapLoad(doc){
    return {
        x:Math.round(doc.time/1000),
        y:doc.load1
    };
}

// Helper function to map values of db to values to graph.
function mapDesiredTemp(doc){
    desired = doc.desiredTemperature || 0;
    return {
        x:Math.round(doc.time/1000),
        y:desired
    };
}

function mapThermActive(doc){
    console.log('mapThermActive');
    active = doc.active ? 10 : 0;
    return {
        x:Math.round(doc.time/1000),
        y:active
    };
}

// Create a 24hour graph
var graph = new GraphTile('#graph',viewTemperature_24h.concat(temperatureStream).map(mapTemp),{
    range:range24hours,
    name: 'Woonkamer - 24 uur',
    serie:{
        name : 'Temperatuur',
        data : [],
        color : '#c05020',
        strokeWidth : 0,
        renderer: 'area',
        interpolation: 'cardinal'
    },
    graphOptions: graphOptions
});

graph.vSetSmooth(1);
graph.vRender();

var graph2 = new GraphTile('#graph2',viewTemperature_60m.concat(temperatureStream).map(mapTemp),{
    range:range60minutes,
    name: 'Woonkamer - 60 minuten',
    serie:{
        name : 'Temperatuur',
        data : [],
        color : '#c05020',
        strokeWidth : 0,
        renderer: 'area',
        interpolation: 'cardinal'
    },
    graphOptions: graphOptions
});

graph2.vSetSmooth(1);
graph2.vRender();

// var graph3 = new GraphTile('#graph3',viewTemperature_1w.concat(temperatureStream).map(mapTemp),{
//     range:range1week,
//     name: 'Woonkamer - 1 week',
//     serie:{
//         name : 'Temperatuur',
//         data : [],
//         color : '#c05020',
//         strokeWidth : 0,
//         renderer: 'area',
//         interpolation: 'cardinal'
//     },
//     graphOptions: graphOptions
// });
//
// graph3.vSetSmooth(1);
// graph3.vRender();

// /****************************************************************
//  *                                                              *
//  *                     Kweekkasje                              *
//  *                                                              *
//  ****************************************************************/
// // Create a 24hour graph
// var graph6 = new GraphTile('#graph6',viewTemperature_24h_kweek.concat(temperatureStream_kweek).map(mapTemp),{
//     range:range24hours,
//     name: 'Kweekkasje - 24 uur',
//     serie:{
//         name : 'Temperatuur',
//         data : [],
//         color : '#c05020',
//         strokeWidth : 0,
//         renderer: 'area',
//         interpolation: 'cardinal'
//     },
//     graphOptions: graphOptions
// });
//
// graph6.vSetSmooth(1);
// graph6.vRender();
//
// var graph7 = new GraphTile('#graph7',viewTemperature_60m_kweek.concat(temperatureStream_kweek).map(mapTemp),{
//     range:range60minutes,
//     name: 'Kweekkasje - 60 minuten',
//     serie:{
//         name : 'Temperatuur',
//         data : [],
//         color : '#c05020',
//         strokeWidth : 0,
//         renderer: 'area',
//         interpolation: 'cardinal'
//     },
//     graphOptions: graphOptions
// });
//
// graph7.vSetSmooth(1);
// graph7.vRender();
//
// var graph8 = new GraphTile('#graph8',viewTemperature_1w_kweek.concat(temperatureStream_kweek).map(mapTemp),{
//     range:range1week,
//     name: 'Kweekkasje - 1 week',
//     serie:{
//         name : 'Temperatuur',
//         data : [],
//         color : '#c05020',
//         strokeWidth : 0,
//         renderer: 'area',
//         interpolation: 'cardinal'
//     },
//     graphOptions: graphOptions
// });
//
// graph8.vSetSmooth(1);
// graph8.vRender();
//
// /****************************************************************
//  *                                                              *
//  *                     LOAD                                     *
//  *                                                              *
//  ****************************************************************/
// Create a week graph
var graph5 = new GraphTile('#graph5',viewLoadVps_3d.concat(loadVpsStream).map(mapLoad),{
    range:range3days,
    name: 'Load Servers - 3 dagen',
    serie:{
        name : 'Tilaa | 1 core | Elwin',
        data : [],
        color : '#c05020',
        strokeWidth : 0,
        renderer: 'line',
        interpolation: 'cardinal'
    },
    graphOptions: graphOptions
});

graph5.vSetSmooth(4);
graph5.vRender();

///////////////// 24 hour graph
// Create a week graph
var graph9 = new GraphTile('#graph9',viewLoadVps_24h.concat(loadVpsStream).map(mapLoad),{
    range:range1week,
    name: 'Load Servers - 24 uur',
    serie:{
        name : 'Tilaa | 1 core | Elwin',
        data : [],
        color : '#c05020',
        strokeWidth : 0,
        renderer: 'line',
        interpolation: 'cardinal'
    },
    graphOptions: graphOptions
});

graph9.vSetSmooth(4);
graph9.vRender();

var number = new LiveKnobNumberTile('#number1',temperatureStream.map(
    function(doc){
        console.log('gemeten',doc);
        return doc.temperature;
    }),{
        name:"Gemeten temperatuur",
        min:0,
        max:30,
        step:0.5
    });
// number.vSetPostText(' &deg;C');

var index = new LiveKnobNumberTile('#indexing',ActiveTasksDataProvider.map(function(data){
    var activeTask = null;
    $.each(data,function(key,task){
        if(task.type == "indexer"){
            if(activeTask === null){
                activeTask = task;
            }
            activeTask = task.progress < activeTask.progress ? task : activeTask ;
        }
    });
    if(activeTask === null)
        return 100;
    return parseFloat(((activeTask.changes_done/activeTask.total_changes)*100).toFixed(1));
}),{
    max:100,
    step:0.1,
    name:"Indexing"
});
index.vSetPostText(' %');

var loginTile = new LoginTile('#login',{
    name: 'Login',
    welcomeText: 'Hello %name%'
});