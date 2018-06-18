/*
    Cue Edit
    
    Closed Captions VTT file editor
    
    alt+m 1st time captures start of cue
      adds an editor panel with:
        time buttons w/controls to adjust times
        input field to enter/edit text for cue
      video time is updated in end button
    
    alt+m 2nd time captures end of cue and pauses video
       video pauses and focus on text area
       press play to continue
       alt+m to immediately add another cue panel
        
    each cue panel jumps to the video cue start point when clicked
    
    TODO:
        might be able to use track.cues instead of panels?
        multiple tracks?
        positioning? align, vertical, ... limit to top,left or bottom,center (default)?
        Context menu?
        Ext.js version?
        Icon font?
        
    
    https://github.com/lmammino/vtt-creator
    https://www.w3.org/2010/05/video/mediaevents.html
    https://www.sitepoint.com/essential-audio-and-video-events-for-html5/
    http://html5doctor.com/video-subtitling-and-webvtt/
    https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API
    https://iandevlin.com/blog/2015/02/javascript/dynamically-adding-text-tracks-to-html5-video/
    
    VTTCue object
    align: "center"
    endTime: 10.65
    id: ""
    line: "auto"
    lineAlign: "start"
    onenter: null
    onexit: null
    pauseOnExit: false
    position: "auto"
    positionAlign: "auto"
    region: null
    size: 100
    snapToLines: true
    startTime: 10.47
    text: "the inspection is one\n
    vertical: ""
*/
var panels = [];// cue marker objects
var panelTpl = '<div id="pnl" class="panel"><div class="btnbox"><span/> IN:<button/> OUT:<button/><button/><button/></div><textarea placeholder="Type the cue text" /></div>';

var ebtn;// cue out time
var currentButton;// clicked
var currentPanel = -1;
var lastPanel = currentPanel;
var togglend = false;
var currentTime = 0.0;
var adjustment = 0.1;
var videoname='';// filename.mp4
var trackname='';// filename.vtt  
var filename ='Untitled.vtt';
var track;// = document.getElementById("cctrack").track;
var vidplayer = document.getElementById('vidplayer');

$(vidplayer).on("timeupdate", function(e) {
    //currentTime=this.currentTime;
    $("#current").text('MS: '+this.currentTime+' Time: '+formatTime(this.currentTime) + ' Duration: '+this.duration);

    if (togglend) {
        $(ebtn).text(formatTime(this.currentTime));
    }
});

//vidplayer.addEventListener("canplaythrough", handleTracks);//chrome
//vidplayer.addEventListener("loadedmetadata", handleTracks);
function handleTracks() {
    vidplayer.removeEventListener("canplaythrough", handleTracks);//chrome
    //track = document.getElementById("cctrack").track;
    track = vidplayer.textTracks[0];
    console.log('handleTracks:', track);
    $('#markers').empty();
    // track cues
    if (track) {
        // loaded in dom
        //track.mode='showing';//'hidden';// showing displays on video like captions
        console.log('track:', track.cues.length, track.cues);
    }
    // create editor panels from track cues
    for(var i=0; i<track.cues.length; i++) {
            if (track.cues[i].id == '') {
                track.cues[i].id = i;// needed for cuechange
            }
            // copy cue to pobj & push
            var cue = track.cues[i];
            var pobj = {};
                pobj.panel = i;
                pobj.id = cue.id;
                pobj.startTime = cue.startTime;
                pobj.endTime = cue.endTime;
                pobj.text = cue.text;
            panels.push(pobj);
            // build dom view from panels
            addCuePanel(pobj);//might be able to use vtt instead of panels?
        }
        console.log('panels:', currentPanel, panels);
    
    track.addEventListener("cuechange", seeActiveCue);
    function seeActiveCue(e) {
        //console.log('act e:', this.activeCues.length, e);
        if (track.activeCues.length > 0) {
            console.log('cuechange:', track.activeCues[0]);
            currentPanel = track.activeCues[0].id;
            $('#panel_'+lastPanel).removeClass('selected');
            $('#panel_'+currentPanel).addClass('selected');
            lastPanel = currentPanel;
        }
    }
}

// - & + buttons move through cues
$('.minusbtn').on('click', function(e) {
    // previous cue panel
    if (currentPanel > 0) {
        currentPanel--;// = currentPanel -1;//OK
        vidplayer.pause();
        vidplayer.currentTime = panels[currentPanel].startTime;
        $('#panel_'+lastPanel).removeClass('selected');
        $('#panel_'+currentPanel).addClass('selected');
        lastPanel = currentPanel;
        //console.log('plus:', currentPanel);
    }
});
$('.plusbtn').on('click', function(e) {
    // next cue panel
    if (currentPanel > -1 && currentPanel < (panels.length)-1) {
        currentPanel++;// = currentPanel + 1;// str why?
        vidplayer.pause();
        vidplayer.currentTime = panels[currentPanel].startTime;
        $('#panel_'+lastPanel).removeClass('selected');
        $('#panel_'+currentPanel).addClass('selected');
        lastPanel = currentPanel;
        //console.log('plus:', currentPanel);
    }
});

$(document).on('keypress', function(e) {
    //console.log('key:', e.which, e.altKey, e.shiftKey);
    var el = $(document.activeElement);
    //console.log('activeEL:',el[0].localName, el);
    if (el[0].localName != 'textarea') { e.preventDefault(); }
    var time, timeStr, type;
    var adjustTime = adjustment;
    if (e.altKey) { adjustTime = adjustment*2; }
    if (e.shiftKey) { adjustTime = adjustment/2; }

    //switch/case? is faster
    if (e.which == 45 || e.which == 95) {
        // - or _ dec currentime
        if (currentButton) {
            time = parseFloat($(currentButton).attr('id'));
            time -= adjustTime;
            timeStr = time.toFixed(3);
            time = parseFloat(timeStr);
            vidplayer.currentTime = time;
            $(currentButton).attr('id', time).text(formatTime(time));
            type = $(currentButton).attr('data-type');
            //console.log('update panel', currentPanel, type);
            if (type == 'IN') {
                panels[currentPanel].startTime = time;
            }
            if (type == 'OUT') {
                panels[currentPanel].endTime = time;
            }
            if (track) {
                if (type == 'IN') {
                    track.cues[currentPanel].startTime = time;
                }
                if (type == 'OUT') {
                    track.cues[currentPanel].endTime = time;
                }
            }
        }
    }
    if (e.which == 43 || e.which == 61) {
        // + or = inc currentime
        if (currentButton) {
            time = parseFloat($(currentButton).attr('id'));
            time += adjustTime;
            timeStr = time.toFixed(3);
            time = parseFloat(timeStr);
            vidplayer.currentTime = time;
            $(currentButton).attr('id', time).text(formatTime(time));
            type = $(currentButton).attr('data-type');
            //console.log('update panel', currentPanel, type);
            if (type == 'IN') {
                panels[currentPanel].startTime = time;
            }
            if (type == 'OUT') {
                panels[currentPanel].endTime = time;
            }
            if (track) {
                if (type == 'IN') {
                    track.cues[currentPanel].startTime = time;
                }
                if (type == 'OUT') {
                    track.cues[currentPanel].endTime = time;
                }
            }
        }
    }

    if (e.altKey && e.which == 8) {
        // alt+backspace to delete selected currentPanel
        if (currentPanel) {
            console.log('delete panel', currentPanel);
            panels.splice(currentPanel, 1);
            if (track) {
                track.removeCue(track.cues[currentPanel]);
            }
            updateMarkers(currentPanel);
        }
    }

    if (e.altKey && e.which == 105) {
        //TODO alt+i insert cue panel at selected
        if (currentPanel) {
            var pobj = {};
                pobj.panel = currentPanel;
                pobj.id = 'newCue';
                pobj.startTime = vidplayer.currentTime;
                pobj.endTime = vidplayer.currentTime;
                pobj.text = '';
            panels.splice(current, 0, pobj);
            if (track) {
                track.addCue(new VTTCue(vidplayer.currentTime, vidplayer.currentTime, 'testing text in new cue'));
            }
            updateMarkers(current);
        }
    }

    if (e.altKey && e.which == 109) {
        // alt+m to add a new cue at end, again to set endTime
        //console.log('togglend:',togglend, 'panel_'+currentPanel);
        if (!togglend) {
            currentPanel = panels.length-1;
            var pobj = {};
                pobj.panel = currentPanel;
                pobj.id = 'newCue';
                pobj.startTime = vidplayer.currentTime;
                pobj.endTime = vidplayer.currentTime;
                pobj.text = '';
            panels.push(pobj);
            addCuePanel(pobj);
            if (track) {
                track.addCue(new VTTCue(vidplayer.currentTime, vidplayer.currentTime, 'testing text in new cue'));
            }
            togglend = true;

        } else {
            // pause video, update end cue time and focus on text area
            vidplayer.pause();
            togglend = false;
            currentTime = vidplayer.currentTime;
            // adjust ebtn time and panels
            $('#btns_'+currentPanel).find('button:eq(1)').attr('id', currentTime).text(formatTime(currentTime));
            panels[currentPanel].endTime = currentTime;
            if (track) {
                track.cues[currentPanel].endTime = currentTime;
            }
            $('#panel_'+currentPanel).find('textarea').focus();
            // how to immediately start a new marker...
            //console.log('end:', formatTime(currentTime));
        }
    }
});

// might be able to use track.cues instead of panels?
function addCuePanel(cue) {
    //console.log('panel_'+currentPanel);
    if (currentPanel > -1) {
        $('#panel_'+currentPanel).removeClass('selected');
        $('#panel_'+currentPanel).find('textarea').blur();
    }
    currentPanel += 1;
    lastPanel = currentPanel;
    // add new panel template and modify it
    $('#markers').append(panelTpl);
    var pnl = $('#markers').find('#pnl');// unique id
    $(pnl).attr('id', 'panel_'+currentPanel).addClass('selected');
    $(pnl).attr('data-startTime', cue.startTime);
    $(pnl).on('click', function(e) {
        togglend = false;
        if (currentPanel > -1) {
            $('#panel_'+currentPanel).removeClass('selected');// last panel
        }
        currentPanel = getNum($(this));
        $(this).addClass('selected');
        vidplayer.currentTime = parseFloat($(this).attr('data-startTime'));
        console.log('panels:', currentPanel, panels[currentPanel]);
    });

    var btnbox = $(pnl).find('.btnbox');
    $(btnbox).attr('id', 'btns_'+currentPanel);
    $(btnbox).find('span').attr('id', 'sp_'+currentPanel).text('Cue '+currentPanel+': ');// cue.id

    // In time btn id="IN_"+cue.startTime
    var sbtn = $(btnbox).find('button:eq(0)').attr('id', cue.startTime).attr('data-type', 'IN').text(formatTime(cue.startTime));
    // click to set video to the marker
    $(sbtn).on('click', function(e) {
        vidplayer.pause();
        vidplayer.currentTime = parseFloat($(this).attr('id'));
        currentButton = $(this);
        console.log('startbtn:', $(this).attr('id'));
    });

    // Out time btn id="OUT_"+cue.endTime
    ebtn = $(btnbox).find('button:eq(1)').attr('id', cue.endTime).attr('data-type', 'OUT').text(formatTime(cue.endTime));
    //click to set video to the marker
    $(ebtn).on('click', function(e) {
        vidplayer.pause();
        vidplayer.currentTime = parseFloat($(this).attr('id'));// data-endTime="cue.endTime"
        currentButton = $(this);
        console.log('endbtn:', $(this).attr('id'));
    });
    
    // cue text
    var txt = $(pnl).find('textarea').attr('id', 'txt_'+currentPanel).val(cue.text);
    $(txt).on('keyup', function(e) {
        currentPanel = getNum($(this));
        if (track) {
            track.cues[currentPanel].text = $(this).val();
        }
        panels[currentPanel].text = $(this).val();
    });

    // delete this cue panel
    var dbtn = $(btnbox).find('button:eq(2)').attr('id', 'del_'+currentPanel).text('Delete').addClass('delbtn');
    $(dbtn).on('click', function(e) {
        var current = getNum($(this));
        console.log('deleteAt:',current);
        panels.splice(current, 1);
        if (track) {
            track.removeCue(track.cues[current]);
        }
        updateMarkers(current);
    });

    // insert a cue panel before?
    var ibtn = $(btnbox).find('button:eq(3)').attr('id', 'ins_'+currentPanel).attr('data-startTime', cue.startTime).text('Insert').addClass('delbtn');
    $(ibtn).on('click', function(e) {
        var current = getNum($(this));
        console.log('insertAt:',current);
        currentTime = parseFloat($(this).attr('data-startTime'));
        var pobj = {};
            pobj.panel = current;
            pobj.id = 'newCue';
            pobj.startTime = currentTime;
            pobj.endTime = currentTime+0.5;
            pobj.text = 'testing text in new cue';
        panels.splice(current, 0, pobj);
        if (track) {
            track.addCue(new VTTCue(currentTime, currentTime+0.5, 'testing text in new cue'));
        }
        updateMarkers(current);
    });
}

function getNum(element) {
    var arr = $(element).attr('id').split('_');
    return parseInt(arr[1]);
}

function pad(num) {
    if (num < 10) {
        return '0' + num;
    }
    return num;
}

function formatTime(sec) {
    if (typeof sec !== 'number') {
        throw new Error('Invalid type: expected number');
    }
    var seconds = (sec % 60).toFixed(3);
    var minutes = Math.floor(sec / 60) % 60;
    var hours = Math.floor(sec / 60 / 60);
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
};

function updateMarkers(current) {
    for (var i=current; i<panels.length; i++) {
        panels[i].panel = i;
    }
    currentPanel = - 1;// for inc at addCuePanel
    $('#markers').empty();// re populate
    for (var i=0; i<track.cues.length; i++) {
    //for (var i=0; i<panels.length; i++) {
        if (track) {
            track.cues[i].id = i;// doesnt have to be a number or in sequence
        }
        addCuePanel(track.cues[i]);
        //addCuePanel(panels[i]);
    }
    console.log('panels:', panels.length, panels);
    if (track) {
        console.log('track.cues:', track.cues.length, track.cues);
    }
}

// file managment:
$('#filelist').hide();
$('#workspace').hide();
// open mp4 and vtt files
$('#openfiles').on('click', function () {
    $('#loadinstruct').html('<b>Select a Video then a vtt file or New vtt File</b>');
    $.post('videos/returnfiles.php', {path:'videos', filetype:"*.mp4"}, loadvideo);
    $.post('videos/returnfiles.php', {path:'videos', filetype:"*.vtt"}, loadtrack);
});

function loadvideo(result) {
    //console.log(result);
    $('#filelist').show();
    var arr = result.split(",");
    for (var i=0; i<arr.length; i++) {
        if (arr[i] != '') {
            $('#selectfiles').append('<button id="video_'+i+'" type="button" class="selctvid">'+arr[i]+'</button><br>');
        }
    }
    $('.selctvid').on('click', function() {
        videoname = $(this).text();
        $(this).addClass('selected');
        if (trackname != '') {
            injectVideo(videoname,trackname);
        }
    });
}

function loadtrack(result) {
    //console.log(result);
    var arr = result.split(",");
    for (var i=0; i<arr.length; i++) {
        if (arr[i] != '') {
            $('#selectfiles').append('<button id="track_'+i+'" type="button" class="selcttrk">'+arr[i]+'</button><br>');
        }
    }
    $('.selcttrk').on('click', function() {
        trackname = $(this).text();
        $(this).addClass('selected');
        if (videoname != '') {
            injectVideo(videoname,trackname);
        }
    });
}

$('#newTRKfile').on('click', function () {
    trackname = 'NEW';
    if (trackname != '') {
        injectVideo(videoname,trackname);
    }
});

function injectVideo(vidname, trackname) {
    console.log('INJECT',vidname,trackname);
    $('#selectfiles').empty();
    $('#filelist').hide();
    $('#loadinstruct').html('');
    
    $('#vidplayer').attr('src', 'videos/'+vidname);
    $('#vidplayer').empty();
    vidplayer.textTrack = [];
    panels = [];
    
    if (trackname == "NEW") {
        trackname ='Untitled.vtt';
        track = vidplayer.addTextTrack("captions", "English", "en");
        track.mode = "showing";
        track.addCue(new VTTCue(0, 5.1, "[Test]"));
        console.log(track);
        console.log(vidplayer.textTracks);// array of textTrack objects
        
    } else {
        
        $('#vidplayer').append('<track id="cctrack" kind="captions" src="videos/'+trackname+'" label="English" srclang="en" default />');
        // TODO what to do for multiple tracks?
    }
    filename = trackname;
    $('#workspace').show();
    vidplayer.addEventListener("canplaythrough", handleTracks);
}

$('#saveVTTfile').on('click', writefile);
function writefile() {
    var local = window.location.href.split('/');
    //console.log('local', local);// check if online
    //if (local[0] == 'file:') { return false; }
    if (panels.length>0) {
        //format text string to write
        var vttdata = 'WEBVTT\nKind: captions\nLanguage: en\n\n\n';

        for(var i=0; i<track.cues.length; i++){
            vttdata += track.cues[i].id+'\n';
            vttdata += formatTime(track.cues[i].startTime)+' --> '+formatTime(track.cues[i].endTime)+'\n';
            vttdata += track.cues[i].text+'\n\n';//end of cue
        }
        
        vttdata += 'NOTE\nA simple note\n\n';

        console.log('Write file:', filename);
        console.log(vttdata);
        //$.post('videos/writefile.php', {filename:filename, vttdata:vttdata}, tracksaved);
    }
}

function tracksaved(response){
    console.log(response);
}
