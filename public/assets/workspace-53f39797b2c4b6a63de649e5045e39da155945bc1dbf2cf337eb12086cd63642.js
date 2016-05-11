










'use strict';

var WaveSurfer = {
    init: function (params) {
        var my = this;

        if (params.audio) {
            var backend = WaveSurfer.Audio;
        } else {
            backend = WaveSurfer.WebAudio;
        }

        this.backend = Object.create(backend);
        this.backend.init(params);


        this.drawer = Object.create(WaveSurfer.Drawer);
        this.drawer.init(params);
        /*
        this.backend.bindUpdate(function () {
            my.onAudioProcess();
        });
        */
        /*this.bindClick(params.canvas, function (percents) {
            my.playAt(percents);
        });
        */
    },
    /*
    onAudioProcess: function () {
        if (!this.backend.isPaused()) {
            this.drawer.progress(this.backend.getPlayedPercents());
        }
    },

    playAt: function (percents) {
        this.backend.play(this.backend.getDuration() * percents);
    },

    pause: function () {
        this.backend.pause();
    },

    playPause: function () {
        if (this.backend.paused) {
            this.playAt(this.backend.getPlayedPercents() || 0);
        } else {
            this.pause();
        }
    },
    */
    drawBuffer: function () {
        if (this.backend.currentBuffer) {
            this.drawer.drawBuffer(this.backend.currentBuffer);
        }
    },

    /**
     * Loads an audio file via XHR.
     */
    load: function (src) {
        var my = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'arraybuffer';

        xhr.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                var percentComplete = e.loaded / e.total;
            } else {
                // TODO
                percentComplete = 0;
            }
            my.drawer.drawLoading(percentComplete);
        }, false);

        xhr.addEventListener('load', function (e) {
            my.backend.loadData(
                e.target.response,
                my.drawBuffer.bind(my)
            );
        }, false);
        xhr.send();
    },
    /**
     * Loads an audio file via drag'n'drop.
     */
    /**
    bindDragNDrop: function (dropTarget) {
        var my = this;
        var reader = new FileReader();
        reader.addEventListener('load', function (e) {
            my.backend.loadData(
                e.target.result,
                my.drawBuffer.bind(my)
            );
        }, false);

        (dropTarget || document).addEventListener('drop', function (e) {
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            file && reader.readAsArrayBuffer(file);
        }, false);
    },
    **/
    /**
     * Click to seek.
     */
    /*
    bindClick: function (element, callback) {
        var my = this;
        element.addEventListener('click', function (e) {
            var relX = e.offsetX;
            if (null == relX) { relX = e.layerX; }
            callback(relX / this.clientWidth);
        }, false);
    }
    */
};
'use strict';

WaveSurfer.WebAudio = {
    Defaults: {
        fftSize: 1024,
        smoothingTimeConstant: 0.3
    },
    /*
    ac: new (window.AudioContext || window.webkitAudioContext),
    */
    /**
     * Initializes the analyser with given params.
     *
     * @param {Object} params
     * @param {String} params.smoothingTimeConstant
     */
    init: function (params) {
        params = params || {};
        this.ac = params.audioContext;

        this.fftSize = params.fftSize || this.Defaults.fftSize;
        this.destination = params.destination || this.ac.destination;

        this.analyser = this.ac.createAnalyser();
        this.analyser.smoothingTimeConstant = params.smoothingTimeConstant ||
            this.Defaults.smoothingTimeConstant;
        this.analyser.fftSize = this.fftSize;
        this.analyser.connect(this.destination);

        this.proc = this.ac.createScriptProcessor(this.fftSize / 2, 1, 1);
        this.proc.connect(this.destination);

        this.dataArray = new Uint8Array(this.analyser.fftSize);

        this.paused = true;
    },

    bindUpdate: function (callback) {
        this.proc.onaudioprocess = callback;
    },

    setSource: function (source) {
        this.source && this.source.disconnect();
        this.source = source;
        this.source.connect(this.analyser);
        this.source.connect(this.proc);
    },

    /**
     * Loads audiobuffer.
     *
     * @param {AudioBuffer} audioData Audio data.
     */
    loadData: function (audioData, cb) {
        var my = this;

        this.pause();

        this.ac.decodeAudioData(
            audioData,
            function (buffer) {
                my.currentBuffer = buffer;
                my.lastStart = 0;
                my.lastPause = 0;
                my.startTime = null;
                cb(buffer);
                console.log(buffer);
            },
            Error
        );
    },

    isPaused: function () {
        return this.paused;
    },

    getDuration: function () {
        return this.currentBuffer && this.currentBuffer.duration;
    },

    /**
     * Plays the loaded audio region.
     *
     * @param {Number} start Start offset in seconds,
     * relative to the beginning of the track.
     *
     * @param {Number} end End offset in seconds,
     * relative to the beginning of the track.
     */
    play: function (start, end, delay) {
        if (!this.currentBuffer) {
            return;
        }

        this.pause();

        this.setSource(this.ac.createBufferSource());
        this.source.buffer = this.currentBuffer;

        if (null == start) { start = this.getCurrentTime(); }
        if (null == end  ) { end = this.source.buffer.duration; }
        if (null == delay) { delay = 0; }

        this.lastStart = start;
        this.startTime = this.ac.currentTime;

        this.source.noteGrainOn(delay, start, end - start);

        this.paused = false;
    },

    /**
     * Pauses the loaded audio.
     */
    pause: function (delay) {
        if (!this.currentBuffer || this.paused) {
            return;
        }

        this.lastPause = this.getCurrentTime();

        this.source.noteOff(delay || 0);

        this.paused = true;
    },

    getPlayedPercents: function () {
        return this.getCurrentTime() / this.getDuration();
    },

    getCurrentTime: function () {
        if (this.isPaused()) {
            return this.lastPause;
        } else {
            return this.lastStart + (this.ac.currentTime - this.startTime);
        }
    },

    /**
     * Returns the real-time waveform data.
     *
     * @return {Uint8Array} The waveform data.
     * Values range from 0 to 255.
     */
    waveform: function () {
        this.analyser.getByteTimeDomainData(this.dataArray);
        return this.dataArray;
    },

    /**
     * Returns the real-time frequency data.
     *
     * @return {Uint8Array} The frequency data.
     * Values range from 0 to 255.
     */
    frequency: function () {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
};
'use strict';

WaveSurfer.Drawer = {
    defaultParams: {
        waveColor: '#333',
        progressColor: '#999',
        cursorWidth: 1,
        loadingColor: '#333',
        loadingBars: 20,
        barHeight: 1,
        barMargin: 10,
        radius: 10
    },

    init: function (params) {
        var my = this;
        this.params = Object.create(params);
        Object.keys(this.defaultParams).forEach(function (key) {
            if (!(key in params)) { params[key] = my.defaultParams[key]; }
        });

        this.canvas = params.canvas;

        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        this.cc = this.canvas.getContext('2d');

        if (params.image) {
            this.loadImage(params.image, this.drawImage.bind(this));
        }

        if (!this.width || !this.height) {
            console.error('Canvas size is zero.');
        }
    },

    getPeaks: function (buffer) {
        // Frames per pixel
        var k = buffer.getChannelData(0).length / this.width;

        this.peaks = [];
        this.maxPeak = -Infinity;

        for (var i = 0; i < this.width; i++) {
            var sum = 0;
            for (var c = 0; c < buffer.numberOfChannels; c++) {
                var chan = buffer.getChannelData(c);
                var vals = chan.subarray(i * k, (i + 1) * k);
                var peak = -Infinity;
                for (var p = 0, l = vals.length; p < l; p++){
                    if (vals[p] > peak){
                        peak = vals[p];
                    }
                }
                sum += peak;
            }
            this.peaks[i] = sum;

            if (sum > this.maxPeak) {
                this.maxPeak = sum;
            }
        }
    },
    
    progress: function (percents) {
        this.cursorPos = ~~(this.width * percents);
        this.redraw();
    },
    

    drawBuffer: function (buffer) {
        this.getPeaks(buffer);
        this.progress(0);
    },

    /**
     * Redraws the entire canvas on each audio frame.
     */
    
    redraw: function () {
        var my = this;
        this.clear();
        this.roundRectangle(0,0,this.width, this.height, this.params.radius);
        // Draw WebAudio buffer peaks.
        if (this.peaks) {
            this.peaks.forEach(function (peak, index) {
                my.drawFrame(index, peak, my.maxPeak);
            });
            
             
       
        
        // Or draw an image.
        } else if (this.image) {
            this.drawImage();
        }

        //this.drawCursor();
    },
    

    clear: function () {
        this.cc.clearRect(0, 0, this.width, this.height);
    },

    drawFrame: function (index, value, max) {
        var w = 1;
        
        //subtract radius from height to reduce vertical range
        var h = Math.round(value * ((this.height-this.params.radius) / max));
       

        var x = index * w;
        var y = Math.round((this.height - h) / 2);

        this.cc.fillStyle = this.params.waveColor;

        this.cc.fillRect(x, y, w, h);
        
       
    },
    /*
    drawCursor: function () {
        var w = this.params.cursorWidth;
        var h = this.height;

        var x = Math.min(this.cursorPos, this.width - w);
        var y = 0;

        this.cc.fillStyle = this.params.cursorColor;
        this.cc.fillRect(x, y, w, h);
    },
    */

    /**
     * Loads and caches an image.
     */
    loadImage: function (url, callback) {
        var my = this;
        var img = document.createElement('img');
        var onLoad = function () {
            img.removeEventListener('load', onLoad);
            my.image = img;
            callback(img);
        };
        img.addEventListener('load', onLoad, false);
        img.src = url;
    },

    /**
     * Draws a pre-drawn waveform image.
     */
    drawImage: function () {
        var cc = this.cc;
        cc.drawImage(this.image, 0, 0, this.width, this.height);
        cc.save();
        cc.globalCompositeOperation = 'source-atop';
        cc.fillStyle = this.params.progressColor;
        cc.fillRect(0, 0, this.cursorPos, this.height);
        cc.restore();
    },

    drawLoading: function (progress) {
        var color = this.params.loadingColor;
        var bars = this.params.loadingBars;
        var barHeight = this.params.barHeight;
        var margin = this.params.barMargin;
        var barWidth = ~~(this.width / bars) - margin;
        var progressBars = ~~(bars * progress);
        var y = ~~(this.height - barHeight) / 2;

        this.cc.fillStyle = color;
        for (var i = 0; i < progressBars; i += 1) {
            var x = i * barWidth + i * margin;
            this.cc.fillRect(x, y, barWidth, barHeight);
        }
    },
    
    roundRectangle: function(x, y, w, h, r){
        
        
        
        //from http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
        this.cc.strokeStyle = this.params.progressColor;
        this.cc.lineWidth = 1;
        this.cc.beginPath();
        this.cc.moveTo(x + r, y);
        this.cc.lineTo(x + w - r, y);
        this.cc.quadraticCurveTo(x + w, y, x + w, y + r);
        this.cc.lineTo(x + w, y + h - r);
        this.cc.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.cc.lineTo(x + r, y + h);
        this.cc.quadraticCurveTo(x, y + h, x, y + h - r);
        this.cc.lineTo(x, y + r);
        this.cc.quadraticCurveTo(x, y, x + r, y);
        this.cc.closePath();
        this.cc.fillStyle = '#E0E0E0';
        this.cc.fill();
        
        this.cc.stroke();
        
        
        
        }
};
'use strict';
var source = null;
var isPlaying = false;		// Are we currently playing?
var isPaused = false;
var isStopped = true;
var startTime;			// The start time of the entire sequence.
var current16thNote =0;		// What note is currently last scheduled?
var tempo = 125;		// tempo (in beats per minute). defined in main.js
var secondsPerBeat = 60.0/tempo;
var lookahead = 25.0;		// How frequently to call scheduling function 
				//(in milliseconds)
var scheduleAheadTime = 0.2;	// How far ahead to schedule audio (sec)
				// This is calculated from lookahead, and overlaps 
				// with next interval (in case the timer is late)
var nextNoteTime = 0.0;		// when the next note is due.
var nextCursorTime = 0.0;
var noteResolution = 0;		// 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;		// length of "beep" (in seconds)
var timerID = 0;		// setInterval identifier.

var canvas,       		// the canvas element
    canvasContext;  		// canvasContext is the canvas' context 2D
var last16thNoteDrawn = 0;	// the last "box" we drew on the screen
var notesInQueue = [];      	// the notes that have been put into the web audio,
				// and may or may not have played yet. {note, time}
	
//array of source objects that are active at a given time			
var activeSources =[];

var pauseTime;
var pauseBeat;
var playTime;
var clockTime = 0;
//variables for cursor
var k =0;
var cnt =2;
var nextK = k;

var timelineWidth;
var zoom = 1;
var zoom4;

// First, let's shim the requestAnimationFrame API, with a setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( callback ){
        window.setTimeout(callback, 1000 / 60);
    };
})();



function nextNote() {
    // Advance current note and time by a 16th note...
   
    nextNoteTime += 0.25 * secondsPerBeat;
    // Add beat length to last beat time
    current16thNote++;	// Advance the beat number, wrap to zero
    
}

function scheduleNote( beatNumber, noteTime) {
    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: noteTime } );
    var samples;
    
    if (isPlaying) {
		    activeSources.forEach(function(element, index){
			if (element.sourceNode.playbackState == 3) {
			    activeSources.splice(index, 1);
			}
		    });	
		}
   
    if(times[beatNumber] != null){
	samples = times[beatNumber];
	//console.log(samples);
	//console.log(times[beatNumber].track);
	for(var i = 0; i<samples.length; i++){
	    
	    source = ac.createBufferSource();
	    source.connect(trackInputNodes[samples[i].track]);
	    
	    source.buffer = buffers[samples[i].id].buffer;
	    
	    //push source node and the scheduled start time of the sample
	    activeSources.push({sourceNode: source, sourceStartBar: beatNumber});
	    source.start(noteTime);
	    //source.stop(noteTime + buffers[samples[i]].buffer.duration);  
	}
    }
}

function scheduler() {
	// while there are notes that will need to play before the next interval, 
	// schedule them and advance the pointer.
	while (nextNoteTime < ac.currentTime + scheduleAheadTime ) {
		scheduleNote( current16thNote, nextNoteTime );
		nextNote();

	}
	timerID = window.setTimeout( scheduler, lookahead );
	
	
}

function schedPlay(time) {
    //time input is ac.currentTime passed from main.js
    
    //if not playing, then play
    if (!isPlaying) {
	console.log("playing");
	playTime = time;
	//if resuming from a pause
	if (isPaused) {
	    console.log("pause resume");
	    //play all active sources at percents
	    //console.log(activeSources);
	    activeSources.forEach(function(element, index){
		var percent = (current16thNote-element.sourceStartBar) / (element.sourceNode.buffer.duration/(secondsPerBeat*0.25));
		element.sourceNode.start(element.sourceNode.buffer.duration * percent);
		
	    });
	    
	    current16thNote = pauseBeat;
	    playTime =  playTime - current16thNote*secondsPer16;
	    //console.log(pauseBeat);
	    
	}
	
	 isPlaying = !isPlaying;
	 isPaused = !isPlaying;
	 
	//clockTime = current16thNote*secondsPer16;
	
	if(isPlaying){ 
	nextNoteTime = ac.currentTime;
	scheduler();
	clockOutput();
	}
    //if playing, then pause
    } else {
	window.clearTimeout( timerID );
	activeSources.forEach(function(element){
	    element.sourceNode.stop(0);
	});
	
	console.log("paused");
	isPlaying = !isPlaying;
	isPaused = !isPlaying;
	
	pauseTime = time-playTime;
	pauseBeat = k;
	
	//console.log(activeSources);
	console.log(current16thNote);
    }
}

function schedStop(){
   window.clearTimeout( timerID );
   activeSources.forEach(function(element){
	    element.sourceNode.stop(0);
	});
   
    k=0;
    nextK=k;
    current16thNote = 0;
    
    //clear cursor
    drawTimeline();
    
    if (isPlaying) {
	 isPlaying = false;
    }
    
    if (isPaused) {
	isPaused = false;
    }
    
    clockOutput(0);
    
    isStopped = true;
}

function schedStepBack(time) {
    
    if (isPlaying) {
	 schedStop();
    }else{
	//schedPlay(time)
	
	k=0;
	nextK=k;
	pauseBeat = 0;
	drawTimeline();
    }
    drawCursor(0);
    
    clockOutput(0);
    
}
function draw() {
    var currentNote = last16thNoteDrawn;
    var currentTime = ac.currentTime;
    
     while (notesInQueue.length && notesInQueue[0].time < currentTime) {
        currentNote = notesInQueue[0].note;
        notesInQueue.splice(0,1);   // remove note from queue
	 if (isPlaying) {
	    clockOutput();
	    
	    if (k == nextK) {
		nextK+=4;
    
		drawTimeline();
		drawCursor(k);
	    }
	    k++
	 }
    }
    
    // set up to draw again
    requestAnimFrame(draw);
}

function drawTimeline(){
    canvasContext.clearRect(0,0,canvas.width, canvas.height);
    canvasContext.fillStyle = "black";
    canvasContext.lineWidth = 1;
    for(var i=0;i<timelineWidth;i+=pixelsPer4){	
        canvasContext.moveTo(i,0);
        canvasContext.lineTo(i,10); 	
        canvasContext.stroke();
    }
    canvasContext.fillText("Bar",4,20);
    
    var bar = 2;
    for(var i=31;i<timelineWidth;i+=(2*pixelsPer4)){
        canvasContext.fillText(bar*zoom, i, 20);
        bar+=2;
    }
}

function timelineZoomIn() {
    canvasContext.clearRect(0,0,canvas.width, canvas.height);
    zoom /= 2;
    resetCanvas();
    console.log("in");
}

function timelineZoomOut() {
    canvasContext.clearRect(0,0,canvas.width, canvas.height);
    zoom *= 2;
    resetCanvas();
    console.log("out");
}

function drawCursor(bar) {
    canvasContext.fillStyle = "FF9900";
    canvasContext.fillRect(bar*pixelsPer16/zoom, 0, pixelsPer4/zoom, 10 );
}

function cursorJump(bar) {
    if (isStopped) {
	isStopped = false;
	isPaused = true;
    }
    drawTimeline();
    drawCursor(bar*4);
    
   if (isPlaying) {
    activeSources.forEach(function(element){
	     element.sourceNode.stop(0);
	 });	
   }
    
    k=bar*4;
    nextK=k;
    current16thNote = k;
    if (isPaused) {
	pauseBeat = k;
    }
    clockOutput(k);
    //console.log(current16thNote);
}

function loadActiveSources() {
    
}

function clockOutput(t){
    clockTime = t*secondsPer16;
    if (isPlaying) {
	 clockTime = ac.currentTime - playTime;
    }
    
    clockTime = formatTime(clockTime);
    $("#clock").html(clockTime);

}

function formatTime(t) {
    
    var msec = Math.floor((t % 1)*100);
    var seconds = Math.floor(t % 60)
    var minutes =  Math.floor((t / 60) % 60);

    if (msec < 10){msec = "0"+msec;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    
    t = minutes+':'+seconds+':'+msec;
    return t;
}
    

function resetCanvas (e) {
    // resize the canvas - but remember - this clears the canvas too.
    
    timelineWidth = (.7446808510638297 * window.innerWidth - 20) * .829787234042553 - 20; 
    
    if (zoom <=1) {
	timelineWidth /= zoom;
    }
    
    canvas.width = timelineWidth;
    

    //make sure we scroll to the top left.
    //window.scrollTo(0,0);
    drawTimeline();
    drawCursor(k);
     //requestAnimFrame(draw);	// start the drawing loop.
}

function initSched(params){
    canvas = document.getElementById( "timeline" );
    canvas.addEventListener("click" , function(e){
						    var relX = e.offsetX;
						    var bar =Math.floor(relX/pixelsPer4);
						    cursorJump(bar);
						}, false);
			    
    canvasContext = canvas.getContext( '2d' );
    canvasContext.font = '8pt Calibri';
    canvasContext.textAlign = 'center';
    
    //0.744... is hardcoded for bootstrap span9 and 0.829 is for span 10. -20s are for left margins on each
    timelineWidth = (.7446808510638297 * window.innerWidth - 20) * .829787234042553 - 20; 
    canvas.width = timelineWidth;
    
    requestAnimFrame(draw);	// start the drawing loop.
    
    window.onorientationchange = resetCanvas;
    window.onresize = resetCanvas
    
   clockOutput(0);

}

window.addEventListener("load", initSched);
/*
	Storage.js v1.6.2

	Storage.js jQuery Plugin (C) 2011 Ethan Kramer
	
	STORAGE.JS IS DOUBLE LICENSED UNDER THE MIT LICENSE AND GPL LICENSE

	MIT LICENSE

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	GPL LICENSE

	A jquery plugin for simple page editing that uses HTML5 content editable and HTML5 localStorage
	    Copyright (C) 2011  Ethan Kramer

	    This program is free software: you can redistribute it and/or modify
	    it under the terms of the GNU General Public License as published by
	    the Free Software Foundation, either version 3 of the License, or
	    (at your option) any later version.

	    This program is distributed in the hope that it will be useful,
	    but WITHOUT ANY WARRANTY; without even the implied warranty of
	    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	    GNU General Public License for more details.

	    You should have received a copy of the GNU General Public License
	    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/




(function ($){

	//name our plugin after "$.fn.". in this case our plugin name is simpleSpy
	$.fn.storage = function(options){
		
		var defaults = {
					onStart:function(){},
					onExit:function(){},
					beforeSave:function(){},
					afterSave:function(){},
					storageKey:'storageKey',
					revert:false,
					store:true
				},
			settings = $.extend({},defaults,options);
		
		return this.each(function(){
			var $this = $(this),
				$text = $this.text(),
				origKey = "orig" + settings.storageKey;
				
			$this.attr("data-orig-text",$text);

			if(settings.store){
				localStorage.setItem(origKey,$text);
			}

			$this.attr('contenteditable','');
			
			if (settings.store) {
				if(settings.revert){
					$this.text(localStorage.getItem(origKey));

					if ($this.text() == "" || $this.text() == "null") {
						$this.text($this.data("orig-text"));
					}

				}else{
					$this.text(localStorage.getItem(settings.storageKey));

					if ($this.text() == "" || $this.text() == "null") {
						$this.text($this.data("orig-text"));
					}
				}
			}
			
			$this.focus(function(){
				var focusText = $this.text();

				$this.addClass("sf-focus");
				
				settings.onStart.apply(this,[$(this),focusText]);
				
			});
			
			$this.blur(function(){
				var blurText = $this.text();
				
				$this.removeClass("sf-focus");
				$this.addClass("sf-blur");
				
				settings.onExit.apply(this,[$(this),blurText]);
				
				if (settings.store) {
					settings.beforeSave.apply(this,[$(this),blurText]);
					localStorage.setItem(settings.storageKey,$this.text());
					settings.afterSave.apply(this,[$(this),blurText]);
				}

				$this.attr("data-orig-text",$this.text());
				
				$this.removeClass("sf-blur");
			});
		});
	};

})(jQuery);
/*!jQuery Knob*/
/**
 * Downward compatible, touchable dial
 *
 * Version: 1.2.0 (15/07/2012)
 * Requires: jQuery v1.7+
 *
 * Copyright (c) 2012 Anthony Terrien
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 *
 * Thanks to vor, eskimoblood, spiffistan, FabrizioC
 */

(function($) {

    /**
     * Kontrol library
     */
    "use strict";

    /**
     * Definition of globals and core
     */
    var k = {}, // kontrol
        max = Math.max,
        min = Math.min;

    k.c = {};
    k.c.d = $(document);
    k.c.t = function (e) {
        return e.originalEvent.touches.length - 1;
    };

    /**
     * Kontrol Object
     *
     * Definition of an abstract UI control
     *
     * Each concrete component must call this one.
     * <code>
     * k.o.call(this);
     * </code>
     */
    k.o = function () {
        var s = this;

        this.o = null; // array of options
        this.$ = null; // jQuery wrapped element
        this.i = null; // mixed HTMLInputElement or array of HTMLInputElement
        this.g = null; // 2D graphics context for 'pre-rendering'
        this.v = null; // value ; mixed array or integer
        this.cv = null; // change value ; not commited value
        this.x = 0; // canvas x position
        this.y = 0; // canvas y position
        this.$c = null; // jQuery canvas element
        this.c = null; // rendered canvas context
        this.t = 0; // touches index
        this.isInit = false;
        this.fgColor = null; // main color
        this.pColor = null; // previous color
        this.dH = null; // draw hook
        this.cH = null; // change hook
        this.eH = null; // cancel hook
        this.rH = null; // release hook

        this.run = function () {
            var cf = function (e, conf) {
                var k;
                for (k in conf) {
                    s.o[k] = conf[k];
                }
                s.init();
                s._configure()
                 ._draw();
            };

            if(this.$.data('kontroled')) return;
            this.$.data('kontroled', true);

            this.extend();
            this.o = $.extend(
                {
                    // Config
                    min : this.$.data('min') || 0,
                    max : this.$.data('max') || 100,
                    stopper : true,
                    readOnly : this.$.data('readonly'),

                    // UI
                    cursor : (this.$.data('cursor') === true && 30)
                                || this.$.data('cursor')
                                || 0,
                    thickness : this.$.data('thickness') || 0.35,
                    lineCap : this.$.data('linecap') || 'butt',
                    width : this.$.data('width') || 200,
                    height : this.$.data('height') || 200,
                    displayInput : this.$.data('displayinput') == null || this.$.data('displayinput'),
                    displayPrevious : this.$.data('displayprevious'),
                    fgColor : this.$.data('fgcolor') || '#87CEEB',
                    inputColor: this.$.data('inputcolor') || this.$.data('fgcolor') || '#87CEEB',
                    inline : false,
                    step : this.$.data('step') || 1,

                    // Hooks
                    draw : null, // function () {}
                    change : null, // function (value) {}
                    cancel : null, // function () {}
                    release : null // function (value) {}
                }, this.o
            );

            // routing value
            if(this.$.is('fieldset')) {

                // fieldset = array of integer
                this.v = {};
                this.i = this.$.find('input')
                this.i.each(function(k) {
                    var $this = $(this);
                    s.i[k] = $this;
                    s.v[k] = $this.val();

                    $this.bind(
                        'change'
                        , function () {
                            var val = {};
                            val[k] = $this.val();
                            s.val(val);
                        }
                    );
                });
                this.$.find('legend').remove();

            } else {
                // input = integer
                this.i = this.$;
                this.v = this.$.val();
                (this.v == '') && (this.v = this.o.min);

                this.$.bind(
                    'change'
                    , function () {
                        s.val(s._validate(s.$.val()));
                    }
                );
            }

            (!this.o.displayInput) && this.$.hide();

            this.$c = $('<canvas width="' +
                            this.o.width + 'px" height="' +
                            this.o.height + 'px"></canvas>');
            this.c = this.$c[0].getContext("2d");

            this.$
                .wrap($('<div style="' + (this.o.inline ? 'display:inline;' : '') +
                        'width:' + this.o.width + 'px;height:' +
                        this.o.height + 'px;"></div>'))
                .before(this.$c);

            if (this.v instanceof Object) {
                this.cv = {};
                this.copy(this.v, this.cv);
            } else {
                this.cv = this.v;
            }

            this.$
                .bind("configure", cf)
                .parent()
                .bind("configure", cf);

            this._listen()
                ._configure()
                ._xy()
                .init();

            this.isInit = true;

            this._draw();

            return this;
        };

        this._draw = function () {

            // canvas pre-rendering
            var d = true,
                c = document.createElement('canvas');

            c.width = s.o.width;
            c.height = s.o.height;
            s.g = c.getContext('2d');

            s.clear();

            s.dH
            && (d = s.dH());

            (d !== false) && s.draw();

            s.c.drawImage(c, 0, 0);
            c = null;
        };

        this._touch = function (e) {

            var touchMove = function (e) {

                var v = s.xy2val(
                            e.originalEvent.touches[s.t].pageX,
                            e.originalEvent.touches[s.t].pageY
                            );

                if (v == s.cv) return;

                if (
                    s.cH
                    && (s.cH(v) === false)
                ) return;


                s.change(s._validate(v));
                s._draw();
            };

            // get touches index
            this.t = k.c.t(e);

            // First touch
            touchMove(e);

            // Touch events listeners
            k.c.d
                .bind("touchmove.k", touchMove)
                .bind(
                    "touchend.k"
                    , function () {
                        k.c.d.unbind('touchmove.k touchend.k');

                        if (
                            s.rH
                            && (s.rH(s.cv) === false)
                        ) return;

                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._mouse = function (e) {

            var mouseMove = function (e) {
                var v = s.xy2val(e.pageX, e.pageY);
                if (v == s.cv) return;

                if (
                    s.cH
                    && (s.cH(v) === false)
                ) return;

                s.change(s._validate(v));
                s._draw();
            };

            // First click
            mouseMove(e);

            // Mouse events listeners
            k.c.d
                .bind("mousemove.k", mouseMove)
                .bind(
                    // Escape key cancel current change
                    "keyup.k"
                    , function (e) {
                        if (e.keyCode === 27) {
                            k.c.d.unbind("mouseup.k mousemove.k keyup.k");

                            if (
                                s.eH
                                && (s.eH() === false)
                            ) return;

                            s.cancel();
                        }
                    }
                )
                .bind(
                    "mouseup.k"
                    , function (e) {
                        k.c.d.unbind('mousemove.k mouseup.k keyup.k');

                        if (
                            s.rH
                            && (s.rH(s.cv) === false)
                        ) return;

                        s.val(s.cv);
                    }
                );

            return this;
        };

        this._xy = function () {
            var o = this.$c.offset();
            this.x = o.left;
            this.y = o.top;
            return this;
        };

        this._listen = function () {

            if (!this.o.readOnly) {
                this.$c
                    .bind(
                        "mousedown"
                        , function (e) {
                            e.preventDefault();
                            s._xy()._mouse(e);
                         }
                    )
                    .bind(
                        "touchstart"
                        , function (e) {
                            e.preventDefault();
                            s._xy()._touch(e);
                         }
                    );
                this.listen();
            } else {
                this.$.attr('readonly', 'readonly');
            }

            return this;
        };

        this._configure = function () {

            // Hooks
            if (this.o.draw) this.dH = this.o.draw;
            if (this.o.change) this.cH = this.o.change;
            if (this.o.cancel) this.eH = this.o.cancel;
            if (this.o.release) this.rH = this.o.release;

            if (this.o.displayPrevious) {
                this.pColor = this.h2rgba(this.o.fgColor, "0.4");
                this.fgColor = this.h2rgba(this.o.fgColor, "0.6");
            } else {
                this.fgColor = this.o.fgColor;
            }

            return this;
        };

        this._clear = function () {
            this.$c[0].width = this.$c[0].width;
        };

        this._validate = function(v) {
            return (~~ (((v < 0) ? -0.5 : 0.5) + (v/this.o.step))) * this.o.step;
        };

        // Abstract methods
        this.listen = function () {}; // on start, one time
        this.extend = function () {}; // each time configure triggered
        this.init = function () {}; // each time configure triggered
        this.change = function (v) {}; // on change
        this.val = function (v) {}; // on release
        this.xy2val = function (x, y) {}; //
        this.draw = function () {}; // on change / on release
        this.clear = function () { this._clear(); };

        // Utils
        this.h2rgba = function (h, a) {
            var rgb;
            h = h.substring(1,7)
            rgb = [parseInt(h.substring(0,2),16)
                   ,parseInt(h.substring(2,4),16)
                   ,parseInt(h.substring(4,6),16)];
            return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + a + ")";
        };

        this.copy = function (f, t) {
            for (var i in f) { t[i] = f[i]; }
        };
    };


    /**
     * k.Dial
     */
    k.Dial = function () {
        k.o.call(this);

        this.startAngle = null;
        this.xy = null;
        this.radius = null;
        this.lineWidth = null;
        this.cursorExt = null;
        this.w2 = null;
        this.PI2 = 2*Math.PI;

        this.extend = function () {
            this.o = $.extend(
                {
                    bgColor : this.$.data('bgcolor') || '#EEEEEE',
                    angleOffset : this.$.data('angleoffset') || 0,
                    angleArc : this.$.data('anglearc') || 360,
                    inline : true
                }, this.o
            );
        };

        this.val = function (v) {
            if (null != v) {
                this.cv = this.o.stopper ? max(min(v, this.o.max), this.o.min) : v;
                this.v = this.cv;
                this.$.val(this.v);
                this._draw();
            } else {
                return this.v;
            }
        };

        this.xy2val = function (x, y) {
            var a, ret;

            a = Math.atan2(
                        x - (this.x + this.w2)
                        , - (y - this.y - this.w2)
                    ) - this.angleOffset;

            if(this.angleArc != this.PI2 && (a < 0) && (a > -0.5)) {
                // if isset angleArc option, set to min if .5 under min
                a = 0;
            } else if (a < 0) {
                a += this.PI2;
            }

            ret = ~~ (0.5 + (a * (this.o.max - this.o.min) / this.angleArc))
                    + this.o.min;

            this.o.stopper
            && (ret = max(min(ret, this.o.max), this.o.min));

            return ret;
        };

        this.listen = function () {
            // bind MouseWheel
            var s = this,
                mw = function (e) {
                            e.preventDefault();
                            var ori = e.originalEvent
                                ,deltaX = ori.detail || ori.wheelDeltaX
                                ,deltaY = ori.detail || ori.wheelDeltaY
                                ,v = parseInt(s.$.val()) + (deltaX>0 || deltaY>0 ? s.o.step : deltaX<0 || deltaY<0 ? -s.o.step : 0);

                            if (
                                s.cH
                                && (s.cH(v) === false)
                            ) return;

                            s.val(v);
                        }
                , kval, to, m = 1, kv = {37:-s.o.step, 38:s.o.step, 39:s.o.step, 40:-s.o.step};

            this.$
                .bind(
                    "keydown"
                    ,function (e) {
                        var kc = e.keyCode;

                        // numpad support
                        if(kc >= 96 && kc <= 105) {
                            kc = e.keyCode = kc - 48;
                        }

                        kval = parseInt(String.fromCharCode(kc));

                        if (isNaN(kval)) {

                            (kc !== 13)         // enter
                            && (kc !== 8)       // bs
                            && (kc !== 9)       // tab
                            && (kc !== 189)     // -
                            && e.preventDefault();

                            // arrows
                            if ($.inArray(kc,[37,38,39,40]) > -1) {
                                e.preventDefault();

                                var v = parseInt(s.$.val()) + kv[kc] * m;

                                s.o.stopper
                                && (v = max(min(v, s.o.max), s.o.min));

                                s.change(v);
                                s._draw();

                                // long time keydown speed-up
                                to = window.setTimeout(
                                    function () { m*=2; }
                                    ,30
                                );
                            }
                        }
                    }
                )
                .bind(
                    "keyup"
                    ,function (e) {
                        if (isNaN(kval)) {
                            if (to) {
                                window.clearTimeout(to);
                                to = null;
                                m = 1;
                                s.val(s.$.val());
                            }
                        } else {
                            // kval postcond
                            (s.$.val() > s.o.max && s.$.val(s.o.max))
                            || (s.$.val() < s.o.min && s.$.val(s.o.min));
                        }

                    }
                );

            this.$c.bind("mousewheel DOMMouseScroll", mw);
            this.$.bind("mousewheel DOMMouseScroll", mw)
        };

        this.init = function () {

            if (
                this.v < this.o.min
                || this.v > this.o.max
            ) this.v = this.o.min;

            this.$.val(this.v);
            this.w2 = this.o.width / 2;
            this.cursorExt = this.o.cursor / 100;
            this.xy = this.w2;
            this.lineWidth = this.xy * this.o.thickness;
            this.lineCap = this.o.lineCap;
            this.radius = this.xy - this.lineWidth / 2;

            this.o.angleOffset
            && (this.o.angleOffset = isNaN(this.o.angleOffset) ? 0 : this.o.angleOffset);

            this.o.angleArc
            && (this.o.angleArc = isNaN(this.o.angleArc) ? this.PI2 : this.o.angleArc);

            // deg to rad
            this.angleOffset = this.o.angleOffset * Math.PI / 180;
            this.angleArc = this.o.angleArc * Math.PI / 180;

            // compute start and end angles
            this.startAngle = 1.5 * Math.PI + this.angleOffset;
            this.endAngle = 1.5 * Math.PI + this.angleOffset + this.angleArc;

            var s = max(
                            String(Math.abs(this.o.max)).length
                            , String(Math.abs(this.o.min)).length
                            , 2
                            ) + 2;

            this.o.displayInput
                && this.i.css({
                        'width' : ((this.o.width / 2 + 4) >> 0) + 'px'
                        ,'height' : ((this.o.width / 3) >> 0) + 'px'
                        ,'position' : 'absolute'
                        ,'vertical-align' : 'middle'
                        ,'margin-top' : ((this.o.width / 3) >> 0) + 'px'
                        ,'margin-left' : '-' + ((this.o.width * 3 / 4 + 2) >> 0) + 'px'
                        ,'border' : 0
                        ,'background' : 'none'
                        ,'font' : 'bold ' + ((this.o.width / s) >> 0) + 'px Arial'
                        ,'text-align' : 'center'
                        ,'color' : this.o.inputColor || this.o.fgColor
                        ,'padding' : '0px'
                        ,'-webkit-appearance': 'none'
                        })
                || this.i.css({
                        'width' : '0px'
                        ,'visibility' : 'hidden'
                        });
        };

        this.change = function (v) {
            this.cv = v;
            this.$.val(v);
        };

        this.angle = function (v) {
            return (v - this.o.min) * this.angleArc / (this.o.max - this.o.min);
        };

        this.draw = function () {

            var c = this.g,                 // context
                a = this.angle(this.cv)    // Angle
                , sat = this.startAngle     // Start angle
                , eat = sat + a             // End angle
                , sa, ea                    // Previous angles
                , r = 1;

            c.lineWidth = this.lineWidth;

            c.lineCap = this.lineCap;

            this.o.cursor
                && (sat = eat - this.cursorExt)
                && (eat = eat + this.cursorExt);

            c.beginPath();
                c.strokeStyle = this.o.bgColor;
                c.arc(this.xy, this.xy, this.radius, this.endAngle, this.startAngle, true);
            c.stroke();

            if (this.o.displayPrevious) {
                ea = this.startAngle + this.angle(this.v);
                sa = this.startAngle;
                this.o.cursor
                    && (sa = ea - this.cursorExt)
                    && (ea = ea + this.cursorExt);

                c.beginPath();
                    c.strokeStyle = this.pColor;
                    c.arc(this.xy, this.xy, this.radius, sa, ea, false);
                c.stroke();
                r = (this.cv == this.v);
            }

            c.beginPath();
                c.strokeStyle = r ? this.o.fgColor : this.fgColor ;
                c.arc(this.xy, this.xy, this.radius, sat, eat, false);
            c.stroke();
        };

        this.cancel = function () {
            this.val(this.v);
        };
    };

    $.fn.dial = $.fn.knob = function (o) {
        return this.each(
            function () {
                var d = new k.Dial();
                d.o = o;
                d.$ = $(this);
                d.run();
            }
        ).parent();
    };

})(jQuery);
(function(window){

  var WORKER_PATH = "/assets/javascripts/workspace/recorderWorker.js";

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;``
    this.context = source.context;
    this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' })
    }

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    }

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  }

  window.Recorder = Recorder;

})(window);
var reverbIrBuffers = [];

function logslider(position) {
  // position will be between 0 and 100
  var minp = 0;
  var maxp = 100;

  // The result should be between 40hz an 20000hz
  var minv = Math.log(40);
  var maxv = Math.log(20000);

  // calculate adjustment factor
  var scale = (maxv-minv) / (maxp-minp);

  return Math.exp(minv + scale*(position-minp));
}

function muteTrack(trackNumber) {
    var node = trackMasterGains[trackNumber];
    if(!node.isMuted){
        node.node.gain.value = 0;
        node.isMuted = true;
    }
    else if (node.isMuted){
        node.node.gain.value = 1;
        node.isMuted = false;
    }
}

function solo(trackNumber) {
    var thisNode = trackMasterGains[trackNumber];
    if (!thisNode.isSolo) {
        thisNode.isSolo = true;

        for (var i=1; i <= globalNumberOfTracks; i++) {
            var node = trackMasterGains[i];

                if(i != trackNumber){
                    if(!node.isMuted){
                        node.node.gain.value = 0;
                        node.isMuted = true;
                    }
                }
        }
    }else if (thisNode.isSolo) {
        thisNode.isSolo = false;

        for (var i=1; i <= globalNumberOfTracks; i++) {
            var node = trackMasterGains[i];

                if(i != trackNumber){
                    if(node.isMuted){
                        node.node.gain.value = 1;
                        node.isMuted = false;
                    }
                }
        }
    }

}

function setMasterVolume(newValue) {
    var node = masterGainNode;
    node.gain.value = (newValue/100)* (newValue/100);
}

function setTrackVolume(trackNumber,newValue) {
    var node = trackVolumeGains[trackNumber];
    node.gain.value = (newValue/100)* (newValue/100);
}

function setCompressorThresholdValue(trackNumber,threshold){
    var node = trackCompressors[trackNumber];
    node.threshold.value = threshold;
}

function setCompressorRatioValue(trackNumber,ratio){
    var node = trackCompressors[trackNumber];
    node.ratio.value = ratio;
}

function setCompressorAttackValue(trackNumber,attack){
    var node = trackCompressors[trackNumber];
    node.attack.value = attack/1000;
}

function setFilterCutoffValue(trackNumber,freq){
    var node = trackFilters[trackNumber];
    node.frequency.value = logslider(freq);
}

function setFilterQValue(trackNumber,Q){
    var node = trackFilters[trackNumber];
    node.Q.value = Q;
}

function setReverbWetDryValue(trackNumber, v){
    var wet = v/100;
    var dry = 1-wet;
    //set wetGain node gain
    trackReverbs[trackNumber][4].gain.value = wet;

    //set dryGain node gain
    trackReverbs[trackNumber][5].gain.value = dry;
}

function setReverbIr(trackNumber, v){
    //if reverb buffer has already been loaded from wav file, use the exisiting arrayBuffer
   if (reverbIrBuffers[v] != null) {
    trackReverbs[trackNumber][2].buffer = reverbIrBuffers[v]

    //if not, create an arrayBuffer object from the wav file
   }else{
    loadReverbIR(v, trackReverbs[trackNumber][2]);
   }
}

function setDelayWetDryValue(trackNumber, v) {
    var wet = v/100;
    var dry = 1-wet;

    //set wet gain node
    trackDelays[trackNumber][3].gain.value = wet;

    //set dry gain node
    trackDelays[trackNumber][2].gain.value = dry;
}

function setDelayTimeValue(trackNumber, v) {
    var time = v*secondsPer16;

    //access delay node
    trackDelays[trackNumber][4].delayTime.value =time;
}

function setDelayFeedbackValue(trackNumber, v) {
    v = v/100;
    if (v >= 1.0) {
        v = 0.99
    }

    trackDelays[trackNumber][5].gain.value = v;
}

function createTrackReverb() {
    var reverbNetwork = [6];

    var reverbIn = ac.createGain();
    var dryGain = ac.createGain();
    var wetGain = ac.createGain();
    var reverbOut = ac.createGain();
    var conv1 = ac.createConvolver();
    var rev1Gain = ac.createGain();

    wetGain.connect(reverbOut);
    dryGain.connect(reverbOut);
    rev1Gain.connect(wetGain);

    conv1.connect(rev1Gain);
    loadReverbIR(0, conv1);


    reverbIn.connect(dryGain);
    reverbIn.connect(conv1);

    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.5;

    reverbNetwork[0]=reverbIn;
    reverbNetwork[1]=reverbOut;
    reverbNetwork[2]=conv1;
    reverbNetwork[3]=rev1Gain;
    reverbNetwork[4]=wetGain;
    reverbNetwork[5]=dryGain;

    return reverbNetwork;
}

 function loadReverbIR(reverb, convNode) {
    var url;
    switch (reverb) {
        case 0:
            url = '../assets/src/data/ir/BelleMeade.wav';
        break;

        case 1:
            url = '../assets/src/data/ir/ir_rev_short.wav'
        break;
    }

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function () {
	convNode.buffer = ac.createBuffer(request.response, false);
        reverbIrBuffers[reverb] = convNode.buffer;
    }
    request.send();

}

/*function setReverbIR(trackNumber, reverb){
    var reverbList=document.getElementById("reverbList");
    var ir = value=reverbList.options[reverbList.selectedIndex].text;

    loadReverbIR(ir, trackReverbs[trackNumber][2].buffer);
}*/

function setFilterType(trackNumber,type){
    var node = trackFilters[trackNumber];
    if(type == 0){
        node.type = 0;
    } else if(type == 1){
        node.type = 1;
    } else if(type == 2){
        node.type = 2;
    }
}

function createTrackDelay() {
    var delayNetwork = [6];

    var delayIn = ac.createGain();
    var delayOut = ac.createGain();
    var dryGain = ac.createGain();
    var wetGain = ac.createGain();
    var fbGain = ac.createGain();
    debugger;
    var delayNode = ac.createDelay();

    wetGain.connect(delayOut);
    dryGain.connect(delayOut);
    delayIn.connect(dryGain);
    delayIn.connect(delayNode);
    delayNode.connect(fbGain);
    delayNode.connect(wetGain);
    fbGain.connect(delayNode);

    dryGain.gain.value = 0.5;
    wetGain.gain.value = 0.5;
    fbGain.gain.value = 0.2;

    delayNetwork[0] = delayIn;
    delayNetwork[1] = delayOut;
    delayNetwork[2] = dryGain;
    delayNetwork[3] = wetGain;
    delayNetwork[4] = delayNode;
    delayNetwork[5] = fbGain;

    return delayNetwork;

}

function createTrackTremolo() {
    var tremoloNetwork = [5];

    var tremoloIn = ac.createGain();
    var tremoloOut = ac.createGain();
    var lfoGain = ac.createGain();
    var lfo = ac.createOscillator();
    var depth = ac.createGain();

    lfo.type = lfo.SINE;
    lfo.frequency = 0.1;

    lfoGain.gain.value = 1;

    depth.connect(tremoloOut);
    tremoloIn.connect(depth);
    lfoGain.connect(depth.gain);
    lfo.connect(lfoGain);

    lfo.start(0);

    tremoloNetwork[0] = tremoloIn;
    tremoloNetwork[1] = tremoloOut;
    tremoloNetwork[2] = lfoGain;
    tremoloNetwork[3] = lfo;
    tremoloNetwork[4] = depth;

    return tremoloNetwork;
}

function setTremoloRateValue(trackNumber, v) {

    //access rate node
     //trackTremolos[trackNumber][3].stop();
    trackTremolos[trackNumber][3].frequency=v;
     //trackTremolos[trackNumber][3].start();
}

function setTremoloDepthValue(trackNumber, v) {
    v=v/200;
    //access lfo gain node
    trackTremolos[trackNumber][2].gain.value=v;
}
;
var ac = new (window.AudioContext || window.webkitAudioContext);
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
var masterGainNode = ac.createGain();
masterGainNode.gain.value = .8;
masterGainNode.connect(ac.destination);

var micStream;
var activeRecorder;
var recordingCount = 1000;

//array of track master gain nodes
var trackMasterGains = [];
var trackVolumeGains = [];
var trackInputNodes = [];
var trackCompressors = [];
var trackReverbs = [];
var trackFilters = [];
var trackDelays = [];
var trackTremolos = [];

//the currently selected track (for editing effects etc.)
var activeTrack;

//json of effect data
var effects;

var buffers = []; //contains AudioBuffer and id# of samples in workspace
var times = []; //contains start times of samples and their id#
var reverbIRs = []
var pixelsPer16 = 6; 			//pixels per 16th note. used for grid snapping
var pixelsPer4 = 4*pixelsPer16;		//pixels per 1/4 note	used for sample canvas size
var bpm = tempo;
var secondsPer16 = 0.25 * 60 / bpm;

jQuery.removeFromArray = function(value, arr) {
    return jQuery.grep(arr, function(elem, index) {
        return elem.id !== value;
    });
};

var globalNumberOfTracks;
var globalWavesurfers = [];

var wavesurfer = (function () {
    'use strict';

    var createWavesurfer = function (song) {
        var startTimes = song.startTime;
        var sampleNumber = 0;
        var sampleUrl = song.url.split("/");
        var sampleTitle = sampleUrl[sampleUrl.length-1];
	var obj;
        $("#libraryList").append("<li id=librarySample" + song.id +" class=\"librarySample\" data-id="+song.id+" data-url="+song.url+" data-duration="+song.duration+"><a href=\"#\">" + sampleTitle + "</a></li>");
        $("#librarySample" + song.id).draggable({
	    revert: true,
	    helper: "clone",
	    start: function(event, ui) { $(this).css("z-index", 10); }
	});
        $.each(startTimes, function(){
	    if(sampleNumber == 0){
		obj = ({bufferURL: song.url, id: song.id, startTimes: song.startTime, track: song.track});
	    }
	    var currentStartTime = song.startTime[sampleNumber];
            var span = document.createElement('span');
            span.id = "sample" + song.id + "Span" + sampleNumber;
            var canvas = document.createElement('canvas');
	    canvas.className = "sample";
            canvas.id = "sample" + song.id + "Canvas" + sampleNumber;
            $("#track"+song.track).append(span);
            $("#sample" + song.id + "Span" + sampleNumber).append(canvas);
            $("#sample" + song.id + "Span" + sampleNumber).width(parseFloat(song.duration) * ((pixelsPer4*bpm)/60));
            canvas.width = parseFloat(song.duration) * ((pixelsPer4*bpm)/60);
            canvas.height = 80;
            $( "#sample" + song.id + "Span" + sampleNumber).attr('data-startTime',song.startTime[sampleNumber]);
            $( "#sample" + song.id + "Span" + sampleNumber).css('left',"" + parseInt(currentStartTime*pixelsPer16) + "px");
	    $( "#sample" + song.id + "Span" + sampleNumber).css('position','absolute');
            $( "#sample" + song.id + "Span" + sampleNumber).draggable({
                axis: "x",
                containment: "parent",
                grid: [pixelsPer16, 0],		//grid snaps to 16th notes
                stop: function() {
		    //get rid of old entry in table
		    var currentStartBar = $(this).attr('data-startTime');
		    times[currentStartBar] = jQuery.removeFromArray(song.id, times[currentStartBar]);
                    $(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
		    var newStartTime = $(this).attr('data-startTime');
		    if(times[newStartTime] == null){
			times[newStartTime] = [{id: song.id, track: song.track}];
		    } else {
			times[newStartTime].push({id: song.id, track: song.track});
		    }
                }
            });
	    $( "#sample" + song.id + "Span" + sampleNumber ).resizable({
		helper: "ui-resizable-helper",
		handles: "e",
		grid: pixelsPer16
	    });
            var wavesurfer = Object.create(WaveSurfer);
            wavesurfer.init({
                canvas: canvas,
                waveColor: '#08c',
                progressColor: '#08c',
                loadingColor: 'purple',
                cursorColor: 'navy',
                audioContext: ac
            });
            wavesurfer.load(song.url);
	    globalWavesurfers.push(wavesurfer);
            sampleNumber++;
        });

        return obj;
    };


    var processData = function (json) {
	var numberOfTracks = parseInt(json.projectInfo.tracks);
	effects = json.projectInfo.effects;
	//create track-specific nodes
	globalNumberOfTracks = numberOfTracks;
	createNodes(numberOfTracks);

	for(var i=0;i<numberOfTracks;i++){
	   var currentTrackNumber = i+1;
	    createTrack(currentTrackNumber);
	    $.each(effects[i],function(){
		if(this.type == "Compressor"){
		    var trackCompressor = ac.createDynamicsCompressor();
		    var inputNode = trackInputNodes[currentTrackNumber];
		    var volumeNode = trackVolumeGains[currentTrackNumber];
		    inputNode.disconnect();
		    inputNode.connect(trackCompressor);
		    trackCompressor.connect(volumeNode);
		    trackCompressors[currentTrackNumber] = trackCompressor;
		}
		if(this.type == "Filter"){
		    var trackFilter = ac.createBiquadFilter();
		    var inputNode = trackInputNodes[currentTrackNumber];
		    var volumeNode = trackVolumeGains[currentTrackNumber];
		    inputNode.disconnect();
		    inputNode.connect(trackFilter);
		    trackFilter.connect(volumeNode);
		    trackFilters[currentTrackNumber] = trackFilter;
		}
	    });

	}
	//wavesurfers is array of all tracks
        var wavesurfers = json.samples.map(createWavesurfer);
	$.each(wavesurfers, function(){
	    var currentSample = this;
	    //if they are in workspace...
	    if(currentSample != undefined){
		//load the buffer
		load(currentSample.bufferURL, currentSample.id);
		//store the times
		$.each(currentSample.startTimes, function(){
		    var currentStartTime = this;
		 if(times[currentStartTime] == null){
			times[currentStartTime] = [{id: currentSample.id, track: currentSample.track}];
		    } else {
			times[currentStartTime].push({id: currentSample.id, track: currentSample.track});
		    }
		});
	    }
	});
    };



    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState == this.DONE && this.status == 200) {
            processData(JSON.parse(this.responseText));
        }
    };
    xhr.open('GET', '../assets/src/data/samples.txt');
    xhr.send();
}());


function load (src, id) {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', function (e) {
	ac.decodeAudioData(
	    e.target.response,
	    function (buffer) {
		buffers[id] = {buffer: buffer};
	    },
	    Error
	);
    }, false);
    xhr.send();
};



initSched({
    bufferArray: buffers,
    audioContext: ac
});


$('body').bind('playPause-event', function(e){
    schedPlay(ac.currentTime);
});
$('body').bind('stop-event', function(e){
    schedStop();
});
$('body').bind('stepBackward-event', function(e){
    schedStepBack(ac.currentTime);
});
$('body').bind('mute-event', function(e, trackNumber){
    muteTrack(trackNumber);
});
$('body').bind('solo-event', function(e, trackNumber){
    solo(trackNumber);
});

$('body').bind('zoomIn-event', function(e){
    timelineZoomIn();
});

$('body').bind('zoomOut-event', function(e){
    timelineZoomOut();
});

$(document).ready(function(){
    $(".effectDrag").draggable({
	revert: true,
	helper: "clone"
    });
    $("#effectSortable").sortable({
	cancel: "canvas,input",
	/*
	sort: function(event, ui){
	     console.log($( "#effectSortable" ).sortable( "toArray" ))
	}*/

    });

    $("#trackEffects").droppable({
	accept: ".effectDrag",
	drop: function(event, ui){
	    $("#"+ui.draggable[0].textContent).removeClass('hidden');
	    if(ui.draggable[0].textContent == "Reverb"){
		$("#reverbIrSelectKnob").val(0).trigger('change');
		$("#reverbWetDryKnob").val(50).trigger('change');


		var trackReverb = createTrackReverb();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		inputNode.disconnect();
		inputNode.connect(trackReverb[0]);

		if (trackFilters[activeTrack] != null ) {
		    trackReverb[1].connect(trackFilters[activeTrack]);
		}else if (trackCompressors[activeTrack != null]) {
		    trackReverb[1].connect(trackCompressors[activeTrack]);
		}else if (trackTremolos[activeTrack != null]) {
		    trackReverb[1].connect(trackTremolos[activeTrack][0]);
		}else if(trackDelays[activeTrack] != null){
		    trackReverb[1].connect(trackDelays[activeTrack][0]);
		}else{
		    trackReverb[1].connect(volumeNode);
		}

		trackReverbs[activeTrack] = trackReverb;
		effects[activeTrack-1].push({
		    type: "Reverb",
		    ir:  "0",
		    wetDry: "50"
		});
	    }
	    if(ui.draggable[0].textContent == "Filter"){
		$("#filterCutoffKnob").val(30).trigger('change');
		$("#filterQKnob").val(1).trigger('change');
		$("#filterTypeKnob").val(0).trigger('change');
		var trackFilter = ac.createBiquadFilter();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackFilter);
		}else {
		    inputNode.disconnect();
		    inputNode.connect(trackFilter);
		}

		if (trackCompressors[activeTrack] != null){
		    trackFilter.connect(trackCompressors[activeTrack]);
		}else if (trackTremolos[activeTrack != null]) {
		    trackFilter.connect(trackTremolos[activeTrack][0]);
		}else if(trackDelays[activeTrack] != null){
		    trackFilter.connect(trackDelays[activeTrack][0]);
		}else{
		    trackFilter.connect(volumeNode);
		}

		trackFilters[activeTrack] = trackFilter;
		effects[activeTrack-1].push({
		    type: "Filter",
		    cutoff: "30",
		    q: "1",
		    filterType: "0"
		});
	    }
	    if(ui.draggable[0].textContent == "Compressor"){
		$("#compressorThresholdKnob").val(-24).trigger('change');
		$("#compressorRatioKnob").val(12).trigger('change');
		$("#compressorAttackKnob").val(3).trigger('change');
		var trackCompressor = ac.createDynamicsCompressor();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackFilters[activeTrack] != null){
		    trackFilters[activeTrack].disconnect();
		    trackFilters[activeTrack].connect(trackCompressor);
		}else if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackCompressor);
		}else {
		    inputNode.disconnect();
		    inputNode.connect(trackCompressor);
		}

		 if (trackTremolos[activeTrack != null]) {
		    trackCompressor.connect(trackTremolos[activeTrack][0]);
		}else if (trackDelays[activeTrack] != null) {
		    trackCompressor.connect(trackDelays[activeTrack][0]);
		}else{
		    trackCompressor.connect(volumeNode);
		}

		trackCompressors[activeTrack] = trackCompressor;
		effects[activeTrack-1].push({
		    type: "Compressor",
		    threshold: "-24",
		    ratio: "12",
		    attack: ".003"
		});
		//console.log(effects[activeTrack-1]);
	    }
	    if(ui.draggable[0].textContent == "Tremolo"){

		$("#tremoloRateKnob").val(1).trigger('change');
		$("#tremoloDepthKnob").val(10).trigger('change');
		var trackTremolo = createTrackTremolo();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackCompressors[activeTrack] != null){
		    trackCompressors[activeTrack].disconnect();
		    trackCompressors[activeTrack].connect(trackTremolo[0]);
		}else if(trackFilters[activeTrack] != null) {
		    trackFilters[activeTrack].disconnect();
		    trackFilters[activeTrack].connect(trackTremolo[0]);
		}else if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackTremolo[0]);
		}else {
		    inputNode.disconnect();
		    inputNode.connect(trackTremolo[0]);
		}

		if (trackDelays[activeTrack] != null) {
		    trackTremolo[1].connect(trackDelays[activeTrack][0]);
		}else{
		    trackTremolo[1].connect(volumeNode);
		}

		trackTremolos[activeTrack] = trackTremolo;
		effects[activeTrack-1].push({
		    type: "Tremolo",
		    rate: "1",
		    depth: "10"
		});
		//console.log(effects[activeTrack-1]);
	    }
	    if(ui.draggable[0].textContent == "Delay"){
		$("#delayTimeKnob").val(1).trigger('change');
		$("#delayFeedbackKnob").val(20).trigger('change');
		$("#delayWetDryKnob").val(50).trigger('change');
		var trackDelay = createTrackDelay();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackFilters[activeTrack] != null){
		    trackFilters[activeTrack].disconnect();
		    trackFilters[activeTrack].connect(trackDelay[0]);
		}else if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackDelay[0]);
		}else if(trackCompressors[activeTrack] != null) {
		    trackCompressors[activeTrack].disconnect();
		    trackCompressors[activeTrack].connect(trackDelay[0]);
		}else if(trackTremolos[activeTrack] != null) {
		    trackTremolos[activeTrack][1].disconnect();
		    trackTremolos[activeTrack][1].connect(trackDelay[0]);
		}else{
		    inputNode.disconnect();
		    inputNode.connect(trackDelay[0]);
		}

		trackDelay[1].connect(volumeNode);

		trackDelays[activeTrack] = trackDelay;
		effects[activeTrack-1].push({
		    type: "Delay",
		    time: "1",
		    feedback: "20",
		    wetDry: "50"
		});
	    }




	}

    });



    $("#compressorThresholdKnob").knob({
	change : function(v) {
	    setCompressorThresholdValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Compressor"){
		    this.threshold = v;
		}
	    });
	}
    });
    $("#compressorRatioKnob").knob({
	change : function(v) {
	    setCompressorRatioValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Compressor"){
		    this.ratio = v;
		}
	    });
	}
    });
    $("#compressorAttackKnob").knob({
	change : function(v) {
	    setCompressorAttackValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Compressor"){
		    this.attack = v/1000;
		}
	    });
	}
    });

    $("#filterCutoffKnob").knob({
	change : function(v) {
	    setFilterCutoffValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Filter"){
		    this.cutoff = v;
		}
	    });
	}
    });
    $("#filterQKnob").knob({
	change : function(v) {
	    setFilterQValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Filter"){
		    this.q = v;
		}
	    });
	}
    });
    $("#filterTypeKnob").knob({
	change : function(v) {
	    setFilterType(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Filter"){
		    this.filterType = v;
		}
	    });
	}
    });

    $("#reverbWetDryKnob").knob({
	change : function(v) {
	    setReverbWetDryValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Reverb"){
		    this.wetDry = v;
		}
	    });
	}
    });
      $("#reverbIrSelectKnob").knob({
	change : function(v) {
	    setReverbIr(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Reverb"){
		    this.ir = v;
		}
	    });
	}
    });

    //$("#reverbList").onchange= setReverbIR()

    $("#delayTimeKnob").knob({
	change : function(v) {
	    setDelayTimeValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Delay"){
		    this.time = v;
		}
	    });
	}
    });
    $("#delayFeedbackKnob").knob({
	change : function(v) {
	    setDelayFeedbackValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Delay"){
		    this.feedback = v;
		}
	    });
	}
    });
    $("#delayWetDryKnob").knob({
	change : function(v) {
	    setDelayWetDryValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Delay"){
		    this.wetDry = v;
		}
	    });
	}
    });

      $("#tremoloRateKnob").knob({
	change : function(v) {
	    setTremoloRateValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Tremolo"){
		    this.rate = v;
		}
	    });
	}
    });
    $("#tremoloDepthKnob").knob({
	change : function(v) {
	    setTremoloDepthValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Tremolo"){
		    this.depth = v;
		}
	    });
	}
    });



    $(".dial").knob();

    $("#playPause").click(function(){
        $('body').trigger('playPause-event');
    });
    $("#stop").click(function(){
        $('body').trigger('stop-event');
    });
    $("#step-backward").click(function(){
        $('body').trigger('stepBackward-event');
    });
    $("#zoomIn").click(function(){
        $('body').trigger('zoomIn-event');
	var WavesurferCanvases = $(".sample");
	$.each(WavesurferCanvases,function(){
	    var wavesurferCanvas = this;
	    var oldWidth = wavesurferCanvas.width;
	    var newWidth = oldWidth*2;
	    wavesurferCanvas.width = newWidth;
	    $($(wavesurferCanvas).parent()[0]).css("width",newWidth+"px");
	    var oldLeft = parseInt($($(wavesurferCanvas).parent()[0]).css("left"));
	    $($(wavesurferCanvas).parent()[0]).css("left",""+oldLeft*2+"px");
	});
	$.each(globalWavesurfers, function(){
	    var wavesurfer = this;
	    wavesurfer.drawer.clear();
	    wavesurfer.drawer.width  = wavesurfer.drawer.width*2;
	    wavesurfer.drawer.drawBuffer(wavesurfer.backend.currentBuffer);
	});
    });
    $("#zoomOut").click(function(){
        $('body').trigger('zoomOut-event');
	var WavesurferCanvases = $(".sample");
	$.each(WavesurferCanvases,function(){
	    var wavesurferCanvas = this;
	    var oldWidth = wavesurferCanvas.width;
	    wavesurferCanvas.width = oldWidth/2 + 1;
	    $($(wavesurferCanvas).parent()[0]).css("width",oldWidth/2 + 1+"px");
	    var oldLeft = parseInt($($(wavesurferCanvas).parent()[0]).css("left"));
	    $($(wavesurferCanvas).parent()[0]).css("left",""+oldLeft/2+"px");
	});
	$.each(globalWavesurfers, function(){
	    var wavesurfer = this;
	    wavesurfer.drawer.clear();
	    wavesurfer.drawer.width = wavesurfer.drawer.width/2 + 1;
	    wavesurfer.drawer.drawBuffer(wavesurfer.backend.currentBuffer);
	});
    });
    $("#trackEffectsClose").click(function(){
	$("#trackEffects").css("display","none");
	$("#masterControl").css("display","none");
    });


    $( "#masterVolume" ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: 80,
      slide: function( event, ui ) {
	setMasterVolume(ui.value );
      }
    });

    $("#addTrackButton").click(function(){
	var newTrackNumber = globalNumberOfTracks+1;
	globalNumberOfTracks++;
	if(globalNumberOfTracks>4){
	    var currentSideBarHeight = parseInt($(".sidebar").css('height'));
	    currentSideBarHeight+=90;
	    $(".sidebar").css('height',""+currentSideBarHeight+"px");
	}
	createTrack(newTrackNumber);
	var trackMasterGainNode = ac.createGain();
	var trackInputNode = ac.createGain();
	var trackVolumeNode = ac.createGain();

	trackMasterGainNode.connect(masterGainNode);
	trackVolumeNode.connect(trackMasterGainNode);
	trackInputNode.connect(trackVolumeNode);

	trackMasterGains[newTrackNumber] = {node: trackMasterGainNode, isMuted: false, isSolo: false};
	trackVolumeGains[newTrackNumber] = trackVolumeNode;
	trackInputNodes[newTrackNumber] = trackInputNode;
    });

   drawTimeline();

});

function createTrack(trackNumber){
    $("#tracks").append("<div class=\"row-fluid\" id=\"selectTrack"+trackNumber+"\"><div class=\"span2 trackBox\" style=\"height: 84px;\"><p style=\"margin: 0 0 0 0;\" id=\"track"+trackNumber+"title\">Track"+trackNumber+"</p><div style=\"margin: 5px 0 5px 0;\" id=\"volumeSlider"+trackNumber+"\"></div><div class=\"btn-toolbar\" style=\"margin-top: 0px;\"><div class=\"btn-group\"><button type=\"button\" class=\"btn btn-mini\" id = \"solo"+trackNumber+"\"><i class=\"icon-headphones\"></i></button><button type=\"button\" class=\"btn btn-mini\" id = \"mute"+trackNumber+"\"><i class=\"icon-volume-off\"></i></button></div><div class=\"btn-group\"><button type=\"button\" class=\"btn btn-mini\" data-toggle=\"button\" id = \"record"+trackNumber+"\"><i class=\"icon-plus-sign\"></i></button></div></div></div><div id=\"track"+trackNumber+"\" class=\"span10 track\"></div></div>");
    if(effects[trackNumber-1] == null){
	effects[trackNumber-1] = [];
    }
    $("#volumeSlider"+trackNumber).slider({
	value: 80,
	orientation: "horizontal",
	range: "min",
	min: 0,
	max: 100,
	animate: true,
	slide: function( event, ui ) {
	    var muteTrackNumber = $(this).attr('id').split('volumeSlider')[1];
	    setTrackVolume(muteTrackNumber, ui.value );
	}
    });
    $("#selectTrack"+trackNumber).click(function(){
	var printTrackNumber = $(this).attr('id').split('selectTrack')[1];
	activeTrack = printTrackNumber;
	//compensation for off by one (track1 = effects[0])
	$(".effect").addClass("hidden");
	$.each(effects[activeTrack-1], function(){
	    var currentEffect = this;
	    $("#"+currentEffect.type).removeClass("hidden");
	    if(currentEffect.type == "Compressor"){
		$("#compressorThresholdKnob").val(currentEffect.threshold).trigger('change');
		$("#compressorRatioKnob").val(currentEffect.ratio).trigger('change');
		$("#compressorAttackKnob").val(currentEffect.attack*1000).trigger('change');
	    }
	    if(currentEffect.type == "Filter"){
		$("#filterCutoffKnob").val(currentEffect.cutoff).trigger('change');
		$("#filterQKnob").val(currentEffect.q).trigger('change');
		$("#filterTypeKnob").val(currentEffect.filterType).trigger('change');
	    }
	    if(currentEffect.type == "Reverb"){
		$("#reverbWetDryKnob").val(currentEffect.wetDry);
		$("#reverbIrSelectKnob").val(currentEffect.ir);

	    }
	    if(currentEffect.type == "Delay"){
		$("#delayTimeKnob").val(currentEffect.time);
		$("#delayFeedbackKnob").val(currentEffect.feedback);
		$("#delayWetDryKnob").val(currentEffect.wetDry);
	    }
	    if(currentEffect.type == "Tremelo"){
		$("#tremeloRateKnob").val(currentEffect.rate).trigger('change');
		$("#tremeloDepthKnob").val(currentEffect.depth).trigger('change');
	    }
	});
	Object.keys(effects[activeTrack-1]);
	$("#trackEffectsHeader").html("Track "+printTrackNumber);
	$("#trackEffects").css("display","block");
	$("#masterControl").css("display","block");
    });
    $("#mute"+trackNumber).click(function(){
	$(this).button('toggle');
	var muteTrackNumber = $(this).attr('id').split('mute')[1];
	$('body').trigger('mute-event', muteTrackNumber);
    });
     $("#solo"+trackNumber).click(function(){
	$(this).button('toggle');
	var soloTrackNumber = $(this).attr('id').split('solo')[1];
	$('body').trigger('solo-event', soloTrackNumber);
    });
    $("#record"+trackNumber).click(function(){
	var recordTrackNumber = $(this).attr('id').split('record')[1];
	$(this).button('toggle');
	if($(this).hasClass('active')){
	    //Start Recording
	    var input = ac.createMediaStreamSource(micStream);
	    //input.connect(ac.destination);
	    activeRecorder = new Recorder(input);
	    activeRecorder.record();
	    schedPlay(ac.currentTime);
	} else {
	    //Stop Recording
	    activeRecorder.stop();

	    var recordingDuration;

	    var startBar;
	    if(pauseBeat==undefined){
		startBar = 0;
	    } else {
		startBar = pauseBeat;
	    }

	    activeRecorder.getBuffer(function(recordingBuffer){
		recordingDuration = recordingBuffer[0].length/ac.sampleRate;

		var newBuffer = ac.createBuffer( 2, recordingBuffer[0].length, ac.sampleRate );
		//var newSource = ac.createBufferSourceNode();
		newBuffer.getChannelData(0).set(recordingBuffer[0]);
		newBuffer.getChannelData(1).set(recordingBuffer[1]);
		//newSource.buffer = newBuffer;

		var span = document.createElement('span');
		span.id = "recording" + recordingCount + "Span";
		var canvas = document.createElement('canvas');
		canvas.className = "sample";
		canvas.id = "recording" + recordingCount + "Canvas";
		$("#track"+recordTrackNumber).append(span);
		$("#recording" + recordingCount + "Span").append(canvas);
		$("#recording" + recordingCount + "Span").width(parseFloat(recordingDuration) * ((pixelsPer4*bpm)/60));
		$("#recording" + recordingCount + "Span").attr('data-startTime',startBar);
		$("#recording" + recordingCount + "Span").css('left',"" + startBar*pixelsPer16 + "px");
		$("#recording" + recordingCount + "Span").css('position','absolute');
		$("#recording" + recordingCount + "Span").draggable({
		    axis: "x",
		    containment: "parent",
		    grid: [pixelsPer16, 0],		//grid snaps to 16th notes
		    stop: function() {
			//get rid of old entry in table
			var currentRecordingCount = parseInt($(this).attr('id').split('recording')[1]);
			var currentStartBar = $(this).attr('data-startTime');
			times[currentStartBar] = jQuery.removeFromArray(currentRecordingCount, times[currentStartBar]);
			$(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
			var newStartTime = $(this).attr('data-startTime');
			if(times[newStartTime] == null){
			    times[newStartTime] = [{id: currentRecordingCount, track: recordTrackNumber}];
			} else {
			    times[newStartTime].push({id: currentRecordingCount, track: recordTrackNumber});
			}
			console.log("Old Start Time: "+ currentStartBar);
			console.log("New Start Time: "+ newStartTime);
		    }
		});
		canvas.width = parseFloat(recordingDuration) * ((pixelsPer4*bpm)/60);
		canvas.height = 80;

		activeRecorder.exportWAV(function(blob){
		    var url = URL.createObjectURL(blob);
		    var wavesurfer = Object.create(WaveSurfer);
		    wavesurfer.init({
			canvas: canvas,
			waveColor: '#08c',
			progressColor: '#08c',
			loadingColor: 'purple',
			cursorColor: 'navy',
			audioContext: ac
		    });
		    wavesurfer.load(url);
		    globalWavesurfers.push(wavesurfer);
		    buffers[recordingCount] = {buffer: newBuffer};

		    if(times[startBar] == null){
			times[startBar] = [{id: recordingCount, track: recordTrackNumber}];
		    } else {
			times[startBar].push({id: recordingCount, track: recordTrackNumber});
		    }
		    recordingCount++;
		});
	    });



	}

    });
    $("#track"+trackNumber+"title").storage({
	storageKey : 'track'+trackNumber
    });
    $( "#track"+trackNumber ).droppable({
	accept: ".librarySample",
	drop: function( event, ui ) {
	    var startBar = Math.floor((ui.offset.left-$(this).offset().left)/6);
	    var sampleStartTime = startBar;
	    var rand = parseInt(Math.random() * 10000);
	    var span = document.createElement('span');
	    var sampleID = ui.helper.attr("data-id");
	    var sampleDuration = ui.helper.attr("data-duration");
	    var sampleURL = ui.helper.attr("data-url");
	    span.id = "sample" + sampleID + "Span" + rand;
	    var canvas = document.createElement('canvas');
	    canvas.className = "sample";
	    canvas.id = "sample" + sampleID + "Canvas" + rand;
	    $(this).append(span);
	    $("#sample" + sampleID + "Span" + rand).append(canvas);
	    $("#sample" + sampleID + "Span" + rand).width(parseFloat(sampleDuration) * ((pixelsPer4*bpm)/60));
	    canvas.width = parseFloat(sampleDuration) * ((pixelsPer4*bpm)/60);
	    canvas.height = 80;
	    $( "#sample" + sampleID + "Span" + rand).attr('data-startTime',startBar);
	    $( "#sample" + sampleID + "Span" + rand).css('left',"" + startBar*pixelsPer16 + "px");
	    $( "#sample" + sampleID + "Span" + rand).css('position','absolute');
	    $( "#sample" + sampleID + "Span" + rand).draggable({
		axis: "x",
		containment: "parent",
		grid: [pixelsPer16, 0],		//grid snaps to 16th notes
		stop: function() {
		    var currentStartBar = $(this).attr('data-startTime');
		    times[currentStartBar] = jQuery.removeFromArray(sampleID, times[currentStartBar]);
		    $(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
		    var newStartTime = $(this).attr('data-startTime');
		    if(times[newStartTime] == null){
			times[newStartTime] = [{id: sampleID, track: trackNumber}];
		    } else {
			times[newStartTime].push({id: sampleID, track: trackNumber});
		    }
		}
	    });

	    var wavesurfer = Object.create(WaveSurfer);
	    wavesurfer.init({
		canvas: canvas,
		waveColor: 'violet',
		progressColor: 'purple',
		loadingColor: 'purple',
		cursorColor: 'navy',
		audioContext: ac
	    });
	    wavesurfer.load(sampleURL);
	    globalWavesurfers.push(wavesurfer);
	    if(buffers[sampleID]==undefined){
		load(sampleURL, sampleID);
	    }
	    if(times[sampleStartTime] == null){
		times[sampleStartTime] = [{id: sampleID, track: trackNumber}];
	    } else {
		times[sampleStartTime].push({id: sampleID, track: trackNumber});
	    }
	}
    });
}

function createNodes(numTracks) {
    //for each track create a master gain node. specific tracks represented by array index i
    for (var i = 1; i <= numTracks; i++) {
	var trackMasterGainNode = ac.createGain();
	var trackInputNode = ac.createGain();
	var trackVolumeNode = ac.createGain();

	trackMasterGainNode.connect(masterGainNode);
	trackVolumeNode.connect(trackMasterGainNode);
	trackInputNode.connect(trackVolumeNode);

	trackMasterGains[i] = {node: trackMasterGainNode, isMuted: false, isSolo: false};
	trackVolumeGains[i] = trackVolumeNode;
	trackInputNodes[i] = trackInputNode;
    }
}

function startUserMedia(stream) {
    micStream = stream;
}

window.onload = function init() {
    try {
      // webkit shim
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      window.URL = window.URL || window.webkitURL;

    } catch (e) {
      alert('No web audio support in this browser!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
    });
};
var sourceNode;
var splitter;
var analyser, analyser2;
var javascriptNode;

// get the context from the canvas to draw on
var ctx = $("#VUmeterCanvas").get()[0].getContext("2d");

// create a gradient for the fill. Note the strange
// offset, since the gradient is calculated based on
// the canvas, not the specific element we draw
var gradient = ctx.createLinearGradient(0,0,0,80);
gradient.addColorStop(1,'#000000');
gradient.addColorStop(0.75,'#ff0000');
gradient.addColorStop(0.25,'#ffff00');
gradient.addColorStop(0,'#ffffff');


setupAudioNodes();

function setupAudioNodes() {

    // setup a javascript node
    javascriptNode = ac.createScriptProcessor(2048, 1, 1);
    // connect to destination, else it isn't called
    javascriptNode.connect(ac.destination);

    // setup a analyzer
    analyser = ac.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    analyser2 = ac.createAnalyser();
    analyser2.smoothingTimeConstant = 0.0;
    analyser2.fftSize = 1024;

    // create a buffer source node
    //sourceNode = ac.createBufferSource();
    splitter = ac.createChannelSplitter();

    // connect the source to the analyser and the splitter
    masterGainNode.connect(splitter);

    // connect one of the outputs from the splitter to
    // the analyser
    splitter.connect(analyser,0,0);
    splitter.connect(analyser2,1,0);

    // connect the splitter to the javascriptnode
    // we use the javascript node to draw at a
    // specific interval.
    analyser.connect(javascriptNode);

}

// when the javascript node is called
// we use information from the analyzer node
// to draw the volume
javascriptNode.onaudioprocess = function() {

    // get the average for the first channel
    var array =  new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    var average = getAverageVolume(array);

    // get the average for the second channel
    var array2 =  new Uint8Array(analyser2.frequencyBinCount);
    analyser2.getByteFrequencyData(array2);
    var average2 = getAverageVolume(array2);

    // clear the current state
    ctx.clearRect(0, 0, 30, 80);

    // set the fill style
    ctx.fillStyle=gradient;

    // create the meters
    ctx.fillRect(0,80-average,10,80);
    ctx.fillRect(15,80-average2,10,80);
}

function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}
