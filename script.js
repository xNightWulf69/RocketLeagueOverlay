const sleep = ms => new Promise(r => setTimeout(r, ms));
const WsSubscribers = {
    __subscribers: {},
    websocket: undefined,
    webSocketConnected: false,
    registerQueue: [],
    init: function(port, debug, debugFilters) {
        port = port || 49322;
        debug = debug || false;
        WsSubscribers.webSocket = new WebSocket("ws://localhost:" + port);
        WsSubscribers.webSocket.onmessage = function(event) {
            var jEvent = JSON.parse(event.data);
            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            var eventSplit = jEvent.event.split(':');
            var channel = eventSplit[0];
            var event_event = eventSplit[1];
            if (debug) {
                if (!debugFilters) {
                    console.log(channel, event_event, jEvent);
                } else if (debugFilters && debugFilters.indexOf(jEvent.event) < 0) {
                    console.log(channel, event_event, jEvent);
                }
            }
            WsSubscribers.triggerSubscribers(channel, event_event, jEvent.data);
        };
        WsSubscribers.webSocket.onopen = function() {
            WsSubscribers.triggerSubscribers("ws", "open");
            WsSubscribers.webSocketConnected = true;
            WsSubscribers.registerQueue.forEach((r) => {
                WsSubscribers.send("wsRelay", "register", r);
            });
            WsSubscribers.registerQueue = [];
        };
        WsSubscribers.webSocket.onerror = function() {
            WsSubscribers.triggerSubscribers("ws", "error");
            WsSubscribers.webSocketConnected = false;
        };
        WsSubscribers.webSocket.onclose = function() {
            WsSubscribers.triggerSubscribers("ws", "close");
            WsSubscribers.webSocketConnected = false;
        };
    },
    /**
     * Add callbacks for when certain events are thrown
     * Execution is guaranteed to be in First In First Out order
     * @param channels
     * @param events
     * @param callback
     */
    subscribe: function(channels, events, callback) {
        if (typeof channels === "string") {
            var channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            var event = events;
            events = [];
            events.push(event);
        }
        channels.forEach(function(c) {
            events.forEach(function(e) {
                if (!WsSubscribers.__subscribers.hasOwnProperty(c)) {
                    WsSubscribers.__subscribers[c] = {};
                }
                if (!WsSubscribers.__subscribers[c].hasOwnProperty(e)) {
                    WsSubscribers.__subscribers[c][e] = [];
                    if (WsSubscribers.webSocketConnected) {
                        WsSubscribers.send("wsRelay", "register", `${c}:${e}`);
                    } else {
                        WsSubscribers.registerQueue.push(`${c}:${e}`);
                    }
                }
                WsSubscribers.__subscribers[c][e].push(callback);
            });
        });
    },
    clearEventCallbacks: function(channel, event) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel] = {};
        }
    },
    triggerSubscribers: function(channel, event, data) {
        if (WsSubscribers.__subscribers.hasOwnProperty(channel) && WsSubscribers.__subscribers[channel].hasOwnProperty(event)) {
            WsSubscribers.__subscribers[channel][event].forEach(function(callback) {
                if (callback instanceof Function) {
                    callback(data);
                }
            });
        }
    },
    send: function(channel, event, data) {
        if (typeof channel !== 'string') {
            console.error("Channel must be a string");
            return;
        }
        if (typeof event !== 'string') {
            console.error("Event must be a string");
            return;
        }
        if (channel === 'local') {
            this.triggerSubscribers(channel, event, data);
        } else {
            var cEvent = channel + ":" + event;
            WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};
///
///
///$(() => {
    ///const obs = new OBSWebSocket();
        ///async function connectobs() {
            ///try {
                ///const {
                  ///obsWebSocketVersion,
                  ///negotiatedRpcVersion
                ///} = await obs.connect('ws://192.168.0.121:4455', 'Password', {
                  ///rpcVersion: 1
                ///});
                ///console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
              ///} catch (error) {
                ///console.error('Failed to connect', error.code, error.message);
              ///}
          ///}
          //////connectobs();
        ///WsSubscribers.subscribe("game", "replay_start", (d) => {
            ///async function enablesource() {
                ///let {sceneItemId} = await obs.call('GetSceneItemId', {sceneName: "Scene 2", sourceName: "Transition.webm"});
                ///await obs.call('SetSceneItemEnabled', {sceneName: "Scene 2", sceneItemId: parseInt(sceneItemId), sceneItemEnabled: true});
            ///}
            ///enablesource();
        ///})
        ///WsSubscribers.subscribe("game", "replay_end", (d) => {
            ///async function disablesource() {
                ///let {sceneItemId} = await obs.call('GetSceneItemId', {sceneName: "Scene 2", sourceName: "Transition.webm"});
                ///await obs.call('SetSceneItemEnabled', {sceneName: "Scene 2", sceneItemId: parseInt(sceneItemId), sceneItemEnabled: false});
            ///}
            ///disablesource();
        ///})
    ///})
$(() => {

})
$(() => {
WsSubscribers.init(49322, true);
WsSubscribers.subscribe("game", "update_state", (d) => {
        const classes = ['.scoreboardoverlayleft', '.scoreboardoverlayright', '.scoreboard', '.timer', '.orangescorenumber', '.bluescorenumber', '.orangename',
        '.bluename', '.bluelogo', '.orangelogo', '.TornamentText', '.LeftScore', '.RightScore'];
        for (var i of classes) {
            $(i).css('visibility', 'visible');}
        $(".offline").css("visibility", "hidden");
        var setbluename = localStorage.getItem("blueteamname");
        var setorangename = localStorage.getItem("orangeteamname");
        if (setbluename) {
            var blueName = localStorage.getItem("blueteamname");
        } else {
            var blueName = (d['game']['teams'][0]['name']);
        }
        if (setorangename) {
            var orangeName = localStorage.getItem("orangeteamname");
        } else {
            var orangeName = (d['game']['teams'][1]['name']);
        }
        var blueprimary = localStorage.getItem("blueprimary");
        if (blueprimary) {
            var blueColor = localStorage.getItem("blueprimary");
        } else {
            var blueColor = '#0091FF';
            localStorage.setItem('blueColor', blueColor);
        }
        var bluesecondary = localStorage.getItem("bluesecondary");
        if (bluesecondary) {
            var blueColorSecondary = localStorage.getItem("bluesecondary");
        } else {
            var blueColorSecondary = "#06D4F9";
            localStorage.setItem('blueColorSecondary', blueColorSecondary);
        }
        var orangeprimary = localStorage.getItem("orangeprimary");
        if (orangeprimary) {
            var orangeColor = localStorage.getItem("orangeprimary");
        } else {
            var orangeColor = '#FF7B00';
            localStorage.setItem('orangeColor', orangeColor);
        }
        var orangesecondary = localStorage.getItem("orangesecondary");
        if (orangesecondary) {
            var orangeColorSecondary = localStorage.getItem("orangesecondary");
        } else {
            var orangeColorSecondary = "#FFAE00";
            localStorage.setItem('orangeColorSecondary', orangeColorSecondary);
    }
        var logo = localStorage.getItem("uselogo");
        if (logo == "true") {
            var logoblue = "url('logos/" + blueName.replace(/\s/g, '') + ".png'";
            var logoorange = "url('logos/" + orangeName.replace(/\s/g, '') + ".png'";
            $(".bluelogocontainer").css("visibility", "visible");
            $(".bluelogo").css("background-image", logoblue);
            $(".orangelogocontainer").css("visibility", "visible");
            $(".orangelogo").css("background-image", logoorange);
        } else {
            $(".bluelogocontainer").css("visibility", "hidden");
            $(".orangelogocontainer").css("visibility", "hidden");
            $(".bluelogo").css("background-image", 'none');
            $(".orangelogo").css("background-image", 'none');
        }
        var time = (d['game']['time_seconds']);
        var round = Math.ceil(time);
        $('.scoreblue, .goalsblue, .shotsblue, .assistsblue, .savesblue, .demosblue').css('background-color', blueColor);
        $('.score, .goals, .shots, .assists, .saves, .demos').css('background-color', orangeColor);
        function myTime(time) {
            var min = ~~((time % 3600) / 60);
            var sec = time % 60;
            var sec_min = "";
            sec_min += "" + min + ":" + (sec < 10 ? "0" : "");
            sec_min += "" + sec;
            return sec_min;
        }
        $(".timer").text(myTime(round));
        $(".bluename").text(blueName);
        $('.bluename').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength > 16) {
                   el.css('font-size', '20px');
               }
       });
       $('.bluename').each(function(){
        var el= $(this);
          var textLength = el.html().length;
           if (textLength < 17) {
               el.css('font-size', '30px');
           }
   });
        $(".orangename").text(orangeName);
        $('.orangename').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength > 16) {
                   el.css('font-size', '20px');
               }
       });
       $('.orangename').each(function(){
        var el= $(this);
          var textLength = el.html().length;
           if (textLength < 17) {
               el.css('font-size', '30px');
           }
   });
        $(".LeftScore").css('fill', blueColor);
        let blueColorNew = blueColor.concat("0A")
        let blueColorNewa = blueColor.concat("99")
        let bGradient = "linear-gradient(135deg, " + blueColorNewa + " 0%, " + blueColorNew + " 75%)"
        $(".blueGradient").css('background', bGradient);
        $(".blueGradient").css('visibility', 'visible');
        $(".LeftScoreBOS").css('fill', blueColor);
        $(".RightScore").css('fill', orangeColor);
        let orangeColorNew = orangeColor.concat("0A")
        let orangeColorNewa = orangeColor.concat("99")
        let oGradient = "linear-gradient(225deg, " + orangeColorNewa + " 0%, " + orangeColorNew + " 75%)"
        $(".orangeGradient").css('background', oGradient);
        $(".orangeGradient").css('visibility', 'visible');
        $(".RightScoreBOS").css('fill', orangeColor);
        $(".bluename").css('color', `white`);
        var boostGradientBlue = 'linear-gradient(0.25turn, ' + blueColorSecondary + ', ' + blueColor
        var boostGradientOrange = 'linear-gradient(0.25turn, ' + orangeColor + ', ' + orangeColorSecondary
        $(".scoreboardoverlayleft").css('fill', blueColor);
        $(".scoreboardoverlayright").css('fill', orangeColor);
        $(".bluescorenumber").text(d['game']['teams'][0]['score']);
        $(".orangescorenumber").text(d['game']['teams'][1]['score']);
        if ((d['game']['isOT']) == true) {
            $('.overtimetext').css('visibility', 'visible');
        } else {
            $('.overtimetext').css('visibility', 'hidden');
        }
        $('.blueactiveboost').css('background', boostGradientBlue);
        $('.orangeactiveboost').css('background', boostGradientOrange);
        var team0 = {};
        var team1 = {};
        Object.keys(d['players']).forEach((id) => {
            if (d['players'][id].team == 0) {
                team0 = {...team0,
                    [id]: {...d['players'][id]
                    }
                };
            } else {
                team1 = {...team1,
                    [id]: {...d['players'][id]
                    }
                };
            }
        });
        if (d['players'][Object.keys(team0)[0]] != undefined) {
            $('.bluep1nameES').text(d['players'][Object.keys(team0)[0]]['name']);
            $('.bluep1scoreES').text(d['players'][Object.keys(team0)[0]]['score']);
            $('.bluep1goalsES').text(d['players'][Object.keys(team0)[0]]['goals']);
            $('.bluep1shotsES').text(d['players'][Object.keys(team0)[0]]['shots']);
            $('.bluep1assistsES').text(d['players'][Object.keys(team0)[0]]['assists']);
            $('.bluep1savesES').text(d['players'][Object.keys(team0)[0]]['saves']);
            $('.bluep1demosES').text(d['players'][Object.keys(team0)[0]]['demos']);
        }
        if (d['players'][Object.keys(team0)[1]] != undefined) {
            $('.bluep2nameES').text(d['players'][Object.keys(team0)[1]]['name']);
            $('.bluep2scoreES').text(d['players'][Object.keys(team0)[1]]['score']);
            $('.bluep2goalsES').text(d['players'][Object.keys(team0)[1]]['goals']);
            $('.bluep2shotsES').text(d['players'][Object.keys(team0)[1]]['shots']);
            $('.bluep2assistsES').text(d['players'][Object.keys(team0)[1]]['assists']);
            $('.bluep2savesES').text(d['players'][Object.keys(team0)[1]]['saves']);
            $('.bluep2demosES').text(d['players'][Object.keys(team0)[1]]['demos']);
        }
        if (d['players'][Object.keys(team0)[2]] != undefined) {
            $('.bluep3nameES').text(d['players'][Object.keys(team0)[2]]['name']);
            $('.bluep3scoreES').text(d['players'][Object.keys(team0)[2]]['score']);
            $('.bluep3goalsES').text(d['players'][Object.keys(team0)[2]]['goals']);
            $('.bluep3shotsES').text(d['players'][Object.keys(team0)[2]]['shots']);
            $('.bluep3assistsES').text(d['players'][Object.keys(team0)[2]]['assists']);
            $('.bluep3savesES').text(d['players'][Object.keys(team0)[2]]['saves']);
            $('.bluep3demosES').text(d['players'][Object.keys(team0)[2]]['demos']);
        }
        if (d['players'][Object.keys(team0)[3]] != undefined) {
            $('.bluep4nameES').text(d['players'][Object.keys(team0)[3]]['name']);
            $('.bluep4scoreES').text(d['players'][Object.keys(team0)[3]]['score']);
            $('.bluep4goalsES').text(d['players'][Object.keys(team0)[3]]['goals']);
            $('.bluep4shotsES').text(d['players'][Object.keys(team0)[3]]['shots']);
            $('.bluep4assistsES').text(d['players'][Object.keys(team0)[3]]['assists']);
            $('.bluep4savesES').text(d['players'][Object.keys(team0)[3]]['saves']);
            $('.bluep4demosES').text(d['players'][Object.keys(team0)[3]]['demos']);
        }
        if (d['players'][Object.keys(team1)[0]] != undefined) {
            $('.orangep1nameES').text(d['players'][Object.keys(team1)[0]]['name']);
            $('.orangep1scoreES').text(d['players'][Object.keys(team1)[0]]['score']);
            $('.orangep1goalsES').text(d['players'][Object.keys(team1)[0]]['goals']);
            $('.orangep1shotsES').text(d['players'][Object.keys(team1)[0]]['shots']);
            $('.orangep1assistsES').text(d['players'][Object.keys(team1)[0]]['assists']);
            $('.orangep1savesES').text(d['players'][Object.keys(team1)[0]]['saves']);
            $('.orangep1demosES').text(d['players'][Object.keys(team1)[0]]['demos']);
        }
        if (d['players'][Object.keys(team1)[1]] != undefined) {
            $('.orangep2nameES').text(d['players'][Object.keys(team1)[1]]['name']);
            $('.orangep2scoreES').text(d['players'][Object.keys(team1)[1]]['score']);
            $('.orangep2goalsES').text(d['players'][Object.keys(team1)[1]]['goals']);
            $('.orangep2shotsES').text(d['players'][Object.keys(team1)[1]]['shots']);
            $('.orangep2assistsES').text(d['players'][Object.keys(team1)[1]]['assists']);
            $('.orangep2savesES').text(d['players'][Object.keys(team1)[1]]['saves']);
            $('.orangep2demosES').text(d['players'][Object.keys(team1)[1]]['demos']);
        }
        if (d['players'][Object.keys(team1)[2]] != undefined) {
            $('.orangep3nameES').text(d['players'][Object.keys(team1)[2]]['name']);
            $('.orangep3scoreES').text(d['players'][Object.keys(team1)[2]]['score']);
            $('.orangep3goalsES').text(d['players'][Object.keys(team1)[2]]['goals']);
            $('.orangep3shotsES').text(d['players'][Object.keys(team1)[2]]['shots']);
            $('.orangep3assistsES').text(d['players'][Object.keys(team1)[2]]['assists']);
            $('.orangep3savesES').text(d['players'][Object.keys(team1)[2]]['saves']);
            $('.orangep3demosES').text(d['players'][Object.keys(team1)[2]]['demos']);
        }
        if (d['players'][Object.keys(team1)[3]] != undefined) {
            $('.orangep4nameES').text(d['players'][Object.keys(team1)[3]]['name']);
            $('.orangep4scoreES').text(d['players'][Object.keys(team1)[3]]['score']);
            $('.orangep4goalsES').text(d['players'][Object.keys(team1)[3]]['goals']);
            $('.orangep4shotsES').text(d['players'][Object.keys(team1)[3]]['shots']);
            $('.orangep4assistsES').text(d['players'][Object.keys(team1)[3]]['assists']);
            $('.orangep4savesES').text(d['players'][Object.keys(team1)[3]]['saves']);
            $('.orangep4demosES').text(d['players'][Object.keys(team1)[3]]['demos']);
        }
        const blue = Object.values(d.players).filter(p => p.team === 0);
        const orange = Object.values(d.players).filter(p => p.team === 1);
        const blueScore = blue.reduce((acc, p) => acc + p.score, 0);
        const orangeScore = orange.reduce((acc, p) => acc + p.score, 0);
        const totalScore = blueScore + orangeScore;
            var allScore = blueScore / totalScore * 100
            if (totalScore == 0) {
                allScore = "50"
                $('.scoreblue').width(allScore + "%")
            } else {
                $('.scoreblue').width(allScore + "%")
            }
            const blueGoal = blue.reduce((acc, p) => acc + p.goals, 0);
            const orangeGoal = orange.reduce((acc, p) => acc + p.goals, 0);
            var totalGoals = blueGoal + orangeGoal;
            var allGoals = blueGoal / totalGoals * 100
            if (totalGoals == 0) {
                allGoals = "50"
                $('.goalsblue').width(allGoals + "%")
            } else {
                $('.goalsblue').width(allGoals + "%")
            }
            const blueAssist = blue.reduce((acc, p) => acc + p.assists, 0);
            const orangeAssist = orange.reduce((acc, p) => acc + p.assists, 0);
            var totalAssist = blueAssist + orangeAssist;
            var allAssist = blueAssist / totalAssist * 100
            if (totalAssist == 0) {
                allAssist = "50"
                $('.assistsblue').width(allAssist + "%")
            } else {
                $('.assistsblue').width(allAssist + "%")
            }
            const blueSave = blue.reduce((acc, p) => acc + p.saves, 0);
            const orangeSave = orange.reduce((acc, p) => acc + p.saves, 0);
            var totalSaves = blueSave + orangeSave;
            var allSaves = blueSave / totalSaves * 100
            if (totalSaves == 0) {
                allSaves = "50"
                $('.savesblue').width(allSaves + "%")
            } else {
                $('.savesblue').width(allSaves + "%")
            }
            const blueShots = blue.reduce((acc, p) => acc + p.shots, 0);
            const orangeShots = orange.reduce((acc, p) => acc + p.shots, 0);
            var totalShots = blueShots + orangeShots;
            var allShots = blueShots / totalShots * 100
            if (totalShots == 0) {
                allShots = "50"
                $('.shotsblue').width(allShots + "%")
            } else {
                $('.shotsblue').width(allShots + "%")
            }
            const blueDemos = blue.reduce((acc, p) => acc + p.demos, 0);
            const orangeDemos = orange.reduce((acc, p) => acc + p.demos, 0);
            var totalDemos = blueDemos + orangeDemos;
            var allDemos = blueDemos / totalDemos * 100
            if (totalDemos == 0) {
                allDemos = "50"
                $('.demosblue').width(allDemos + "%");
            } else {
                $('.demosblue').width(allDemos + "%");
            }
        if (d['players'][Object.keys(team0)[0]] != undefined) {
            $('.bluep1name').text(d['players'][Object.keys(team0)[0]]['name']);
            $('.bluep1name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.bluep1name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.bluep1goals').text(d['players'][Object.keys(team0)[0]]['goals']);
            $('.bluep1assists').text(d['players'][Object.keys(team0)[0]]['assists']);
            $('.bluep1saves').text(d['players'][Object.keys(team0)[0]]['saves']);
            $('.bluep1shots').text(d['players'][Object.keys(team0)[0]]['shots']);
            $('.bluep1boost').width(d['players'][Object.keys(team0)[0]]['boost'] + "%");
            $('.bluep1boostnumber').text(d['players'][Object.keys(team0)[0]]['boost'] + "%");
            $('.bluep1boost').css('background', boostGradientBlue);
            $('.bluep1stats').css('visibility', 'visible');
            $('.bluep1boost').css('visibility', 'visible');
            $('.blueplayer1').css('visibility', 'visible');
            localStorage.setItem('bp1', d['players'][Object.keys(team0)[0]]['name']);
            if (d['players'][Object.keys(team0)[0]]['isDead'] == true) {
                $('.bluep1death').css('visibility', 'visible');
                $('.bluep1name').css('color', 'red');
            } else {
                $('.bluep1death').css('visibility', 'hidden');
                $('.bluep1name').css('color', 'white');
            }
        } else {
            $('.bluep1stats').css('visibility', 'hidden');
            $('.blueplayer1').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team0)[1]] != undefined) {
            $('.bluep2name').text(d['players'][Object.keys(team0)[1]]['name']);
            $('.bluep2name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.bluep2name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.bluep2goals').text(d['players'][Object.keys(team0)[1]]['goals']);
            $('.bluep2assists').text(d['players'][Object.keys(team0)[1]]['assists']);
            $('.bluep2saves').text(d['players'][Object.keys(team0)[1]]['saves']);
            $('.bluep2shots').text(d['players'][Object.keys(team0)[1]]['shots']);
            $('.bluep2boost').width(d['players'][Object.keys(team0)[1]]['boost'] + "%");
            $('.bluep2boostnumber').text(d['players'][Object.keys(team0)[1]]['boost'] + "%");
            $('.bluep2boost').css('background', boostGradientBlue);
            $('.bluep2stats').css('visibility', 'visible');
            $('.bluep2boost').css('visibility', 'visible');
            $('.blueplayer2').css('visibility', 'visible');
            localStorage.setItem('bp2', d['players'][Object.keys(team0)[1]]['name']);
            if (d['players'][Object.keys(team0)[1]]['isDead'] == true) {
                $('.bluep2death').css('visibility', 'visible');
                $('.bluep2name').css('color', 'red');
            } else {
                $('.bluep2death').css('visibility', 'hidden');
                $('.bluep2name').css('color', 'white');
            }
        } else {
            $('.bluep2stats').css('visibility', 'hidden');
            $('.blueplayer2').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team0)[2]] != undefined) {
            $('.bluep3name').text(d['players'][Object.keys(team0)[2]]['name']);
            $('.bluep3name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.bluep3name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.bluep3goals').text(d['players'][Object.keys(team0)[2]]['goals']);
            $('.bluep3assists').text(d['players'][Object.keys(team0)[2]]['assists']);
            $('.bluep3saves').text(d['players'][Object.keys(team0)[2]]['saves']);
            $('.bluep3shots').text(d['players'][Object.keys(team0)[2]]['shots']);
            $('.bluep3boost').width(d['players'][Object.keys(team0)[2]]['boost'] + "%");
            $('.bluep3boostnumber').text(d['players'][Object.keys(team0)[2]]['boost'] + "%");
            $('.bluep3boost').css('background', boostGradientBlue);
            $('.bluep3stats').css('visibility', 'visible');
            $('.bluep3boost').css('visibility', 'visible');
            $('.blueplayer3').css('visibility', 'visible');
            localStorage.setItem('bp3', d['players'][Object.keys(team0)[2]]['name']);
            if (d['players'][Object.keys(team0)[2]]['isDead'] == true) {
                $('.bluep3death').css('visibility', 'visible');
                $('.bluep3name').css('color', 'red');
            } else {
                $('.bluep3death').css('visibility', 'hidden');
                $('.bluep3name').css('color', 'white');
            }
        } else {
            $('.bluep3stats').css('visibility', 'hidden');
            $('.blueplayer3').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team0)[3]] != undefined) {
            $('.bluep4name').text(d['players'][Object.keys(team0)[3]]['name']);
            $('.bluep4name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.bluep4name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.bluep4goals').text(d['players'][Object.keys(team0)[3]]['goals']);
            $('.bluep4assists').text(d['players'][Object.keys(team0)[3]]['assists']);
            $('.bluep4saves').text(d['players'][Object.keys(team0)[3]]['saves']);
            $('.bluep4shots').text(d['players'][Object.keys(team0)[3]]['shots']);
            $('.bluep4boost').width(d['players'][Object.keys(team0)[3]]['boost'] + "%");
            $('.bluep4boostnumber').text(d['players'][Object.keys(team0)[3]]['boost'] + "%");
            $('.bluep4boost').css('background', boostGradientBlue);
            $('.bluep4stats').css('visibility', 'visible');
            $('.bluep4boost').css('visibility', 'visible');
            $('.blueplayer4').css('visibility', 'visible');
            localStorage.setItem('bp4', d['players'][Object.keys(team0)[3]]['name']);
            if (d['players'][Object.keys(team0)[3]]['isDead'] == true) {
                $('.bluep4death').css('visibility', 'visible');
                $('.bluep4name').css('color', 'red');
            } else {
                $('.bluep4death').css('visibility', 'hidden');
                $('.bluep4name').css('color', 'white');
            }
        } else {
            $('.bluep4stats').css('visibility', 'hidden');
            $('.blueplayer4').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team1)[0]] != undefined) {
            $('.orangep1name').text(d['players'][Object.keys(team1)[0]]['name']);
            $('.orangep1name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.orangep1name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.orangep1goals').text(d['players'][Object.keys(team1)[0]]['goals']);
            $('.orangep1assists').text(d['players'][Object.keys(team1)[0]]['assists']);
            $('.orangep1saves').text(d['players'][Object.keys(team1)[0]]['saves']);
            $('.orangep1shots').text(d['players'][Object.keys(team1)[0]]['shots']);
            $('.orangep1boost').width(d['players'][Object.keys(team1)[0]]['boost'] + "%");
            $('.orangep1boostnumber').text(d['players'][Object.keys(team1)[0]]['boost'] + "%");
            $('.orangep1boost').css('background', boostGradientOrange);
            $('.orangep1stats').css('visibility', 'visible');
            $('.orangep1boost').css('visibility', 'visible');
            $('.orangeplayer1').css('visibility', 'visible');
            localStorage.setItem('op1', d['players'][Object.keys(team1)[0]]['name']);
            if (d['players'][Object.keys(team1)[0]]['isDead'] == true) {
                $('.orangep1death').css('visibility', 'visible');
                $('.orangep1name').css('color', 'red');
            } else {
                $('.orangep1death').css('visibility', 'hidden');
                $('.orangep1name').css('color', 'white');
            }
        } else {
            $('.orangep1stats').css('visibility', 'hidden');
            $('.orangeplayer1').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team1)[1]] != undefined) {
            $('.orangep2name').text(d['players'][Object.keys(team1)[1]]['name']);
            $('.orangep1name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.orangep1name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.orangep2goals').text(d['players'][Object.keys(team1)[1]]['goals']);
            $('.orangep2assists').text(d['players'][Object.keys(team1)[1]]['assists']);
            $('.orangep2saves').text(d['players'][Object.keys(team1)[1]]['saves']);
            $('.orangep2shots').text(d['players'][Object.keys(team1)[1]]['shots']);
            $('.orangep2boost').width(d['players'][Object.keys(team1)[1]]['boost'] + "%");
            $('.orangep2boostnumber').text(d['players'][Object.keys(team1)[1]]['boost'] + "%");
            $('.orangep2boost').css('background', boostGradientOrange);
            $('.orangep2stats').css('visibility', 'visible');
            $('.orangep2boost').css('visibility', 'visible');
            $('.orangeplayer2').css('visibility', 'visible');
            localStorage.setItem('op2', d['players'][Object.keys(team1)[1]]['name']);
            if (d['players'][Object.keys(team1)[1]]['isDead'] == true) {
                $('.orangep2death').css('visibility', 'visible');
                $('.orangep2name').css('color', 'red');
            } else {
                $('.orangep2death').css('visibility', 'hidden');
                $('.orangep2name').css('color', 'white');
            }
        } else {
            $('.orangep2stats').css('visibility', 'hidden');
            $('.orangeplayer2').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team1)[2]] != undefined) {
            $('.orangep3name').text(d['players'][Object.keys(team1)[2]]['name']);
            $('.orangep3name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.orangep3name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.orangep3goals').text(d['players'][Object.keys(team1)[2]]['goals']);
            $('.orangep3assists').text(d['players'][Object.keys(team1)[2]]['assists']);
            $('.orangep3saves').text(d['players'][Object.keys(team1)[2]]['saves']);
            $('.orangep3shots').text(d['players'][Object.keys(team1)[2]]['shots']);
            $('.orangep3boost').width(d['players'][Object.keys(team1)[2]]['boost'] + "%");
            $('.orangep3boostnumber').text(d['players'][Object.keys(team1)[2]]['boost'] + "%");
            $('.orangep3boost').css('background', boostGradientOrange);
            $('.orangep3stats').css('visibility', 'visible');
            $('.orangep3boost').css('visibility', 'visible');
            $('.orangeplayer3').css('visibility', 'visible');
            localStorage.setItem('op3', d['players'][Object.keys(team1)[2]]['name']);
            if (d['players'][Object.keys(team1)[2]]['isDead'] == true) {
                $('.orangep3death').css('visibility', 'visible');
                $('.orangep3name').css('color', 'red');
            } else {
                $('.orangep3death').css('visibility', 'hidden');
                $('.orangep3name').css('color', 'white');
            }
        } else {
            $('.orangep3stats').css('visibility', 'hidden');
            $('.orangeplayer3').css('visibility', 'hidden');
        }
        if (d['players'][Object.keys(team1)[3]] != undefined) {
            $('.orangep4name').text(d['players'][Object.keys(team1)[3]]['name'])
            $('.orangep4name').each(function(){
                var el= $(this);
                  var textLength = el.html().length;
                   if (textLength > 19) {
                       el.css('font-size', '14px');
                   }
           });
           $('.orangep1name').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength < 20) {
                   el.css('font-size', '20px');
               }
       });
            $('.orangep4goals').text(d['players'][Object.keys(team1)[3]]['goals']);
            $('.orangep4assists').text(d['players'][Object.keys(team1)[3]]['assists']);
            $('.orangep4saves').text(d['players'][Object.keys(team1)[3]]['saves']);
            $('.orangep4shots').text(d['players'][Object.keys(team1)[3]]['shots']);
            $('.orangep4boost').width(d['players'][Object.keys(team1)[3]]['boost'] + "%");
            $('.orangep4boostnumber').text(d['players'][Object.keys(team1)[3]]['boost'] + "%");
            $('.orangep4boost').css('background', boostGradientOrange);
            $('.orangep4stats').css('visibility', 'visible');
            $('.orangep4boost').css('visibility', 'visible');
            $('.orangeplayer4').css('visibility', 'visible');
            localStorage.setItem('op4', d['players'][Object.keys(team1)[3]]['name']);
            if (d['players'][Object.keys(team1)[3]]['isDead'] == true) {
                $('.orangep4death').css('visibility', 'visible');
                $('.orangep4name').css('color', 'red');
            } else {
                $('.orangep4death').css('visibility', 'hidden');
                $('.orangep4name').css('color', 'white');
            }
        } else {
            $('.orangep4stats').css('visibility', 'hidden');
            $('.orangeplayer4').css('visibility', 'hidden');
        }
        if (d['game']['time_milliseconds'] == 300 && d['game']['time_seconds'] == 0) {
            $('.activereplaybox, .activereplayboxwhite, .activereplayboxteam, .replaybox').css('visibility', 'hidden');
        }
        var activeTarget = (d['game']['target']);
        var activePlayerData = d.players[d.game.target];


        if (activeTarget.length > 1) {
            if (activePlayerData.team == 0) {
                var blueActiveBorder = '4px solid' + blueColor
                $('.activeplayer').css('border', blueActiveBorder);
                $('.blueactivename').text(activePlayerData.name);
                $('.blueactivegoals').text(activePlayerData.goals);
                $('.blueactivedemos').text(activePlayerData.demos);
                $('.blueactiveshots').text(activePlayerData.shots);
                $('.blueactivesaves').text(activePlayerData.saves);
                $('.blueactiveassists').text(activePlayerData.assists);
                $('.blueactiveboost').width(activePlayerData.boost + "%");
                $('.blueactiveboostnumber').text(activePlayerData.boost + "%");
                $('.blueactivespeeds').text(activePlayerData.speed + " KPH");
                const classes = ['.blueactiveboostcontainer', 'blueactiveboost', '.blueactivetable', '.blueactivename', '.blueactivestats', '.activeplayer'];
                for (var i of classes) {
                    $(i).css('visibility', 'visible')}
                const hiddenclasses = ['.orangeactiveboostcontainer', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.orangeactiveboost'];
                for (var i of hiddenclasses) {
                    $(i).css('visibility', 'hidden')}
            } else if (activePlayerData.team == 1) {
                var orangeActiveBorder = '4px solid' + orangeColor
                $('.activeplayer').css('border', orangeActiveBorder);
                $('.orangeactivename').text(activePlayerData.name);
                $('.orangeactivegoals').text(activePlayerData.goals);
                $('.orangeactivedemos').text(activePlayerData.demos);
                $('.orangeactiveshots').text(activePlayerData.shots);
                $('.orangeactivesaves').text(activePlayerData.saves);
                $('.orangeactiveassists').text(activePlayerData.assists);
                $('.orangeactiveboost').width(activePlayerData.boost + "%");
                $('.orangeactiveboostnumber').text(activePlayerData.boost + "%");
                $('.orangeactivespeeds').text(activePlayerData.speed + " KPH");
                $('.orangeactiveboost').css('background-color', orangeColor);
                const classes = ['.orangeactiveboostcontainer', '.orangeactivetable', '.orangeactiveboost',  '.orangeactivename', '.orangeactivestats', '.activeplayer', '.orangeactiveboost'];
                for (var i of classes) {
                    $(i).css('visibility', 'visible')}
                const hiddenclasses = ['.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats'];
                for (var i of hiddenclasses) {
                    $(i).css('visibility', 'hidden')}
            } else {
                const hiddenclasses = ['.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats', '.orangeactiveboostcontainer',
                '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.activeplayer', '.orangeactiveboost'];
                for (var i of hiddenclasses) {
                    $(i).css('visibility', 'hidden')}
            }
        } else {
            const hiddenclasses = ['.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats', '.orangeactiveboostcontainer', '.orangeactivetable',
            '.orangeactivename', , '.orangeactivestats', '.activeplayerteam', '.activeplayer', '.orangeactiveboost'];
            for (var i of hiddenclasses) {
                $(i).css('visibility', 'hidden')}
        }
        if (d['game']['isReplay'] == true) {
            const classes = ['.activereplaybox', '.replayactiveassists', '.replayactivegoals', '.replaybox'];
            for (var i of classes) {
                $(i).css('visibility', 'visible')}
            const hiddenclasses = ['.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats', '.orangeactiveboostcontainer', '.orangeactivetable',
            '.orangeactivename', '.orangeactivestats', '.activeplayer', '.blueactivestats', '.orangeactivestats', '.orangeactiveboost'];
            for (var i of hiddenclasses) {
                $(i).css('visibility', 'hidden')}
        } else {
            const hiddenclasses = ['.activereplaybox', '.replayactiveassists', '.replayactivegoals', '.replaybox'];
            for (var i of hiddenclasses) {
                $(i).css('visibility', 'hidden')}
        }
        if (d['game']['time_milliseconds'] == 300 && d['game']['time_seconds'] == 0) {
            $('#myDIV').css('display', 'none')
            const hiddenclasses = ['.orangeactiveboostcontainer', '.orangeactiveboost', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer',
            '.blueactivetable', '.blueactivename', '.blueactivestats', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplaybox',
            '.bluep4death', '.bluep3death', '.bluep2death', '.bluep1death', '.orangep4death', '.orangep3death', , '.orangep2death', '.orangep1death',
            '.bestof7', '.bestof5', '.bestof3', '.orangebestof4', '.orangebestof3', '.orangebestof2', '.orangebestof1', '.bluebestof4', '.bluebestof3',
            '.bluebestof2', '.bluebestof1', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats', '.orangep3stats',
            '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2',
            '.blueplayer1', '.activereplaybox', '.replayactivegoals', '.replaybox'];
            for (var i of hiddenclasses) {
                $(i).css('visibility', 'hidden')}
        }
        var bob1 = localStorage.getItem("bwin1");
        var bob2 = localStorage.getItem("bwin2");
        var bob3 = localStorage.getItem("bwin3");
        var bob4 = localStorage.getItem("bwin4");
        var oob1 = localStorage.getItem("owin1");
        var oob2 = localStorage.getItem("owin2");
        var oob3 = localStorage.getItem("owin3");
        var oob4 = localStorage.getItem("owin4");
        if (bob1 === 'true') {
            $('.bluebestof1').css('background', 'white');
        } else {
            $('.bluebestof1').css('background', 'black');
        }
        if (bob2 === 'true') {
            $('.bluebestof2').css('background', 'white');
        } else {
            $('.bluebestof2').css('background', 'black');
        }
        if (bob3 === 'true') {
            $('.bluebestof3').css('background', 'white');
        } else {
            $('.bluebestof3').css('background', 'black');
        }
        if (bob4 === 'true') {
            $('.bluebestof4').css('background', 'white');
        } else {
            $('.bluebestof4').css('background', 'black');
        }
        if (oob1 === 'true') {
            $('.orangebestof1').css('background', 'white');
        } else {
            $('.orangebestof1').css('background', 'black');
        }
        if (oob2 === 'true') {
            $('.orangebestof2').css('background', 'white');
        } else {
            $('.orangebestof2').css('background', 'black');
        }
        if (oob3 === 'true') {
            $('.orangebestof3').css('background', 'white');
        } else {
            $('.orangebestof3').css('background', 'black');
        }
        if (oob4 === 'true') {
            $('.orangebestof4').css('background', 'white');
        } else {
            $('.orangebestof4').css('background', 'black');
        }
        var total = 1
        if (bob1 === 'true') {
         total = total + 1
        }
        if (bob2 === 'true') {
            total = total + 1
        }
        if (bob3 === 'true') {
            total = total + 1
        }
        if (bob4 === 'true') {
            total = total + 1
        }
        if (oob1 === 'true') {
            total = total + 1
        }
        if (oob2 === 'true') {
            total = total + 1
        }
        if (oob3 === 'true') {
            total = total + 1
        }
        if (oob4 === 'true') {
            total = total + 1
        }
        var bestof3 = localStorage.getItem("bestof3");
        if (bestof3 === 'true') {
            var bo3total = "Game " + total + '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0' + "Best Of 3"
            $('.bestof3').text(bo3total)
            const classes = ['.orangebestof2', '.orangebestof1',  '.bluebestof2', '.bluebestof1', '.bestof3', '.RightScoreBOS', '.LeftScoreBOS', '.BestOfBackGround'];
            for (var i of classes) {
                $(i).css('visibility', 'visible')}
            const hiddenclasses = ['.orangebestof4', '.orangebestof3', '.bluebestof4', '.bluebestof3', '.bestof7', '.bestof5'];
            for (var i of hiddenclasses) {
                $(i).css('visibility', 'hidden')}
        } else {
            $('.bestof3').css('visibility', 'hidden');
        }
        var bestof5 = localStorage.getItem("bestof5");
        if (bestof5 === 'true') {
            var bo5total = "Game " + total + '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0' + "Best Of 5"
            $('.bestof5').text(bo5total)
            const hiddenclasses = ['.bestof3', '.bestof7', '.bluebestof4', '.orangebestof4'];
            for (var i of hiddenclasses) {;
                $(i).css('visibility', 'hidden')}
            const classes = ['.bluebestof1', '.bluebestof2', '.bluebestof3', '.orangebestof1', '.orangebestof2', '.orangebestof3', '.bestof5', '.RightScoreBOS',
            '.LeftScoreBOS', '.BestOfBackGround'];
            for (var i of classes) {
                $(i).css('visibility', 'visible')}
        } else {
            $('.bestof5').css('visibility', 'hidden');
        }
        var bestof7 = localStorage.getItem("bestof7");
        if (bestof7 === 'true') {
            const classes = ['.BestOfBackGround', '.LeftScoreBOS', '.RightScoreBOS', '.bestof7', '.bluebestof1', '.bluebestof2', '.bluebestof3', '.bluebestof4',
            '.orangebestof1', '.orangebestof2', '.orangebestof3', '.orangebestof4'];
            for (var i of classes) {
                $(i).css('visibility', 'visible')}
            var bo7total = "Game " + total + '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0' + "Best Of 7"
            $('.bestof7').text(bo7total)
            $('.bestof3').css('visibility', 'hidden');
            $('.bestof5').css('visibility', 'hidden');
        } else {
            $('.bestof7').css('visibility', 'hidden');
        }
        if (bestof3 == "false" && bestof5 == "false" && bestof7 == "false") {
            const classes = ['.BestOfBackGround', '.LeftScoreBOS', '.RightScoreBOS', '.bluebestof1', '.bluebestof2', '.bluebestof3', '.bluebestof4',
            '.orangebestof1', '.orangebestof2', '.orangebestof3', '.orangebestof4'];
        for (var i of classes) {
            $(i).css('visibility', 'hidden')}
        }
        var TournamentText = localStorage.getItem("TournamentText");
        if (TournamentText) {
            $('a').text(TournamentText);
        } else {
            $('a').text('');
        }
    })
})
WsSubscribers.subscribe("game", "goal_scored", (date) => {
        var blueprimary = localStorage.getItem("blueprimary");
        if (blueprimary) {
            var blue = localStorage.getItem("blueprimary");
        } else {
            var blue = localStorage.getItem("blueColor");
        }
        var orangeprimary = localStorage.getItem("orangeprimary");
        if (orangeprimary) {
            var orange = localStorage.getItem("blueprimary");
        } else {
            var orange = localStorage.getItem("orangeColor");
        }
        if (date['assister']['name'] != "") {
            var assister = (date['assister']['name']);
            $('.replayactiveassist').css('opacity', '1');
        } else {
            var assister = ("")
            $('.replayactiveassist').css('opacity', '0');
        }
        var ballspeed = (Math.round(date['goalspeed']) + " KPH");
        var scorer = (date['scorer']['name']);
        if (date['scorer']['teamnum'] == 0) {
            var blueborder = '4px solid' + blue
            $('.activereplaybox').css('border', blueborder);
        } else {
            var orangeborder = '4px solid' + orange
            $('.activereplaybox').css('border', orangeborder);
        }
        $(".replayactivegoals").text(scorer);
        $('.replayactivegoals').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength > 15) {
                   el.css('font-size', '12px');
               }
       });
       $('.replayactivegoals').each(function(){
        var el= $(this);
          var textLength = el.html().length;
           if (textLength < 16) {
               el.css('font-size', '20px');
           }
   });
        $(".replayactiveassists").text(assister);
        $('.replayactiveassists').each(function(){
            var el= $(this);
              var textLength = el.html().length;
               if (textLength > 15) {
                   el.css('font-size', '12px');
               }
       });
       $('.replayactiveassists').each(function(){
        var el= $(this);
          var textLength = el.html().length;
           if (textLength < 16) {
               el.css('font-size', '20px');
           }
   });
        $(".replayactivespeed").text(ballspeed);
})
WsSubscribers.subscribe("game", "statfeed_event", (data) => {
        var event_type = (data['event_name']);
        var event_user = (data['main_target']['name']);
        var blueprimary = localStorage.getItem("blueprimary");
        if (blueprimary) {
            var blueColor = localStorage.getItem("blueprimary");
        } else {
            var blueColor = localStorage.getItem("blueColor");
        }
        var orangeprimary = localStorage.getItem("orangeprimary");
        if (orangeprimary) {
            var orangeColor = localStorage.getItem("orangeprimary");
        } else {
            var orangeColor = localStorage.getItem("orangeColor");
        }
        var bluegradient = 'radial-gradient(25px, ' + blueColor + ", transparent)"
        var orangegradient = 'radial-gradient(25px, ' + orangeColor + ", transparent)"
        var type = "url(SVG/" + event_type + ".svg)"
        const secondslot = ['OvertimeGoal', 'BackwardsGoal', 'Goal', 'BicycleGoal', 'LongGoal', 'TurtleGoal', 'HoopsSwishGoal', 'Playmaker', 'Savior', 'PoolShot', 'Demolition', 'HatTrick', 'HighFive', 'LowFive'];
        var playernameo1 = localStorage.getItem("op1");
        var playernameb1 = localStorage.getItem("bp1");
        var playernameo2 = localStorage.getItem("op2");
        var playernameb2 = localStorage.getItem("bp2");
        var playernameo3 = localStorage.getItem("op3");
        var playernameb3 = localStorage.getItem("bp3");
        var playernameo4 = localStorage.getItem("op4");
        var playernameb4 = localStorage.getItem("bp4");
        async function Orangep1timeout1() {
            setTimeout(
                function() {
                    $('.orangep1statone').css('background-image', 'none');
                    $('.orangep1statoneone').css('background', 'none');
                }, 5000);
        }
        async function Orangep1timeout2() {
            setTimeout(
                function() {
                    $('.orangep1stattwo').css('background-image', 'none');
                    $('.orangep1stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Orangep1timeout3() {
            setTimeout(
                function() {
                    $('.orangep1statthree').css('background-image', 'none');
                    $('.orangep1statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Orangep2timeout1() {
            setTimeout(
                function() {
                    $('.orangep2statone').css('background-image', 'none');
                    $('.orangep2statoneone').css('background', 'none');
                }, 5000);
        }
        async function Orangep2timeout2() {
            setTimeout(
                function() {
                    $('.orangep2stattwo').css('background-image', 'none');
                    $('.orangep2stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Orangep2timeout3() {
            setTimeout(
                function() {
                    $('.orangep2statthree').css('background-image', 'none');
                    $('.orangep2statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Orangep3timeout1() {
            setTimeout(
                function() {
                    $('.orangep3statone').css('background-image', 'none');
                    $('.orangep3statoneone').css('background', 'none');
                }, 5000);
        }
        async function Orangep3timeout2() {
            setTimeout(
                function() {
                    $('.orangep3stattwo').css('background-image', 'none');
                    $('.orangep3stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Orangep3timeout3() {
            setTimeout(
                function() {
                    $('.orangep3statthree').css('background-image', 'none');
                    $('.orangep3statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Orangep4timeout1() {
            setTimeout(
                function() {
                    $('.orangep4statone').css('background-image', 'none');
                    $('.orangep4statoneone').css('background', 'none');
                }, 5000);
        }
        async function Orangep4timeout2() {
            setTimeout(
                function() {
                    $('.orangep4stattwo').css('background-image', 'none');
                    $('.orangep4stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Orangep4timeout3() {
            setTimeout(
                function() {
                    $('.orangep4statthree').css('background-image', 'none');
                    $('.orangep4statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Bluep1timeout1() {
            setTimeout(
                function() {
                    $('.bluep1statone').css('background-image', 'none');
                    $('.bluep1statoneone').css('background', 'none');
                }, 5000);
        }
        async function Bluep1timeout2() {
            setTimeout(
                function() {
                    $('.bluep1stattwo').css('background-image', 'none');
                    $('.bluep1stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Bluep1timeout3() {
            setTimeout(
                function() {
                    $('.bluep1statthree').css('background-image', 'none');
                    $('.bluep1statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Bluep2timeout1() {
            setTimeout(
                function() {
                    $('.bluep2statone').css('background-image', 'none');
                    $('.bluep2statoneone').css('background', 'none');
                }, 5000);
        }
        async function Bluep2timeout2() {
            setTimeout(
                function() {
                    $('.bluep2stattwo').css('background-image', 'none');
                    $('.bluep2stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Bluep2timeout3() {
            setTimeout(
                function() {
                    $('.bluep2statthree').css('background-image', 'none');
                    $('.bluep2statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Bluep3timeout1() {
            setTimeout(
                function() {
                    $('.bluep3statone').css('background-image', 'none');
                    $('.bluep3statoneone').css('background', 'none');
                }, 5000);
        }
        async function Bluep3timeout2() {
            setTimeout(
                function() {
                    $('.bluep3stattwo').css('background-image', 'none');
                    $('.bluep3stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Bluep3timeout3() {
            setTimeout(
                function() {
                    $('.bluep3statthree').css('background-image', 'none');
                    $('.bluep3statthreeone').css('background', 'none');
                }, 5000);
        }
        async function Bluep4timeout1() {
            setTimeout(
                function() {
                    $('.bluep4statone').css('background-image', 'none');
                    $('.bluep4statoneone').css('background', 'none');
                }, 5000);
        }
        async function Bluep4timeout2() {
            setTimeout(
                function() {
                    $('.bluep4stattwo').css('background-image', 'none');
                    $('.bluep4stattwoone').css('background', 'none');
                }, 5000);
        }
        async function Bluep4timeout3() {
            setTimeout(
                function() {
                    $('.bluep4statthree').css('background-image', 'none');
                    $('.bluep4statthreeone').css('background', 'none');
                }, 5000);
        }
        if (event_user == playernameo1) {
            let x = document.getElementById("orangep1statoneo");
            let cssObj = window.getComputedStyle(x, null);
            let bgImage = cssObj.getPropertyValue("background-image");
            if (bgImage === "none") {
                $('.orangep1statone').css('background-image', type);
                $('.orangep1statoneone').css('background', orangegradient);
                Orangep1timeout1();
            } else {
                let x = document.getElementById("orangep1stattwot");
                let cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.orangep1stattwo').css('background-image', type);
                    $('.orangep1stattwoone').css('background', orangegradient);
                    Orangep1timeout2();
                } else {
                let x = document.getElementById("orangep1statthreet");
                let cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.orangep1statthree').css('background-image', type);
                    $('.orangep1statthreeone').css('background', orangegradient);
                    Orangep1timeout3();
            }
        }
    }
}
        if (event_user == playernameb1) {
            var x = document.getElementById("bluep1statoneo");
            const cssObj = window.getComputedStyle(x, null);
            let bgImage = cssObj.getPropertyValue("background-image");
            if (bgImage === "none") {
                $('.bluep1statone').css('background-image', type);
                $('.bluep1statoneone').css('background', bluegradient);
                Bluep1timeout1();
            } else {
                var x = document.getElementById("bluep1stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep1stattwo').css('background-image', type);
                    $('.bluep1stattwoone').css('background', bluegradient);
                    Bluep1timeout2();
                } else {
                    var x = document.getElementById("bluep1statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                        $('.bluep1statthree').css('background-image', type);
                        $('.bluep1statthreeone').css('background', bluegradient);
                        Bluep1timeout3();
                }
            }
        }
    }
        if (event_user == playernameo2) {
            var x = document.getElementById("orangep2statoneo");
            const cssObj = window.getComputedStyle(x, null);
            let bgImage = cssObj.getPropertyValue("background-image");
            if (bgImage === "none") {
                $('.orangep2statone').css('background-image', type);
                $('.orangep2statoneone').css('background', orangegradient);
                Orangep2timeout1();
            } else {
                var x = document.getElementById("orangep2stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                $('.orangep2stattwo').css('background-image', type);
                $('.orangep2stattwoone').css('background', orangegradient);
                Orangep2timeout2();
                } else {
                    var x = document.getElementById("orangep2statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                    $('.orangep2statthree').css('background-image', type);
                    $('.orangep2statthreeone').css('background', orangegradient);
                    Orangep2timeout3();
                }
            }
        }
    }
        if (event_user == playernameb2) {
                var x = document.getElementById("bluep2statoneo");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep2statone').css('background-image', type);
                    $('.bluep2statoneone').css('background', bluegradient);
                    Bluep2timeout1();
            } else {
                var x = document.getElementById("bluep2stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep2stattwo').css('background-image', type);
                    $('.bluep2stattwoone').css('background', bluegradient);
                    Bluep2timeout2();
                } else {
                    var x = document.getElementById("bluep2statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                        $('.bluep2statthree').css('background-image', type);
                        $('.bluep2statthreeone').css('background', bluegradient);
                        Bluep2timeout3();
                }
            }
        }
    }
        if (event_user == playernameo3) {
                var x = document.getElementById("orangep3statoneo");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.orangep3statone').css('background-image', type);
                    $('.orangep3statoneone').css('background', orangegradient);
                    Orangep3timeout1();
            } else {
                var x = document.getElementById("orangep3stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                $('.orangep3stattwo').css('background-image', type);
                $('.orangep3stattwoone').css('background', orangegradient);
                Orangep3timeout2();
                } else {
                    var x = document.getElementById("orangep3statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                    $('.orangep3statthree').css('background-image', type);
                    $('.orangep3statthreeone').css('background', orangegradient);
                    Orangep3timeout3();
                }
            }
        }
    }
        if (event_user == playernameb3) {
                var x = document.getElementById("bluep3statoneo");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep3statone').css('background-image', type);
                    $('.bluep3statoneone').css('background', bluegradient);
                    Bluep3timeout1();
            } else {
                var x = document.getElementById("bluep3stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep3stattwo').css('background-image', type);
                    $('.bluep3stattwoone').css('background', bluegradient);
                    Bluep3timeout2();
                } else {
                    var x = document.getElementById("bluep3statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                        $('.bluep3statthre').css('background-image', type);
                        $('.bluep3statthreone').css('background', bluegradient);
                        Bluep3timeout3();
                }
            }
        }
    }
        if (event_user == playernameo4) {
                var x = document.getElementById("orangep4statoneo");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                $('.orangep4statone').css('background-image', type);
                $('.orangep4statoneone').css('background', orangegradient);
                Orangep4timeout1();
            } else {
                var x = document.getElementById("orangep4stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                $('.orangep4stattwo').css('background-image', type);
                $('.orangep4stattwoone').css('background', orangegradient);
                Orangep4timeout2();
                } else {
                    var x = document.getElementById("orangep4statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                    $('.orangep4statthree').css('background-image', type);
                    $('.orangep4statthreeone').css('background', orangegradient);
                    Orangep4timeout3();
                }
            }
        }
    }
        if (event_user == playernameb4) {
                var x = document.getElementById("bluep4statoneo");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep4statone').css('background-image', type);
                    $('.bluep4statoneone').css('background', bluegradient);
                    Bluep4timeout1();
            } else {
                var x = document.getElementById("bluep4stattwot");
                const cssObj = window.getComputedStyle(x, null);
                let bgImage = cssObj.getPropertyValue("background-image");
                if (bgImage === "none") {
                    $('.bluep4stattwo').css('background-image', type);
                    $('.bluep4stattwoone').css('background', bluegradient);
                    Bluep4timeout2();
                } else {
                    var x = document.getElementById("bluep4statthreet");
                    const cssObj = window.getComputedStyle(x, null);
                    let bgImage = cssObj.getPropertyValue("background-image");
                    if (bgImage === "none") {
                        $('.bluep4statthree').css('background-image', type);
                        $('.bluep4statthreeone').css('background', bluegradient);
                        Bluep4timeout3();
                }
            }
        }
    }
})
WsSubscribers.subscribe("game", "match_ended", (d) => {
    const hiddenclasses = ['.orangeactiveboostcontainer', 'orangeactiveboost', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats',
    '#myDIV', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplayboxteam', '.activereplayboxwhite', '.activereplaybox', '.bluep4death', '.bluep3death', '.bluep2death',  '.bluep1death',
    '.orangep4death', '.orangep3death', '.orangep2death', '.orangep1death', '.bestof7', '.bestof5', '.bestof3', '.orangebestof4', '.orangebestof3', '.orangebestof2', '.orangebestof1', '.bluebestof4',
    '.bluebestof3', '.bluebestof2', '.bluebestof1', '.activeplayerteam', '.activeplayerwhite', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats',
    '.orangep3stats', '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2', '.blueplayer1',
    '.orangename', '.bluename', '.overtimetext', '.timer', '.bluescorenumber', '.orangescorenumber', '.scoreboardoverlayright', '.scoreboardoverlayleft', '.scoreboard', '.bluelogocontainer',
    '.orangelogocontainer', '.bluelogo', '.orangelogo', '.TornamentText', '.RightScoreBOS', '.RightScore', '.LeftScoreBOS', '.LeftScore', '.BestOfBackGround', '.bluep1ES', '.bluep1ES', '.bluep2ES', '.bluep3ES', '.bluep4ES', '.orangep1ES', '.orangep2ES', '.orangep3ES', '.orangep4ES', '.score', '.goals', '.shots', '.assists', '.saves', '.demos', '.endscoreboard',
    '.endscoreboardgrid', '.bluep1boost', '.bluep2boost', '.bluep3boost', '.bluep4boost', '.orangep1boost', '.orangep2boost', '.orangep3boost', '.orangep4boost'];
    for (var i of hiddenclasses) {
        $(i).css('visibility', 'hidden')}})
WsSubscribers.subscribe("game", "match_destroyed", (d) => {
    const classes = ['.orangeactiveboostcontainer', '.orangeactiveboost', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats',
    '#myDIV', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplayboxteam', '.activereplayboxwhite', '.activereplaybox', '.bluep4death', '.bluep3death', '.bluep2death',  '.bluep1death',
    '.orangep4death', '.orangep3death', '.orangep2death', '.orangep1death', '.bestof7', '.bestof5', '.bestof3', '.orangebestof4', '.orangebestof3', '.orangebestof2', '.orangebestof1', '.bluebestof4',
    '.bluebestof3', '.bluebestof2', '.bluebestof1', '.activeplayerteam', '.activeplayerwhite', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats',
    '.orangep3stats', '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2', '.blueplayer1',
    '.orangename', '.bluename', '.overtimetext', '.timer', '.bluescorenumber', '.orangescorenumber', '.scoreboardoverlayright', '.scoreboardoverlayleft', '.scoreboard', '.bluelogocontainer',
    '.orangelogocontainer', '.bluelogo', '.orangelogo', '.TornamentText', '.RightScoreBOS', '.RightScore', '.LeftScoreBOS', '.LeftScore', '.BestOfBackGround', '.bluep1ES', '.bluep2ES',
    '.bluep3ES', '.bluep4ES', '.orangep1ES', '.orangep2ES', '.orangep3ES', '.orangep4ES', '.score', '.goals', '.shots', '.assists', '.saves', '.demos', '.endscoreboard', '.endscoreboardgrid', '.blueGradient', '.orangeGradient', '.bluep1boost', '.bluep2boost', '.bluep3boost', '.bluep4boost', '.orangep1boost', '.orangep2boost', '.orangep3boost', '.orangep4boost'];
    for (var i of classes) {
        $(i).css('visibility', 'hidden')}})
WsSubscribers.subscribe("game", "podium_start", (d) => {
    const hiddenclasses = ['.orangeactiveboostcontainer', '.orangeactiveboost', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats',
    '#myDIV', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplayboxteam', '.activereplayboxwhite', '.activereplaybox', '.bluep4death', '.bluep3death', '.bluep2death',  '.bluep1death',
    '.orangep4death', '.orangep3death', '.orangep2death', '.orangep1death', '.activeplayerteam', '.activeplayerwhite', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats',
    '.orangep3stats', '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2', '.blueplayer1', '.bluep1boost', '.bluep2boost', '.bluep3boost', '.bluep4boost', '.orangep1boost', '.orangep2boost', '.orangep3boost', '.orangep4boost'];
    for (var i of hiddenclasses) {
        $(i).css('visibility', 'hidden')}
        const classes = ['.bluep1ES', '.bluep1ES', '.bluep2ES', '.bluep3ES', '.bluep4ES', '.orangep1ES', '.orangep2ES', '.orangep3ES', '.orangep4ES', '.score', '.goals', '.shots', '.assists', '.saves', '.demos', '.endscoreboard',
        '.endscoreboardgrid'];
       for (var i of classes) {
           $(i).css('visibility', 'visible')}})
WsSubscribers.subscribe("game", "match_created", (d) => {
    const classes = ['.bluep1ES', '.bluep2ES', '.bluep3ES', '.bluep4ES', '.orangep1ES', '.orangep2ES', '.orangep3ES', '.orangep4ES', '.score', '.goals',
    '.shots', '.assists', '.saves', '.demos', '.endscoreboard', '.endscoreboardgrid'];
    for (var i of classes) {
        $(i).css('visibility', 'hidden')}
})
WsSubscribers.subscribe("game", "replay_end", (d) => {
    $('.replay').css('visibility', 'hidden')
})
WsSubscribers.subscribe("game", "pre_countdown_begin", (d) => {
    $('.replay').css('visibility', 'hidden')
})
WsSubscribers.subscribe("wsRelay", "info", (d) => {
    $('.offline').css('visibility', 'hidden')
})
