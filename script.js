/* Variables */

let rounds = 6;
let work_time = 40;
let rest_time = 20;

let is_running = false;
let current_round = 1;
let time = work_time;
let state = "work";
let is_countdown = false;


let intervalID;


/* Functions */
run_timer = () => {
    if (current_round <= rounds) {
        if (is_running) {
            if (time == 2) {
                if (!(state == "work" && current_round == rounds)) {
                    playBeep("long");
                } else {
                    playBeep("short"); 
                    setTimeout(() => playBeep("short"), 200); 
                    setTimeout(() => playBeep("short"), 400);
                }
            }
            if (time == 1) {
                if (state == "work") {
                    current_round++;
                    state = "rest";
                    time = rest_time;
                } else if (state == "rest") {
                    state = "work";
                    time = work_time;
                }
            } else {
                time--;
            }
            render_UI();
        }
        if (current_round == rounds && time == 1 && state == "work") {
            is_running = false;
            clearInterval(intervalID);
            reset();
            render_UI();
        }
    }
}

// --- Web Audio engine ---

let audioCtx = null;
let audioBuffers = {};
let audioReady = false;
let audioLoading = false;

// Create / resume AudioContext
function ensureAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

// Load and decode a single sound file into a buffer
async function loadSound(name, url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioBuffers[name] = audioBuffer;
}

// Load all sounds once
async function initAudioBuffers() {
    if (audioReady || audioLoading) return;
    audioLoading = true;

    ensureAudioContext();

    try {
        await Promise.all([
            loadSound("countdown", "sound/countdown.mp3"),
            loadSound("long", "sound/long_beep.mp3"),
            loadSound("short", "sound/short_beep.mp3")
        ]);
        audioReady = true;
    } catch (e) {
        console.error("Error loading audio buffers:", e);
    } finally {
        audioLoading = false;
    }
}

// Play a sound by name ("countdown", "long", "short")
function playBeep(name) {
    if (!audioReady || !audioCtx) return;
    ensureAudioContext();

    const buffer = audioBuffers[name];
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}



start = async () => {
    if (!audioReady) { 
        ensureAudioContext(); 
        await initAudioBuffers(); 
    }
    if(current_round == 1 && time == work_time) {
        is_countdown = true;
        playBeep("countdown");

        setTimeout(() => {
            is_countdown = false;
            is_running = true;
            intervalID = setInterval(run_timer, 1000);
        }, 3000);
    } else {
        is_running = true;
        intervalID = setInterval(run_timer, 1000);
    }
}


stop = () => {
    is_running = false;
    is_countdown = false;
    clearInterval(intervalID);
}


reset = () => {
    is_running = false;
    is_countdown = false;
    clearInterval(intervalID);
    current_round = 1;
    time = work_time;
    state = "work";
}



render_UI = () => {
    UI_state = document.getElementById("state");
    UI_time_left = document.getElementById("time-left");
    UI_work_bar = document.getElementById("work-bar-fill");
    UI_rounds = document.getElementById("rounds");
    UI_start_stop_btn = document.getElementById("start-stop-btn");

    if (state == "work") {
        UI_state.classList.remove("rest-font");
        UI_state.classList.add("work-font");
    } else if (state == "rest") {
        UI_state.classList.remove("work-font");
        UI_state.classList.add("rest-font");
    }

    UI_state.innerHTML = state;


    let minutes = Math.floor(time / 60);
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    let seconds = time % 60;
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    let UI_time = minutes + ":" + seconds;

    UI_time_left.innerHTML = UI_time;

    if (state == "work") {
        UI_work_bar.classList.remove("rest-bg");
        UI_work_bar.classList.add("work-bg");
        UI_work_bar.style.width = (time / work_time) * 100 + "%";
    } else if (state == "rest") {
        UI_work_bar.classList.remove("work-bg");
        UI_work_bar.classList.add("rest-bg");
        UI_work_bar.style.width = (time / rest_time) * 100 + "%";
    }


    UI_rounds.innerHTML = current_round + "/" + rounds;

    if (is_running) {
        UI_start_stop_btn.classList.remove("start");
        UI_start_stop_btn.classList.add("stop");
        UI_start_stop_btn.innerHTML = "Stop";
    } else {
        UI_start_stop_btn.classList.remove("stop");
        UI_start_stop_btn.classList.add("start");
        UI_start_stop_btn.innerHTML = "Start";
    }

    if (is_countdown) {
        UI_start_stop_btn.disabled = true;
        document.getElementById("reset-btn").disabled = true;
        document.getElementById("settings").disabled = true;
    } else {
        UI_start_stop_btn.disabled = false;
        document.getElementById("reset-btn").disabled = false;
        document.getElementById("settings").disabled = false;
    }
}

render_UI();

/* Event Listeners */
document.getElementById("start-stop-btn").addEventListener("click", 
    () => {
        if (is_running) {
            stop();
        } else {
            start();
        }

        render_UI();
    }
);
document.getElementById("reset-btn").addEventListener("click", () => {
    reset();
    render_UI();
});
document.getElementById("settings").addEventListener("click", () => {
    document.getElementById("timer-screen").classList.remove("active");
    document.getElementById("settings-screen").classList.add("active");
})
document.getElementById("back").addEventListener("click", () => {
    document.getElementById("timer-screen").classList.add("active");
    document.getElementById("settings-screen").classList.remove("active");
})


/* Form handling */

const form = document.getElementById("settings-form");
form.addEventListener("submit", (event) => {
    event.preventDefault();
    rounds = parseInt(document.getElementById("rounds-number").value);
    const workMin = document.getElementById("work-number-minutes").value;
    const workSec = document.getElementById("work-number-seconds").value;
    work_time = parseInt(workMin) * 60 + parseInt(workSec);

    const restMin = document.getElementById("rest-number-minutes").value;
    const restSec = document.getElementById("rest-number-seconds").value;
    rest_time = parseInt(restMin) * 60 + parseInt(restSec);

    document.getElementById("timer-screen").classList.add("active");
    document.getElementById("settings-screen").classList.remove("active");

    
    reset();
    render_UI();
});













