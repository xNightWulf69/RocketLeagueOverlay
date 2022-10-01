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
            let jEvent = JSON.parse(event.data);
            if (!jEvent.hasOwnProperty('event')) {
                return;
            }
            let eventSplit = jEvent.event.split(':');
            let channel = eventSplit[0];
            let event_event = eventSplit[1];
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
            let channel = channels;
            channels = [];
            channels.push(channel);
        }
        if (typeof events === "string") {
            let event = events;
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
        })
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
            let cEvent = channel + ":" + event;
            WsSubscribers.webSocket.send(JSON.stringify({
                'event': cEvent,
                'data': data
            }));
        }
    }
};
///
$(() => {
    WsSubscribers.init(49322, true);
    WsSubscribers.subscribe("game", "update_state", (d) => {
        $('.scoreboardoverlayleft').css('visibility', 'visible')
        $('.scoreboardoverlayright').css('visibility', 'visible')
        $('.scoreboard').css('visibility', 'visible')
        $('.timer').css('visibility', 'visible')
        $('.orangescorenumber').css('visibility', 'visible')
        $('.bluescorenumber').css('visibility', 'visible')
        $('.orangename').css('visibility', 'visible')
        $('.bluename').css('visibility', 'visible')
        var blueName = (d['game']['teams'][0]['name'])
        var orangeName = (d['game']['teams'][1]['name'])
        var blueColor = '#' + (d['game']['teams'][0]['color_primary'])
        var orangeColor = '#' + (d['game']['teams'][1]['color_primary'])
        var blueColorSecondary = '#' + (d['game']['teams'][0]['color_secondary'])
        var orangeColorSecondary = '#' + (d['game']['teams'][1]['color_secondary'])
        var time = (d['game']['time_seconds'])
        var round = Math.ceil(time)
        $('.scoreblue, .goalsblue, .shotsblue, .assistsblue, .savesblue, .demosblue').css('background-color', blueColor)
        $('.score, .goals, .shots, .assists, .saves, .demos').css('background-color', orangeColor)

        function myTime(time) {
            var min = ~~((time % 3600) / 60);
            var sec = time % 60;
            var sec_min = "";
            sec_min += "" + min + ":" + (sec < 10 ? "0" : "");
            sec_min += "" + sec;
            return sec_min;
        }
        ///Scoreboard stuff///
        $(".timer").text(myTime(round))
        $(".bluename").text(blueName);
        $(".orangename").text(orangeName);
        $(".bluename").css('color', blueColor);
        $(".orangename").css('color', orangeColor);
        var gradient = 'linear-gradient(0.25turn, ' + blueColor + ', ' + orangeColor
        var boostGradientBlue = 'linear-gradient(0.25turn, ' + blueColorSecondary + ', ' + blueColor
        var boostGradientOrange = 'linear-gradient(0.25turn, ' + orangeColor + ', ' + orangeColorSecondary
        $(".overtime").css('border-image', gradient);
        $(".overtimeunderline").css('background', gradient);
        $(".scoreboardoverlayleft").css('fill', blueColor);
        $(".scoreboardoverlayright").css('fill', orangeColor);
        $(".bluescorenumber").text(d['game']['teams'][0]['score']);
        $(".orangescorenumber").text(d['game']['teams'][1]['score']);
        if ((d['game']['isOT']) == true) {
            $('.overtime').css('visibility', 'visible')
            $('.overtimetext').css('visibility', 'visible')
            $('.overtimeunderline').css('visibility', 'hidden')
        } else {
            $('.overtime').css('visibility', 'hidden')
            $('.overtimetext').css('visibility', 'hidden')
            $('.overtimeunderline').css('visibility', 'visible')
        }
        $('.blueactiveboost').css('background', boostGradientBlue)
        $('.orangeactiveboost').css('background', boostGradientOrange)
        $('.activeplayerteam').css('fill', boostGradientBlue)
            ///Player stuff///
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
        ///Blue Player 1///
        if (d['players'][Object.keys(team0)[0]] != undefined) {
            $('.bluep1name').text(d['players'][Object.keys(team0)[0]]['name'])
            $('.bluep1goals').text(d['players'][Object.keys(team0)[0]]['goals'])
            $('.bluep1assists').text(d['players'][Object.keys(team0)[0]]['assists'])
            $('.bluep1saves').text(d['players'][Object.keys(team0)[0]]['saves'])
            $('.bluep1shots').text(d['players'][Object.keys(team0)[0]]['shots'])
            $('.bluep1boost').width(d['players'][Object.keys(team0)[0]]['boost'] + "%")
            $('.bluep1boostnumber').text(d['players'][Object.keys(team0)[0]]['boost'] + "%")
            $('.bluep1boost').css('background', boostGradientBlue)
            $('.bluep1stats').css('visibility', 'visible')
            $('.blueplayer1').css('visibility', 'visible')
            localStorage.setItem('bp1', d['players'][Object.keys(team0)[0]]['name']);
            if (d['players'][Object.keys(team0)[0]]['isDead'] == true) {
                $('.bluep1death').css('visibility', 'visible')
                $('.bluep1name').css('color', 'red')
            } else {
                $('.bluep1death').css('visibility', 'hidden')
                $('.bluep1name').css('color', 'white')
            }
        } else {
            $('.bluep1stats').css('visibility', 'hidden')
            $('.blueplayer1').css('visibility', 'hidden')
        }
        ///Blue Player 2///
        if (d['players'][Object.keys(team0)[1]] != undefined) {
            $('.bluep2name').text(d['players'][Object.keys(team0)[1]]['name'])
            $('.bluep2goals').text(d['players'][Object.keys(team0)[1]]['goals'])
            $('.bluep2assists').text(d['players'][Object.keys(team0)[1]]['assists'])
            $('.bluep2saves').text(d['players'][Object.keys(team0)[1]]['saves'])
            $('.bluep2shots').text(d['players'][Object.keys(team0)[1]]['shots'])
            $('.bluep2boost').width(d['players'][Object.keys(team0)[1]]['boost'] + "%")
            $('.bluep2boostnumber').text(d['players'][Object.keys(team0)[1]]['boost'] + "%")
            $('.bluep2boost').css('background', boostGradientBlue)
            $('.bluep2stats').css('visibility', 'visible')
            $('.blueplayer2').css('visibility', 'visible')
            localStorage.setItem('bp2', d['players'][Object.keys(team0)[1]]['name']);
            if (d['players'][Object.keys(team0)[1]]['isDead'] == true) {
                $('.bluep2death').css('visibility', 'visible')
                $('.bluep2name').css('color', 'red')
            } else {
                $('.bluep2death').css('visibility', 'hidden')
                $('.bluep2name').css('color', 'white')
            }
        } else {
            $('.bluep2stats').css('visibility', 'hidden')
            $('.blueplayer2').css('visibility', 'hidden')
        }
        ///Blue Player 3///
        if (d['players'][Object.keys(team0)[2]] != undefined) {
            $('.bluep3name').text(d['players'][Object.keys(team0)[2]]['name'])
            $('.bluep3goals').text(d['players'][Object.keys(team0)[2]]['goals'])
            $('.bluep3assists').text(d['players'][Object.keys(team0)[2]]['assists'])
            $('.bluep3saves').text(d['players'][Object.keys(team0)[2]]['saves'])
            $('.bluep3shots').text(d['players'][Object.keys(team0)[2]]['shots'])
            $('.bluep3boost').width(d['players'][Object.keys(team0)[2]]['boost'] + "%")
            $('.bluep3boostnumber').text(d['players'][Object.keys(team0)[2]]['boost'] + "%")
            $('.bluep3boost').css('background', boostGradientBlue)
            $('.bluep3stats').css('visibility', 'visible')
            $('.blueplayer3').css('visibility', 'visible')
            localStorage.setItem('bp3', d['players'][Object.keys(team0)[2]]['name']);
            if (d['players'][Object.keys(team0)[2]]['isDead'] == true) {
                $('.bluep3death').css('visibility', 'visible')
                $('.bluep3name').css('color', 'red')
            } else {
                $('.bluep3death').css('visibility', 'hidden')
                $('.bluep3name').css('color', 'white')
            }
        } else {
            $('.bluep3stats').css('visibility', 'hidden')
            $('.blueplayer3').css('visibility', 'hidden')
        }
        ///Blue Player 4///
        if (d['players'][Object.keys(team0)[3]] != undefined) {
            $('.bluep4name').text(d['players'][Object.keys(team0)[3]]['name'])
            $('.bluep4goals').text(d['players'][Object.keys(team0)[3]]['goals'])
            $('.bluep4assists').text(d['players'][Object.keys(team0)[3]]['assists'])
            $('.bluep4saves').text(d['players'][Object.keys(team0)[3]]['saves'])
            $('.bluep4shots').text(d['players'][Object.keys(team0)[3]]['shots'])
            $('.bluep4boost').width(d['players'][Object.keys(team0)[3]]['boost'] + "%")
            $('.bluep4boostnumber').text(d['players'][Object.keys(team0)[3]]['boost'] + "%")
            $('.bluep4boost').css('background', boostGradientBlue)
            $('.bluep4stats').css('visibility', 'visible')
            $('.blueplayer4').css('visibility', 'visible')
            localStorage.setItem('bp4', d['players'][Object.keys(team0)[3]]['name']);
            if (d['players'][Object.keys(team0)[3]]['isDead'] == true) {
                $('.bluep4death').css('visibility', 'visible')
                $('.bluep4name').css('color', 'red')
            } else {
                $('.bluep4death').css('visibility', 'hidden')
                $('.bluep4name').css('color', 'white')
            }
        } else {
            $('.bluep4stats').css('visibility', 'hidden')
            $('.blueplayer4').css('visibility', 'hidden')
        }
        ///Orange Player 1///
        if (d['players'][Object.keys(team1)[0]] != undefined) {
            $('.orangep1name').text(d['players'][Object.keys(team1)[0]]['name'])
            $('.orangep1goals').text(d['players'][Object.keys(team1)[0]]['goals'])
            $('.orangep1assists').text(d['players'][Object.keys(team1)[0]]['assists'])
            $('.orangep1saves').text(d['players'][Object.keys(team1)[0]]['saves'])
            $('.orangep1shots').text(d['players'][Object.keys(team1)[0]]['shots'])
            $('.orangep1boost').width(d['players'][Object.keys(team1)[0]]['boost'] + "%")
            $('.orangep1boostnumber').text(d['players'][Object.keys(team1)[0]]['boost'] + "%")
            $('.orangep1boost').css('background', boostGradientOrange)
            $('.orangep1stats').css('visibility', 'visible')
            $('.orangeplayer1').css('visibility', 'visible')
            localStorage.setItem('op1', d['players'][Object.keys(team1)[0]]['name']);
            if (d['players'][Object.keys(team1)[0]]['isDead'] == true) {
                $('.orangep1death').css('visibility', 'visible')
                $('.orangep1name').css('color', 'red')
            } else {
                $('.orangep1death').css('visibility', 'hidden')
                $('.orangep1name').css('color', 'white')
            }
        } else {
            $('.orangep1stats').css('visibility', 'hidden')
            $('.orangeplayer1').css('visibility', 'hidden')
        }
        ///Orange Player 2///
        if (d['players'][Object.keys(team1)[1]] != undefined) {
            $('.orangep2name').text(d['players'][Object.keys(team1)[1]]['name'])
            $('.orangep2goals').text(d['players'][Object.keys(team1)[1]]['goals'])
            $('.orangep2assists').text(d['players'][Object.keys(team1)[1]]['assists'])
            $('.orangep2saves').text(d['players'][Object.keys(team1)[1]]['saves'])
            $('.orangep2shots').text(d['players'][Object.keys(team1)[1]]['shots'])
            $('.orangep2boost').width(d['players'][Object.keys(team1)[1]]['boost'] + "%")
            $('.orangep2boostnumber').text(d['players'][Object.keys(team1)[1]]['boost'] + "%")
            $('.orangep2boost').css('background', boostGradientOrange)
            $('.orangep2stats').css('visibility', 'visible')
            $('.orangeplayer2').css('visibility', 'visible')
            localStorage.setItem('op2', d['players'][Object.keys(team1)[1]]['name']);
            if (d['players'][Object.keys(team1)[1]]['isDead'] == true) {
                $('.orangep2death').css('visibility', 'visible')
                $('.orangep2name').css('color', 'red')
            } else {
                $('.orangep2death').css('visibility', 'hidden')
                $('.orangep2name').css('color', 'white')
            }
        } else {
            $('.orangep2stats').css('visibility', 'hidden')
            $('.orangeplayer2').css('visibility', 'hidden')
        }
        ///Orange Player 3///
        if (d['players'][Object.keys(team1)[2]] != undefined) {
            $('.orangep3name').text(d['players'][Object.keys(team1)[2]]['name'])
            $('.orangep3goals').text(d['players'][Object.keys(team1)[2]]['goals'])
            $('.orangep3assists').text(d['players'][Object.keys(team1)[2]]['assists'])
            $('.orangep3saves').text(d['players'][Object.keys(team1)[2]]['saves'])
            $('.orangep3shots').text(d['players'][Object.keys(team1)[2]]['shots'])
            $('.orangep3boost').width(d['players'][Object.keys(team1)[2]]['boost'] + "%")
            $('.orangep3boostnumber').text(d['players'][Object.keys(team1)[2]]['boost'] + "%")
            $('.orangep3boost').css('background', boostGradientOrange)
            $('.orangep3stats').css('visibility', 'visible')
            $('.orangeplayer3').css('visibility', 'visible')
            localStorage.setItem('op3', d['players'][Object.keys(team1)[2]]['name']);
            if (d['players'][Object.keys(team1)[2]]['isDead'] == true) {
                $('.orangep3death').css('visibility', 'visible')
                $('.orangep3name').css('color', 'red')
            } else {
                $('.orangep3death').css('visibility', 'hidden')
                $('.orangep3name').css('color', 'white')
            }
        } else {
            $('.orangep3stats').css('visibility', 'hidden')
            $('.orangeplayer3').css('visibility', 'hidden')
        }
        ///Orange Player 4///
        if (d['players'][Object.keys(team1)[3]] != undefined) {
            $('.orangep4name').text(d['players'][Object.keys(team1)[3]]['name'])
            $('.orangep4goals').text(d['players'][Object.keys(team1)[3]]['goals'])
            $('.orangep4assists').text(d['players'][Object.keys(team1)[3]]['assists'])
            $('.orangep4saves').text(d['players'][Object.keys(team1)[3]]['saves'])
            $('.orangep4shots').text(d['players'][Object.keys(team1)[3]]['shots'])
            $('.orangep4boost').width(d['players'][Object.keys(team1)[3]]['boost'] + "%")
            $('.orangep4boostnumber').text(d['players'][Object.keys(team1)[3]]['boost'] + "%")
            $('.orangep4boost').css('background', boostGradientOrange)
            $('.orangep4stats').css('visibility', 'visible')
            $('.orangeplayer4').css('visibility', 'visible')
            localStorage.setItem('op4', d['players'][Object.keys(team1)[3]]['name']);
            if (d['players'][Object.keys(team1)[3]]['isDead'] == true) {
                $('.orangep4death').css('visibility', 'visible')
                $('.orangep4name').css('color', 'red')
            } else {
                $('.orangep4death').css('visibility', 'hidden')
                $('.orangep4name').css('color', 'white')
            }
        } else {
            $('.orangep4stats').css('visibility', 'hidden')
            $('.orangeplayer4').css('visibility', 'hidden')
        }
        if (d['game']['time_milliseconds'] == 300 && d['game']['time_seconds'] == 0) {
            $('.activereplaybox, .activereplayboxwhite, .activereplayboxteam, .replaybox').css('visibility', 'hidden')
        }
        var activeTarget = (d['game']['target'])
        var players = (d['players'])
        let activePlayerData = d.players[d.game.target];


        if (activeTarget.length > 1) {
            if (activePlayerData.team == 0) {
                $('.activeplayerteam').css('background-color', blueColor)
                $('.blueactivename').text(activePlayerData.name)
                $('.blueactivegoals').text(activePlayerData.goals)
                $('.blueactivedemos').text(activePlayerData.demos)
                $('.blueactiveshots').text(activePlayerData.shots)
                $('.blueactivesaves').text(activePlayerData.saves)
                $('.blueactiveassists').text(activePlayerData.assists)
                $('.blueactiveboost').width(activePlayerData.boost + "%")
                $('.blueactiveboostnumber').text(activePlayerData.boost + "%")
                $('.blueactivespeeds').text(activePlayerData.speed + " KPH")
                $('.orangeactivestats').css('visibility', 'hidden')
                $('.blueactivestats').css('visibility', 'visible')
                $('.activeplayerwhite').css('visibility', 'visible')
                $('.activeplayerteam').css('visibility', 'visible')
                $('.activeplayer').css('visibility', 'visible')
                $('.blueactivestats').css('visibility', 'visible')
                $('.blueactivename').css('visibility', 'visible')
                $('.blueactivetable').css('visibility', 'visible')
                $('.blueactiveboostcontainer').css('visibility', 'visible')
                $('.orangeactivestats').css('visibility', 'hidden')
                $('.orangeactivename').css('visibility', 'hidden')
                $('.orangeactivetable').css('visibility', 'hidden')
                $('.orangeactiveboostcontainer').css('visibility', 'hidden')
            } else if (activePlayerData.team == 1) {
                $('.activeplayerteam').css('background-color', orangeColor)
                $('.orangeactivename').text(activePlayerData.name)
                $('.orangeactivegoals').text(activePlayerData.goals)
                $('.orangeactivedemos').text(activePlayerData.demos)
                $('.orangeactiveshots').text(activePlayerData.shots)
                $('.orangeactivesaves').text(activePlayerData.saves)
                $('.orangeactiveassists').text(activePlayerData.assists)
                $('.orangeactiveboost').width(activePlayerData.boost + "%")
                $('.orangeactiveboostnumber').text(activePlayerData.boost + "%")
                $('.orangeactivespeeds').text(activePlayerData.speed + " KPH")
                $('.orangeactivestats').css('visibility', 'visible')
                $('.blueactivestats').css('visibility', 'hidden')
                $('.orangeactiveboost').css('background-color', orangeColor)
                $('.activeplayerwhite').css('visibility', 'visible')
                $('.activeplayerteam').css('visibility', 'visible')
                $('.activeplayer').css('visibility', 'visible')
                $('.orangeactivestats').css('visibility', 'visible')
                $('.orangeactivename').css('visibility', 'visible')
                $('.orangeactivetable').css('visibility', 'visible')
                $('.orangeactiveboostcontainer').css('visibility', 'visible')
                $('.blueactivestats').css('visibility', 'hidden')
                $('.blueactivename').css('visibility', 'hidden')
                $('.blueactivetable').css('visibility', 'hidden')
                $('.blueactiveboostcontainer').css('visibility', 'hidden')
            } else {
                $('.orangeactivestats').css('visibility', 'hidden')
                $('.blueactivestats').css('visibility', 'hidden')
                $('.activeplayer').css('visibility', 'hidden')
                $('.activeplayerwhite').css('visibility', 'hidden')
                $('.orangeactivestats').css('visibility', 'hidden')
                $('.orangeactivename').css('visibility', 'hidden')
                $('.orangeactivetable').css('visibility', 'hidden')
                $('.orangeactiveboostcontainer').css('visibility', 'hidden')
                $('.blueactivestats').css('visibility', 'hidden')
                $('.blueactivename').css('visibility', 'hidden')
                $('.blueactivetable').css('visibility', 'hidden')
                $('.blueactiveboostcontainer').css('visibility', 'hidden')
            }
        } else {
            $('.orangeactivestats').css('visibility', 'hidden')
            $('.blueactivestats').css('visibility', 'hidden')
            $('.activeplayer').css('visibility', 'hidden')
            $('.activeplayerwhite').css('visibility', 'hidden')
            $('.activeplayerteam').css('visibility', 'hidden')
            $('.orangeactivestats').css('visibility', 'hidden')
            $('.orangeactivename').css('visibility', 'hidden')
            $('.orangeactivetable').css('visibility', 'hidden')
            $('.orangeactiveboostcontainer').css('visibility', 'hidden')
            $('.blueactivestats').css('visibility', 'hidden')
            $('.blueactivename').css('visibility', 'hidden')
            $('.blueactivetable').css('visibility', 'hidden')
            $('.blueactiveboostcontainer').css('visibility', 'hidden')
        }
        if (d['game']['isReplay'] == true) {
            $('.orangeactivestats').css('visibility', 'hidden')
            $('.blueactivestats').css('visibility', 'hidden')
            $('.activeplayer').css('visibility', 'hidden')
            $('.activeplayerwhite').css('visibility', 'hidden')
            $('.activeplayerteam').css('visibility', 'hidden')
            $('.replaybox').css('visibility', 'visible')
            $('.replayactivegoals').css('visibility', 'visible')
            $('.replayactiveassists').css('visibility', 'visible')
            $('.activereplayboxteam').css('visibility', 'visible')
            $('.activereplayboxwhite').css('visibility', 'visible')
            $('.activereplaybox').css('visibility', 'visible')
            $('.orangeactivestats').css('visibility', 'hidden')
            $('.orangeactivename').css('visibility', 'hidden')
            $('.orangeactivetable').css('visibility', 'hidden')
            $('.orangeactiveboostcontainer').css('visibility', 'hidden')
            $('.blueactivestats').css('visibility', 'hidden')
            $('.blueactivename').css('visibility', 'hidden')
            $('.blueactivetable').css('visibility', 'hidden')
            $('.blueactiveboostcontainer').css('visibility', 'hidden')
        } else {
            $('.replaybox').css('visibility', 'hidden')
            $('.replayactivegoals').css('visibility', 'hidden')
            $('.replayactiveassists').css('visibility', 'hidden')
            $('.activereplayboxteam').css('visibility', 'hidden')
            $('.activereplayboxwhite').css('visibility', 'hidden')
            $('.activereplaybox').css('visibility', 'hidden')
        }
        if (d['game']['time_milliseconds'] == 300 && d['game']['time_seconds'] == 0) {
            $('.replaybox, .replayactivegoals, .activeplayerwhite, .activereplaybox').css('visibility', 'hidden')
            $('.blueplayer1').css('visibility', 'hidden')
            $('.blueplayer2').css('visibility', 'hidden')
            $('.blueplayer3').css('visibility', 'hidden')
            $('.blueplayer4').css('visibility', 'hidden')
            $('.orangeplayer1').css('visibility', 'hidden')
            $('.orangeplayer2').css('visibility', 'hidden')
            $('.orangeplayer3').css('visibility', 'hidden')
            $('.orangeplayer4').css('visibility', 'hidden')
            $('.orangep1stats').css('visibility', 'hidden')
            $('.orangep2stats').css('visibility', 'hidden')
            $('.orangep3stats').css('visibility', 'hidden')
            $('.orangep4stats').css('visibility', 'hidden')
            $('.bluep1stats').css('visibility', 'hidden')
            $('.bluep2stats').css('visibility', 'hidden')
            $('.bluep3stats').css('visibility', 'hidden')
            $('.bluep4stats').css('visibility', 'hidden')
            $('.activeplayer').css('visibility', 'hidden')
            $('.activeplayerwhite').css('visibility', 'hidden')
            $('.activeplayerteam').css('visibility', 'hidden')
            $('.bluebestof1').css('visibility', 'hidden')
            $('.bluebestof2').css('visibility', 'hidden')
            $('.bluebestof3').css('visibility', 'hidden')
            $('.bluebestof4').css('visibility', 'hidden')
            $('.orangebestof1').css('visibility', 'hidden')
            $('.orangebestof2').css('visibility', 'hidden')
            $('.orangebestof3').css('visibility', 'hidden')
            $('.orangebestof4').css('visibility', 'hidden')
            $('.bestof3').css('visibility', 'hidden')
            $('.bestof5').css('visibility', 'hidden')
            $('.bestof7').css('visibility', 'hidden')
            $('.orangep1death').css('visibility', 'hidden')
            $('.orangep2death').css('visibility', 'hidden')
            $('.orangep3death').css('visibility', 'hidden')
            $('.orangep4death').css('visibility', 'hidden')
            $('.bluep1death').css('visibility', 'hidden')
            $('.bluep2death').css('visibility', 'hidden')
            $('.bluep3death').css('visibility', 'hidden')
            $('.bluep4death').css('visibility', 'hidden')
            $('.activereplaybox').css('visibility', 'hidden')
            $('.activereplayboxwhite').css('visibility', 'hidden')
            $('.activereplayboxteam').css('visibility', 'hidden')
            $('.replaybox').css('visibility', 'hidden')
            $('.replayactivegoals').css('visibility', 'hidden')
            $('.replayactiveassists').css('visibility', 'hidden')
            $('#myDIV').css('display', 'none')
            $('.blueactivestats').css('visibility', 'hidden')
            $('.blueactivename').css('visibility', 'hidden')
            $('.blueactivetable').css('visibility', 'hidden')
            $('.blueactiveboostcontainer').css('visibility', 'hidden')
            $('.orangeactivestats').css('visibility', 'hidden')
            $('.orangeactivename').css('visibility', 'hidden')
            $('.orangeactivetable').css('visibility', 'hidden')
            $('.orangeactiveboostcontainer').css('visibility', 'hidden')
        }
        var bob1 = localStorage.getItem("bwin1");
        if (bob1 === 'true') {
            $('.bluebestof1').css('background', 'white')
        } else {
            $('.bluebestof1').css('background', 'black')
        }
        var bob2 = localStorage.getItem("bwin2");
        if (bob2 === 'true') {
            $('.bluebestof2').css('background', 'white')
        } else {
            $('.bluebestof2').css('background', 'black')
        }
        var bob3 = localStorage.getItem("bwin3");
        if (bob3 === 'true') {
            $('.bluebestof3').css('background', 'white')
        } else {
            $('.bluebestof3').css('background', 'black')
        }
        var bob4 = localStorage.getItem("bwin4");
        if (bob4 === 'true') {
            $('.bluebestof4').css('background', 'white')
        } else {
            $('.bluebestof4').css('background', 'black')
        }
        var oob1 = localStorage.getItem("owin1");
        if (oob1 === 'true') {
            $('.orangebestof1').css('background', 'white')
        } else {
            $('.orangebestof1').css('background', 'black')
        }
        var oob2 = localStorage.getItem("owin2");
        if (oob2 === 'true') {
            $('.orangebestof2').css('background', 'white')
        } else {
            $('.orangebestof2').css('background', 'black')
        }
        var oob3 = localStorage.getItem("owin3");
        if (oob3 === 'true') {
            $('.orangebestof3').css('background', 'white')
        } else {
            $('.orangebestof3').css('background', 'black')
        }
        var oob4 = localStorage.getItem("owin4");
        if (oob4 === 'true') {
            $('.orangebestof4').css('background', 'white')
        } else {
            $('.orangebestof4').css('background', 'black')
        }
        var bestof3 = localStorage.getItem("bestof3");
        if (bestof3 === 'true') {
            $('.bestof3').css('visibility', 'visible')
            $('.bestof5').css('visibility', 'hidden')
            $('.bestof7').css('visibility', 'hidden')
            $('.bluebestof1').css('visibility', 'visible')
            $('.bluebestof2').css('visibility', 'visible')
            $('.bluebestof3').css('visibility', 'hidden')
            $('.bluebestof4').css('visibility', 'hidden')
            $('.orangebestof1').css('visibility', 'visible')
            $('.orangebestof2').css('visibility', 'visible')
            $('.orangebestof3').css('visibility', 'hidden')
            $('.orangebestof4').css('visibility', 'hidden')
        } else {
            $('.bestof3').css('visibility', 'hidden')
        }
        var bestof5 = localStorage.getItem("bestof5");
        if (bestof5 === 'true') {
            $('.bestof5').css('visibility', 'visible')
            $('.bestof3').css('visibility', 'hidden')
            $('.bestof7').css('visibility', 'hidden')
            $('.bluebestof1').css('visibility', 'visible')
            $('.bluebestof2').css('visibility', 'visible')
            $('.bluebestof3').css('visibility', 'visible')
            $('.bluebestof4').css('visibility', 'hidden')
            $('.orangebestof1').css('visibility', 'visible')
            $('.orangebestof2').css('visibility', 'visible')
            $('.orangebestof3').css('visibility', 'visible')
            $('.orangebestof4').css('visibility', 'hidden')
        } else {
            $('.bestof5').css('visibility', 'hidden')
        }
        var bestof7 = localStorage.getItem("bestof7");
        if (bestof7 === 'true') {
            $('.bestof7').css('visibility', 'visible')
            $('.bestof3').css('visibility', 'hidden')
            $('.bestof5').css('visibility', 'hidden')
            $('.bluebestof1').css('visibility', 'visible')
            $('.bluebestof2').css('visibility', 'visible')
            $('.bluebestof3').css('visibility', 'visible')
            $('.bluebestof4').css('visibility', 'visible')
            $('.orangebestof1').css('visibility', 'visible')
            $('.orangebestof2').css('visibility', 'visible')
            $('.orangebestof3').css('visibility', 'visible')
            $('.orangebestof4').css('visibility', 'visible')
        } else {
            $('.bestof7').css('visibility', 'hidden')
        }
        if (bestof3 == undefined && bestof5 == undefined && bestof7 == undefined) {
            $('.bluebestof1').css('visibility', 'hidden')
            $('.bluebestof2').css('visibility', 'hidden')
            $('.bluebestof3').css('visibility', 'hidden')
            $('.bluebestof4').css('visibility', 'hidden')
            $('.orangebestof1').css('visibility', 'hidden')
            $('.orangebestof2').css('visibility', 'hidden')
            $('.orangebestof3').css('visibility', 'hidden')
            $('.orangebestof4').css('visibility', 'hidden')
        }
    })
})
WsSubscribers.subscribe("game", "update_state", (dat) => {
    WsSubscribers.subscribe("game", "goal_scored", (date) => {
        var blue = '#' + (dat['game']['teams'][0]['color_primary'])
        var orange = '#' + (dat['game']['teams'][1]['color_primary'])
        if (date['assister']['name'] != "") {
            var assister = (date['assister']['name'])
            $('.replayactiveassist').css('opacity', '1')
        } else {
            var assister = ("")
            $('.replayactiveassist').css('opacity', '0')
        }
        var ballspeed = (Math.round(date['goalspeed']) + " KPH")
        var scorer = (date['scorer']['name'])
        if (date['scorer']['teamnum'] == 0) {
            $('.activereplayboxteam').css('background', blue)
        } else {
            $('.activereplayboxteam').css('background', orange)
        }
        $(".replayactivegoals").text(scorer);
        $(".replayactiveassists").text(assister);
        $(".replayactivespeed").text(ballspeed);
    })
})
WsSubscribers.subscribe("game", "update_state", (stat) => {
    WsSubscribers.subscribe("game", "statfeed_event", (data) => {
        var event_type = (data['event_name'])
        var event_user = (data['main_target']['name'])
        var blueColor = '#' + (stat['game']['teams'][0]['color_primary'])
        var orangeColor = '#' + (stat['game']['teams'][1]['color_primary'])
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
        if (event_user == playernameo1) {
            if (secondslot.includes(event_type)) {
                $('.orangep1stattwo').css('background-image', type)
                $('.orangep1stattwoone').css('background', orangegradient)
                Orangep1timeout2();
            } else {
                $('.orangep1statone').css('background-image', type)
                $('.orangep1statoneone').css('background', orangegradient)
                Orangep1timeout1();
            }
        }
        if (event_user == playernameb1) {
            if (secondslot.includes(event_type)) {
                $('.bluep1stattwo').css('background-image', type)
                $('.bluep1stattwoone').css('background', bluegradient)
                Bluep1timeout2();
            } else {
                $('.bluep1statone').css('background-image', type)
                $('.bluep1statoneone').css('background', bluegradient)
                Bluep1timeout1();
            }
        }
        if (event_user == playernameo2) {
            if (secondslot.includes(event_type)) {
                $('.orangep2stattwo').css('background-image', type)
                $('.orangep2stattwoone').css('background', orangegradient)
                Orangep2timeout2();
            } else {
                $('.orangep2statone').css('background-image', type)
                $('.orangep2statoneone').css('background', orangegradient)
                Orangep2timeout1();
            }
        }
        if (event_user == playernameb2) {
            if (secondslot.includes(event_type)) {
                $('.bluep2stattwo').css('background-image', type)
                $('.bluep2stattwoone').css('background', bluegradient)
                Bluep2timeout2();
            } else {
                $('.bluep2statone').css('background-image', type)
                $('.bluep2statoneone').css('background', bluegradient)
                Bluep2timeout1();
            }
        }
        if (event_user == playernameo3) {
            if (secondslot.includes(event_type)) {
                $('.orangep3stattwo').css('background-image', type)
                $('.orangep3stattwoone').css('background', orangegradient)
                Orangep3timeout2();
            } else {
                $('.orangep3statone').css('background-image', type)
                $('.orangep3statoneone').css('background', orangegradient)
                Orangep3timeout1();
            }
        }
        if (event_user == playernameb3) {
            if (secondslot.includes(event_type)) {
                $('.bluep3stattwo').css('background-image', type)
                $('.bluep3stattwoone').css('background', bluegradient)
                Bluep3timeout2();
            } else {
                $('.bluep3statone').css('background-image', type)
                $('.bluep3statoneone').css('background', bluegradient)
                Bluep3timeout1();
            }
        }
        if (event_user == playernameo4) {
            if (secondslot.includes(event_type)) {
                $('.orangep4stattwo').css('background-image', type)
                $('.orangep4stattwoone').css('background', orangegradient)
                Orangep4timeout2();
            } else {
                $('.orangep4statone').css('background-image', type)
                $('.orangep4statoneone').css('background', orangegradient)
                Orangep4timeout1();
            }
        }
        if (event_user == playernameb4) {
            if (secondslot.includes(event_type)) {
                $('.bluep4stattwo').css('background-image', type)
                $('.bluep4stattwoone').css('background', bluegradient)
                Bluep4timeout2();
            } else {
                $('.bluep4statone').css('background-image', type)
                $('.bluep4statoneone').css('background', bluegradient)
                Bluep4timeout1();
            }
        }
    })
})
WsSubscribers.subscribe("game", "match_ended", (d) => {
    const classes = ['.orangeactiveboostcontainer', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats', 
    '#myDIV', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplayboxteam', '.activereplayboxwhite', '.activereplaybox', '.bluep4death', '.bluep3death', '.bluep2death',  '.bluep1death', 
    '.orangep4death', '.orangep3death', '.orangep2death', '.orangep1death', '.bestof7', '.bestof5', '.bestof3', '.orangebestof4', '.orangebestof3', '.orangebestof2', '.orangebestof1', '.bluebestof4', 
    '.bluebestof3', '.bluebestof2', '.bluebestof1', '.activeplayerteam', '.activeplayerwhite', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats', 
    '.orangep3stats', '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2', '.blueplayer1',
    '.orangename', '.bluename', '.overtime', '.overtimetext', '.overtimeunderline', '.timer', '.bluescorenumber', '.orangescorenumber', '.scoreboardoverlayright', '.scoreboardoverlayleft', '.scoreboard']
    for (let i of classes) {
        $(i).css('visibility', 'hidden')}})
WsSubscribers.subscribe("game", "match_destroyed", (d) => {
    const classes = ['.orangeactiveboostcontainer', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats', 
    '#myDIV', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplayboxteam', '.activereplayboxwhite', '.activereplaybox', '.bluep4death', '.bluep3death', '.bluep2death',  '.bluep1death', 
    '.orangep4death', '.orangep3death', '.orangep2death', '.orangep1death', '.bestof7', '.bestof5', '.bestof3', '.orangebestof4', '.orangebestof3', '.orangebestof2', '.orangebestof1', '.bluebestof4', 
    '.bluebestof3', '.bluebestof2', '.bluebestof1', '.activeplayerteam', '.activeplayerwhite', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats', 
    '.orangep3stats', '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2', '.blueplayer1',
    '.orangename', '.bluename', '.overtime', '.overtimetext', '.overtimeunderline', '.timer', '.bluescorenumber', '.orangescorenumber', '.scoreboardoverlayright', '.scoreboardoverlayleft', '.scoreboard']
    for (let i of classes) {
        $(i).css('visibility', 'hidden')}})
WsSubscribers.subscribe("game", "podium_start", (d) => {
    const classes = ['.orangeactiveboostcontainer', '.orangeactivetable', '.orangeactivename', '.orangeactivestats', '.blueactiveboostcontainer', '.blueactivetable', '.blueactivename', '.blueactivestats', 
    '#myDIV', '.replayactiveassists', '.replayactivegoals', '.replaybox', '.activereplayboxteam', '.activereplayboxwhite', '.activereplaybox', '.bluep4death', '.bluep3death', '.bluep2death',  '.bluep1death', 
    '.orangep4death', '.orangep3death', '.orangep2death', '.orangep1death', '.bestof7', '.bestof5', '.bestof3', '.orangebestof4', '.orangebestof3', '.orangebestof2', '.orangebestof1', '.bluebestof4', 
    '.bluebestof3', '.bluebestof2', '.bluebestof1', '.activeplayerteam', '.activeplayerwhite', '.activeplayer', '.bluep4stats', '.bluep3stats', '.bluep2stats', '.bluep1stats', '.orangep4stats', 
    '.orangep3stats', '.orangep2stats', '.orangep1stats', '.orangeplayer4', '.orangeplayer3', '.orangeplayer2', '.orangeplayer1', '.blueplayer4', '.blueplayer3', '.blueplayer2', '.blueplayer1']
    for (let i of classes) {
        $(i).css('visibility', 'hidden')}})
WsSubscribers.subscribe("game", "post_countdown_begin", (d) => {
        function myFunction() {
            var x = document.getElementById("myDIV");
            if (window.getComputedStyle(x).display === "none") {
                $('#myDIV').css('display', 'block')
                const RCONPASS = '57PmLayXAiSaeGta'
                const RCON = new WebSocket('ws://localhost:9002')
                RCON.onopen = function open() {
                    RCON.send(`rcon_password ${RCONPASS}`)
                    RCON.send('rcon_refresh_allowed')
                    setTimeout(() => {
                        RCON.send('replay_gui hud 0');
                        RCON.send('replay_gui matchinfo 0');
                    }, 200);
                }
            }
        }
        myFunction();
    }
)

/////////////////End Game Scoreboard Stuff////////////////////

WsSubscribers.subscribe("game", "update_state", (d) => {
            ///Player stuff///
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
            ///Blue Player 1///
            if (d['players'][Object.keys(team0)[0]] != undefined) {
                $('.bluep1nameES').text(d['players'][Object.keys(team0)[0]]['name'])
                $('.bluep1scoreES').text(d['players'][Object.keys(team0)[0]]['score'])
                $('.bluep1goalsES').text(d['players'][Object.keys(team0)[0]]['goals'])
                $('.bluep1shotsES').text(d['players'][Object.keys(team0)[0]]['shots'])
                $('.bluep1assistsES').text(d['players'][Object.keys(team0)[0]]['assists'])
                $('.bluep1savesES').text(d['players'][Object.keys(team0)[0]]['saves'])
                $('.bluep1demosES').text(d['players'][Object.keys(team0)[0]]['demos'])
            } else {
                $('.bluep1ES').css('visibility', 'hidden')
            }
            ///Blue Player 2///
            if (d['players'][Object.keys(team0)[1]] != undefined) {
                $('.bluep2nameES').text(d['players'][Object.keys(team0)[1]]['name'])
                $('.bluep2scoreES').text(d['players'][Object.keys(team0)[1]]['score'])
                $('.bluep2goalsES').text(d['players'][Object.keys(team0)[1]]['goals'])
                $('.bluep2shotsES').text(d['players'][Object.keys(team0)[1]]['shots'])
                $('.bluep2assistsES').text(d['players'][Object.keys(team0)[1]]['assists'])
                $('.bluep2savesES').text(d['players'][Object.keys(team0)[1]]['saves'])
                $('.bluep2demosES').text(d['players'][Object.keys(team0)[1]]['saves'])
            } else {
                $('.bluep2ES').css('visibility', 'hidden')
            }
            ///Blue Player 3///
            if (d['players'][Object.keys(team0)[2]] != undefined) {
                $('.bluep3nameES').text(d['players'][Object.keys(team0)[2]]['name'])
                $('.bluep3scoreES').text(d['players'][Object.keys(team0)[2]]['score'])
                $('.bluep3goalsES').text(d['players'][Object.keys(team0)[2]]['goals'])
                $('.bluep3shotsES').text(d['players'][Object.keys(team0)[2]]['shots'])
                $('.bluep3assistsES').text(d['players'][Object.keys(team0)[2]]['assists'])
                $('.bluep3savesES').text(d['players'][Object.keys(team0)[2]]['saves'])
                $('.bluep3demosES').text(d['players'][Object.keys(team0)[2]]['saves'])
            } else {
                $('.bluep3ES').css('visibility', 'hidden')
            }
            ///Blue Player 4///
            if (d['players'][Object.keys(team0)[3]] != undefined) {
                $('.bluep4nameES').text(d['players'][Object.keys(team0)[3]]['name'])
                $('.bluep4scoreES').text(d['players'][Object.keys(team0)[3]]['score'])
                $('.bluep4goalsES').text(d['players'][Object.keys(team0)[3]]['goals'])
                $('.bluep4shotsES').text(d['players'][Object.keys(team0)[3]]['shots'])
                $('.bluep4assistsES').text(d['players'][Object.keys(team0)[3]]['assists'])
                $('.bluep4savesES').text(d['players'][Object.keys(team0)[3]]['saves'])
                $('.bluep4demosES').text(d['players'][Object.keys(team0)[3]]['saves'])
            } else {
                $('.bluep4ES').css('visibility', 'hidden')
            }
            ///Orange Player 1///
            if (d['players'][Object.keys(team1)[0]] != undefined) {
                $('.orangep1nameES').text(d['players'][Object.keys(team1)[0]]['name'])
                $('.orangep1scoreES').text(d['players'][Object.keys(team1)[0]]['score'])
                $('.orangep1goalsES').text(d['players'][Object.keys(team1)[0]]['goals'])
                $('.orangep1shotsES').text(d['players'][Object.keys(team1)[0]]['shots'])
                $('.orangep1assistsES').text(d['players'][Object.keys(team1)[0]]['assists'])
                $('.orangep1savesES').text(d['players'][Object.keys(team1)[0]]['saves'])
                $('.orangep1demosES').text(d['players'][Object.keys(team1)[0]]['demos'])
            } else {
                $('.orangep1ES').css('visibility', 'hidden')
            }
            ///Orange Player 2///
            if (d['players'][Object.keys(team1)[1]] != undefined) {
                $('.orangep2nameES').text(d['players'][Object.keys(team1)[1]]['name'])
                $('.orangep2scoreES').text(d['players'][Object.keys(team1)[1]]['score'])
                $('.orangep2goalsES').text(d['players'][Object.keys(team1)[1]]['goals'])
                $('.orangep2shotsES').text(d['players'][Object.keys(team1)[1]]['shots'])
                $('.orangep2assistsES').text(d['players'][Object.keys(team1)[1]]['assists'])
                $('.orangep2savesES').text(d['players'][Object.keys(team1)[1]]['saves'])
                $('.orangep2demosES').text(d['players'][Object.keys(team1)[1]]['demos'])
            } else {
                $('.orangep2ES').css('visibility', 'hidden')
            }
            ///Orange Player 3///
            if (d['players'][Object.keys(team1)[2]] != undefined) {
                $('.orangep3nameES').text(d['players'][Object.keys(team1)[2]]['name'])
                $('.orangep3scoreES').text(d['players'][Object.keys(team1)[2]]['score'])
                $('.orangep3goalsES').text(d['players'][Object.keys(team1)[2]]['goals'])
                $('.orangep3shotsES').text(d['players'][Object.keys(team1)[2]]['shots'])
                $('.orangep3assistsES').text(d['players'][Object.keys(team1)[2]]['assists'])
                $('.orangep3savesES').text(d['players'][Object.keys(team1)[2]]['saves'])
                $('.orangep3demosES').text(d['players'][Object.keys(team1)[2]]['demos'])
            } else {
                $('.orangep3ES').css('visibility', 'hidden')
            }
            ///Orange Player 4///
            if (d['players'][Object.keys(team1)[3]] != undefined) {
                $('.orangep4nameES').text(d['players'][Object.keys(team1)[3]]['name'])
                $('.orangep4scoreES').text(d['players'][Object.keys(team1)[3]]['score'])
                $('.orangep4goalsES').text(d['players'][Object.keys(team1)[3]]['goals'])
                $('.orangep4shotsES').text(d['players'][Object.keys(team1)[3]]['shots'])
                $('.orangep4assistsES').text(d['players'][Object.keys(team1)[3]]['assists'])
                $('.orangep4savesES').text(d['players'][Object.keys(team1)[3]]['saves'])
                $('.orangep4demosES').text(d['players'][Object.keys(team1)[3]]['demos'])
            } else {
                $('.orangep4ES').css('visibility', 'hidden')
            }
            if (d['players'][Object.keys(team0)[0]] != undefined && d['players'][Object.keys(team0)[1]] != undefined && d['players'][Object.keys(team0)[2]] != undefined && d['players'][Object.keys(team0)[3]] != undefined) {
                let bluescore = d['players'][Object.keys(team0)[0]]['score'] + d['players'][Object.keys(team0)[1]]['score'] + d['players'][Object.keys(team0)[2]]['score'] + d['players'][Object.keys(team0)[3]]['score']
                let orangescore = d['players'][Object.keys(team1)[0]]['score'] + d['players'][Object.keys(team1)[1]]['score'] + d['players'][Object.keys(team1)[2]]['score'] + d['players'][Object.keys(team1)[3]]['score']
                let totalscore = bluescore + orangescore;
                let allscore = bluescore / totalscore * 100
                if (totalscore == 0) {
                    allscore = "50"
                    $('.scoreblue').width(allscore + "%")
                } else {
                    $('.scoreblue').width(allscore + "%")
                }
                let bluegoal = d['players'][Object.keys(team0)[0]]['goals'] + d['players'][Object.keys(team0)[1]]['goals'] + d['players'][Object.keys(team0)[2]]['goals'] + d['players'][Object.keys(team0)[3]]['goals']
                let orangegoal = d['players'][Object.keys(team1)[0]]['goals'] + d['players'][Object.keys(team1)[1]]['goals'] + d['players'][Object.keys(team1)[2]]['goals'] + d['players'][Object.keys(team1)[3]]['goals']
                let totalgoals = bluegoal + orangegoal;
                let allgoals = bluegoal / totalgoals * 100
                if (totalgoals == 0) {
                    allgoals = "50"
                    $('.goalsblue').width(allgoals + "%")
                } else {
                    $('.goalsblue').width(allgoals + "%")
                }
                let blueassist = d['players'][Object.keys(team0)[0]]['assists'] + d['players'][Object.keys(team0)[1]]['assists'] + d['players'][Object.keys(team0)[2]]['assists'] + d['players'][Object.keys(team0)[3]]['assists']
                let orangeassist = d['players'][Object.keys(team1)[0]]['assists'] + d['players'][Object.keys(team1)[1]]['assists'] + d['players'][Object.keys(team1)[2]]['assists'] + d['players'][Object.keys(team1)[3]]['assists']
                let totalassist = blueassist + orangeassist;
                let allassist = blueassist / totalassist * 100
                if (totalassist == 0) {
                    allassist = "50"
                    $('.assistsblue').width(allassist + "%")
                } else {
                    $('.assistsblue').width(allassist + "%")
                }
                let bluesaves= d['players'][Object.keys(team0)[0]]['saves'] + d['players'][Object.keys(team0)[1]]['saves'] + d['players'][Object.keys(team0)[2]]['saves'] + d['players'][Object.keys(team0)[3]]['saves']
                let orangesaves= d['players'][Object.keys(team1)[0]]['saves'] + d['players'][Object.keys(team1)[1]]['saves'] + d['players'][Object.keys(team1)[2]]['saves'] + d['players'][Object.keys(team1)[3]]['saves']
                let totalsaves = bluesaves + orangesaves;
                let allsaves = bluesaves / totalsaves * 100
                if (totalsaves == 0) {
                    allsaves = "50"
                    $('.savesblue').width(allsaves + "%")
                } else {
                    $('.savesblue').width(allsaves + "%")
                }
                let blueshots= d['players'][Object.keys(team0)[0]]['shots'] + d['players'][Object.keys(team0)[1]]['shots'] + d['players'][Object.keys(team0)[2]]['shots'] + d['players'][Object.keys(team0)[3]]['shots']
                let orangeshots= d['players'][Object.keys(team1)[0]]['shots'] + d['players'][Object.keys(team1)[1]]['shots'] + d['players'][Object.keys(team1)[2]]['shots'] + d['players'][Object.keys(team1)[3]]['shots']
                let totalshots = blueshots + orangeshots;
                let allshots = blueshots / totalshots * 100
                if (totalshots == 0) {
                    allshots = "50"
                    $('.shotsblue').width(allshots + "%")
                } else {
                    $('.shotsblue').width(allshots + "%")
                }
                let bluedemos= d['players'][Object.keys(team0)[0]]['demos'] + d['players'][Object.keys(team0)[1]]['demos'] + d['players'][Object.keys(team0)[2]]['demos'] + d['players'][Object.keys(team0)[3]]['demos']
                let orangedemos= d['players'][Object.keys(team1)[0]]['demos'] + d['players'][Object.keys(team1)[1]]['demos'] + d['players'][Object.keys(team1)[2]]['demos'] + d['players'][Object.keys(team1)[3]]['demos']
                let totaldemos = bluedemos + orangedemos;
                let alldemos = bluedemos / totaldemos * 100
                if (totaldemos == 0) {
                    alldemos = "50"
                    $('.demosblue').width(alldemos + "%")
                } else {
                    $('.demosblue').width(alldemos + "%")
                }
            }
            if (d['players'][Object.keys(team0)[0]] != undefined && d['players'][Object.keys(team0)[1]] != undefined && d['players'][Object.keys(team0)[2]] != undefined && d['players'][Object.keys(team0)[3]] == undefined) {
                let bluescore = d['players'][Object.keys(team0)[0]]['score'] + d['players'][Object.keys(team0)[1]]['score'] + d['players'][Object.keys(team0)[2]]['score']
                let orangescore = d['players'][Object.keys(team1)[0]]['score'] + d['players'][Object.keys(team1)[1]]['score'] + d['players'][Object.keys(team1)[2]]['score']
                let totalscore = bluescore + orangescore;
                let allscore = bluescore / totalscore * 100
                if (totalscore == 0) {
                    allscore = "50"
                    $('.scoreblue').width(allscore + "%")
                } else {
                    $('.scoreblue').width(allscore + "%")
                }
                let bluegoal = d['players'][Object.keys(team0)[0]]['goals'] + d['players'][Object.keys(team0)[1]]['goals'] + d['players'][Object.keys(team0)[2]]['goals']
                let orangegoal = d['players'][Object.keys(team1)[0]]['goals'] + d['players'][Object.keys(team1)[1]]['goals'] + d['players'][Object.keys(team1)[2]]['goals']
                let totalgoals = bluegoal + orangegoal;
                let allgoals = bluegoal / totalgoals * 100
                if (totalgoals == 0) {
                    allgoals = "50"
                    $('.goalsblue').width(allgoals + "%")
                } else {
                    $('.goalsblue').width(allgoals + "%")
                }
                let blueassist = d['players'][Object.keys(team0)[0]]['assists'] + d['players'][Object.keys(team0)[1]]['assists'] + d['players'][Object.keys(team0)[2]]['assists']
                let orangeassist = d['players'][Object.keys(team1)[0]]['assists'] + d['players'][Object.keys(team1)[1]]['assists'] + d['players'][Object.keys(team1)[2]]['assists']
                let totalassist = blueassist + orangeassist;
                let allassist = blueassist / totalassist * 100
                if (totalassist == 0) {
                    allassist = "50"
                    $('.assistsblue').width(allassist + "%")
                } else {
                    $('.assistsblue').width(allassist + "%")
                }
                let bluesaves= d['players'][Object.keys(team0)[0]]['saves'] + d['players'][Object.keys(team0)[1]]['saves'] + d['players'][Object.keys(team0)[2]]['saves']
                let orangesaves= d['players'][Object.keys(team1)[0]]['saves'] + d['players'][Object.keys(team1)[1]]['saves'] + d['players'][Object.keys(team1)[2]]['saves']
                let totalsaves = bluesaves + orangesaves;
                let allsaves = bluesaves / totalsaves * 100
                if (totalsaves == 0) {
                    allsaves = "50"
                    $('.savesblue').width(allsaves + "%")
                } else {
                    $('.savesblue').width(allsaves + "%")
                }
                let blueshots= d['players'][Object.keys(team0)[0]]['shots'] + d['players'][Object.keys(team0)[1]]['shots'] + d['players'][Object.keys(team0)[2]]['shots']
                let orangeshots= d['players'][Object.keys(team1)[0]]['shots'] + d['players'][Object.keys(team1)[1]]['shots'] + d['players'][Object.keys(team1)[2]]['shots']
                let totalshots = blueshots + orangeshots;
                let allshots = blueshots / totalshots * 100
                if (totalshots == 0) {
                    allshots = "50"
                    $('.shotsblue').width(allshots + "%")
                } else {
                    $('.shotsblue').width(allshots + "%")
                }
                let bluedemos= d['players'][Object.keys(team0)[0]]['demos'] + d['players'][Object.keys(team0)[1]]['demos'] + d['players'][Object.keys(team0)[2]]['demos']
                let orangedemos= d['players'][Object.keys(team1)[0]]['demos'] + d['players'][Object.keys(team1)[1]]['demos'] + d['players'][Object.keys(team1)[2]]['demos']
                let totaldemos = bluedemos + orangedemos;
                let alldemos = bluedemos / totaldemos * 100
                if (totaldemos == 0) {
                    alldemos = "50"
                    $('.demosblue').width(alldemos + "%")
                } else {
                    $('.demosblue').width(alldemos + "%")
                }
            }
            if (d['players'][Object.keys(team0)[0]] != undefined && d['players'][Object.keys(team0)[1]] != undefined && d['players'][Object.keys(team0)[2]] == undefined && d['players'][Object.keys(team0)[3]] == undefined) {
                let bluescore = d['players'][Object.keys(team0)[0]]['score'] + d['players'][Object.keys(team0)[1]]['score']
                let orangescore = d['players'][Object.keys(team1)[0]]['score'] + d['players'][Object.keys(team1)[1]]['score']
                let totalscore = bluescore + orangescore;
                let allscore = bluescore / totalscore * 100
                if (totalscore == 0) {
                    allscore = "50"
                    $('.scoreblue').width(allscore + "%")
                } else {
                    $('.scoreblue').width(allscore + "%")
                }
                let bluegoal = d['players'][Object.keys(team0)[0]]['goals'] + d['players'][Object.keys(team0)[1]]['goals']
                let orangegoal = d['players'][Object.keys(team1)[0]]['goals'] + d['players'][Object.keys(team1)[1]]['goals']
                let totalgoals = bluegoal + orangegoal;
                let allgoals = bluegoal / totalgoals * 100
                if (totalgoals == 0) {
                    allgoals = "50"
                    $('.goalsblue').width(allgoals + "%")
                } else {
                    $('.goalsblue').width(allgoals + "%")
                }
                let blueassist = d['players'][Object.keys(team0)[0]]['assists'] + d['players'][Object.keys(team0)[1]]['assists']
                let orangeassist = d['players'][Object.keys(team1)[0]]['assists'] + d['players'][Object.keys(team1)[1]]['assists']
                let totalassist = blueassist + orangeassist;
                let allassist = blueassist / totalassist * 100
                if (totalassist == 0) {
                    allassist = "50"
                    $('.assistsblue').width(allassist + "%")
                } else {
                    $('.assistsblue').width(allassist + "%")
                }
                let bluesaves= d['players'][Object.keys(team0)[0]]['saves'] + d['players'][Object.keys(team0)[1]]['saves']
                let orangesaves= d['players'][Object.keys(team1)[0]]['saves'] + d['players'][Object.keys(team1)[1]]['saves']
                let totalsaves = bluesaves + orangesaves;
                let allsaves = bluesaves / totalsaves * 100
                if (totalsaves == 0) {
                    allsaves = "50"
                    $('.savesblue').width(allsaves + "%")
                } else {
                    $('.savesblue').width(allsaves + "%")
                }
                let blueshots= d['players'][Object.keys(team0)[0]]['shots'] + d['players'][Object.keys(team0)[1]]['shots']
                let orangeshots= d['players'][Object.keys(team1)[0]]['shots'] + d['players'][Object.keys(team1)[1]]['shots']
                let totalshots = blueshots + orangeshots;
                let allshots = blueshots / totalshots * 100
                if (totalshots == 0) {
                    allshots = "50"
                    $('.shotsblue').width(allshots + "%")
                } else {
                    $('.shotsblue').width(allshots + "%")
                }
                let bluedemos= d['players'][Object.keys(team0)[0]]['demos'] + d['players'][Object.keys(team0)[1]]['demos']
                let orangedemos= d['players'][Object.keys(team1)[0]]['demos'] + d['players'][Object.keys(team1)[1]]['demos']
                let totaldemos = bluedemos + orangedemos;
                let alldemos = bluedemos / totaldemos * 100
                if (totaldemos == 0) {
                    alldemos = "50"
                    $('.demosblue').width(alldemos + "%")
                } else {
                    $('.demosblue').width(alldemos + "%")
                }
            }
            if (d['players'][Object.keys(team0)[0]] != undefined && d['players'][Object.keys(team0)[1]] == undefined && d['players'][Object.keys(team0)[2]] == undefined && d['players'][Object.keys(team0)[3]] == undefined) {
                let bluescore = d['players'][Object.keys(team0)[0]]['score']
                let orangescore = d['players'][Object.keys(team1)[0]]['score']
                let totalscore = bluescore + orangescore;
                let allscore = bluescore / totalscore * 100
                if (totalscore == 0) {
                    allscore = "50"
                    $('.scoreblue').width(allscore + "%")
                } else {
                    $('.scoreblue').width(allscore + "%")
                }
                let bluegoal = d['players'][Object.keys(team0)[0]]['goals']
                let orangegoal = d['players'][Object.keys(team1)[0]]['goals']
                let totalgoals = bluegoal + orangegoal;
                let allgoals = bluegoal / totalgoals * 100
                if (totalgoals == 0) {
                    allgoals = "50"
                    $('.goalsblue').width(allgoals + "%")
                } else {
                    $('.goalsblue').width(allgoals + "%")
                }
                let blueassist = d['players'][Object.keys(team0)[0]]['assists']
                let orangeassist = d['players'][Object.keys(team1)[0]]['assists']
                let totalassist = blueassist + orangeassist;
                let allassist = blueassist / totalassist * 100
                if (totalassist == 0) {
                    allassist = "50"
                    $('.assistsblue').width(allassist + "%")
                } else {
                    $('.assistsblue').width(allassist + "%")
                }
                let bluesaves= d['players'][Object.keys(team0)[0]]['saves']
                let orangesaves= d['players'][Object.keys(team1)[0]]['saves']
                let totalsaves = bluesaves + orangesaves;
                let allsaves = bluesaves / totalsaves * 100
                if (totalsaves == 0) {
                    allsaves = "50"
                    $('.savesblue').width(allsaves + "%")
                } else {
                    $('.savesblue').width(allsaves + "%")
                }
                let blueshots= d['players'][Object.keys(team0)[0]]['shots']
                let orangeshots= d['players'][Object.keys(team1)[0]]['shots']
                let totalshots = blueshots + orangeshots;
                let allshots = blueshots / totalshots * 100
                if (totalshots == 0) {
                    allshots = "50"
                    $('.shotsblue').width(allshots + "%")
                } else {
                    $('.shotsblue').width(allshots + "%")
                }
                let bluedemos= d['players'][Object.keys(team0)[0]]['demos']
                let orangedemos= d['players'][Object.keys(team1)[0]]['demos']
                let totaldemos = bluedemos + orangedemos;
                let alldemos = bluedemos / totaldemos * 100
                if (totaldemos == 0) {
                    alldemos = "50"
                    $('.demosblue').width(alldemos + "%")
                } else {
                    $('.demosblue').width(alldemos + "%")
                }
            }
            
})
WsSubscribers.subscribe("game", "podium_start", (d) => {
    $('.bluep1ES, .bluep2ES, .bluep3ES, .bluep4ES').css('visibility', 'visible')
    $('.orangep1ES, .orangep2ES, .orangep3ES, .orangep4ES').css('visibility', 'visible')
    $('.score, .goals, .shots, .assists, .saves, .demos').css('visibility', 'visible')
    $('.endscoreboard').css('visibility', 'visible')
})
WsSubscribers.subscribe("game", "match_created", (d) => {
    $('.bluep1ES, .bluep2ES, .bluep3ES, .bluep4ES').css('visibility', 'hidden')
    $('.orangep1ES, .orangep2ES, .orangep3ES, .orangep4ES').css('visibility', 'hidden')
    $('.score, .goals, .shots, .assists, .saves, .demos').css('visibility', 'hidden')
    $('.endscoreboard').css('visibility', 'hidden')
})
WsSubscribers.subscribe("game", "match_destroyed", (d) => {
    $('.bluep1ES, .bluep2ES, .bluep3ES, .bluep4ES').css('visibility', 'hidden')
    $('.orangep1ES, .orangep2ES, .orangep3ES, .orangep4ES').css('visibility', 'hidden')
    $('.score, .goals, .shots, .assists, .saves, .demos').css('visibility', 'hidden')
    $('.endscoreboard').css('visibility', 'hidden')
})
WsSubscribers.subscribe("game", "match_ended", (d) => {
    $('.bluep1ES, .bluep2ES, .bluep3ES, .bluep4ES').css('visibility', 'hidden')
    $('.orangep1ES, .orangep2ES, .orangep3ES, .orangep4ES').css('visibility', 'hidden')
    $('.score, .goals, .shots, .assists, .saves, .demos').css('visibility', 'hidden')
    $('.endscoreboard').css('visibility', 'hidden')
})
WsSubscribers.subscribe("game", "replay_start", (d) => {
    $('.replay')
        .css('visibility', 'visible')
    var vid = document.getElementById("myVideo");
    vid.play();

})
WsSubscribers.init(49322, true);
WsSubscribers.subscribe("game", "replay_end", (d) => {
    $('.replay')
        .css('visibility', 'hidden')
    vid.stop();
})
WsSubscribers.init(49322, true);
WsSubscribers.subscribe("game", "pre_countdown_begin", (d) => {
    $('.replay')
        .css('visibility', 'hidden')
    vid.stop();
})