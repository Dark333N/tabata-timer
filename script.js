/* Variables */

let rounds = 6;
let work_time = 40;
let rest_time = 20;

const countdown_audio = new Audio("sound/countdown.mp3");
const long_beep = new Audio("sound/long_beep.mp3");
const short_beep1 = new Audio("sound/short_beep.mp3");
const short_beep2 = new Audio("sound/short_beep.mp3");
const short_beep3 = new Audio("sound/short_beep.mp3");

let audioCtx = null;

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
            if (time == 1) {
                if (!(state == "work" && current_round == rounds)) {
                    playSound(long_beep);
                } else {
                    playSound(short_beep1); 
                    setTimeout(() => playSound(short_beep2), 200); 
                    setTimeout(() => playSound(short_beep3), 400);
                }
            }
            if (time == 0) {
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
        if (current_round == rounds && time == 0 && state == "work") {
            is_running = false;
            clearInterval(intervalID);
            reset();
            render_UI();
        }
    }
}

let audioUnlocked = false;

function unlockAudio() {
    // Create context once
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // If already unlocked, just resume if needed
    if (audioUnlocked) {
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return;
    }

    // Create a 1-frame silent buffer to unlock audio
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    try {
        source.start(0);
        audioUnlocked = true;
    } catch (e) {
        // iOS sometimes throws if not in a gesture
        console.log("Audio unlock failed, will retry on next gesture");
    }
}

function unlockAllSounds() {
    const sounds = [
        countdown_audio,
        long_beep,
        short_beep1,
        short_beep2,
        short_beep3
    ];

    sounds.forEach(sound => {
        sound.volume = 0.001; // barely audible but not muted
        sound.currentTime = 0;

        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.volume = 1.0;
        }).catch(() => {
            if (audioCtx && audioCtx.state === "suspended") {
                audioCtx.resume().then(() => {
                    sound.play().then(() => {
                        sound.pause();
                        sound.currentTime = 0;
                        sound.volume = 1.0;
                    });
                });
            }
        });
    });
}



function playSound(audio) {
    if (!audioCtx) return;

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    audio.currentTime = 0;

    audio.play().catch(() => {
        // iOS sometimes needs a resume inside a gesture
        audioCtx.resume().then(() => audio.play());
    });
}


start = () => {
    if (!audioUnlocked) { 
        unlockAudio(); 
        unlockAllSounds(); 
    }
    if(current_round == 1 && time == work_time) {
        is_countdown = true;
        playSound(countdown_audio);

        setTimeout(() => {
            is_countdown = false;
            is_running = true;
            intervalID = setInterval(run_timer, 1000);
        }, 2000);
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
    reset();
    render_UI();
});









