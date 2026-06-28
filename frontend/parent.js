const role =
    localStorage.getItem("role");

if (role !== "parent") {
    window.location.href = "pin.html";
}

const socket = io("https://kinship-backend-oftd.onrender.com");

socket.on("connect", () => {
    console.log("🟢 SOCKET CONNECTED");
});

socket.on("sos_alert", data => {

    showSOS(data);

    loadLastSOS();

});

socket.on("checkin_update", data => {

    console.log("📍 REALTIME CHECKIN");

    const statusEl =
        document.getElementById("status");

    const timeEl =
        document.getElementById("time");

    if(statusEl){
        statusEl.innerText =
            "Status: " + data.status;
    }

    if(timeEl){
        timeEl.innerText =
            "Time: " + formatTimeSmart(data.time);
    }

});

// ===================== VARIABLES =====================
let lastSOS = null;
let initialized = false;
let audioUnlocked = false;
// ===================== NAVIGATION =====================
function openChat() {
    window.location.href = "parent-chat.html";
}

function openPuzzle() {
    window.location.href = "puzzle.html";
}

function openProfile() {
    window.location.href = "profile.html";
}


// ===================== CONNECTION =====================
function checkConnection() {

    const userId = localStorage.getItem("user_id");

    if (!userId) return;

    fetch(`https://kinship-backend-oftd.onrender.com/check-connection/${userId}`)
    .then(res => res.json())
    .then(data => {

        if (data.connected) {

            localStorage.setItem("paired", "true");

            const pairBox = document.getElementById("pairSection");

            if (pairBox) {
                pairBox.style.display = "none";
            }
        }
    });
}


// ===================== CHECK-IN =====================
function loadCheckin() {

    const parentId = localStorage.getItem("user_id");

    if (!parentId) {

        const status = document.getElementById("status");

        if (status) {
            status.innerText = "User not logged in";
        }

        return;
    }

    fetch(`https://kinship-backend-oftd.onrender.com/latest-checkin/${parentId}`)

        .then(res => res.json())

        .then(data => {

            const statusEl = document.getElementById("status");
            const timeEl = document.getElementById("time");

            if (!statusEl || !timeEl) return;

            if (data.status) {

                statusEl.innerText = "Status: " + data.status;
                timeEl.innerText = "Time: " + formatTimeSmart(data.time);

            } else {

                statusEl.innerText = data.message || "No data";
                timeEl.innerText = "";
            }
        })

        .catch(() => {

            const status = document.getElementById("status");

            if (status) {
                status.innerText = "Server error";
            }
        });
}


// ===================== SHOW SOS =====================
function showSOS(data) {

    console.log("🚨 SOS RECEIVED:", data);

    const box = document.getElementById("sosBox");
    const text = document.getElementById("sosText");

    if (!box || !text) {
        console.log("❌ SOS elements not found");
        return;
    }

    // ✅ SHOW RED POPUP
    box.style.display = "flex";

    // ✅ UPDATE TEXT
    text.innerText =
        "🚨 EMERGENCY ALERT 🚨\n\n" +
        "From: " + data.triggered_by +
        "\nTime: " + formatTimeSmart(data.time);

    // ✅ PLAY SOUND
    const alarm = document.getElementById("alarmSound");

    if (alarm) {

        alarm.loop = true;

        alarm.play()

        .then(() => {
            console.log("🔊 Alarm playing");
        })

        .catch(err => {
            console.log("❌ Alarm failed:", err);
        });
    }
}

function loadLastSOS() {

    fetch("https://kinship-backend-oftd.onrender.com/latest-sos")

    .then(res => res.json())

    .then(data => {

        document.getElementById("lastSosUser").innerText =
            data.triggered_by;

        document.getElementById("lastSosTime").innerText =
            formatTimeSmart(data.time);

    })

    .catch(() => {

        document.getElementById("lastSosUser").innerText =
            "No SOS";

        document.getElementById("lastSosTime").innerText =
            "";

    });
}
function viewSOSHistory() {

    fetch("https://kinship-backend-oftd.onrender.com/sos-history")

    .then(res => res.json())

    .then(data => {

        let text = "🚨 SOS HISTORY\n\n";

        data.forEach(item => {

            text +=
                "👤 " + item.triggered_by +
                "\n🕒 " + item.time +
                "\n\n";
        });

        alert(text);

    })

    .catch(err => {

        console.log(err);

        alert("Failed to load SOS history");

    });
}
// ===================== STOP ALARM =====================
function stopAlarm() {

    const alarm = document.getElementById("alarmSound");

    if (alarm) {

        alarm.pause();
        alarm.currentTime = 0;
        alarm.loop = false;
    }

    const box = document.getElementById("sosBox");

    if (box) {
        box.style.display = "none";
    }
}


// ===================== RELATIONSHIP =====================
function loadBond() {

    fetch('https://kinship-backend-oftd.onrender.com/relationship-score')

        .then(res => res.json())

        .then(data => {

            const fill = document.getElementById("bondFill");
            const percent = document.getElementById("bondPercent");

            if (fill) {
                fill.style.width = data.score + "%";
            }

            if (percent) {
                percent.innerText = data.score + "%";
            }
        });
}


// ===================== CONNECT =====================
async function connectWithCode() {

    const code = document.getElementById("pairCodeInput").value;
    const parentId = localStorage.getItem("user_id");

    if (!code) {
        alert("Enter code");
        return;
    }

    const res = await fetch("https://kinship-backend-oftd.onrender.com/connect-by-code", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            parent_id: parentId,
            code: code
        })
    });

    const data = await res.json();

    document.getElementById("statusText").innerText = data.message;

    if (res.status === 200) {

        localStorage.setItem("paired", "true");

        alert("✅ Connected Successfully");

        const pairBox = document.getElementById("pairSection");

        if (pairBox) {
            pairBox.style.display = "none";
        }
    }
}


// ===================== PROFILE =====================
function loadProfileHeader() {

    const role = sessionStorage.getItem("role");

    const name = localStorage.getItem(role + "_name") || "User";

    const nameEl = document.getElementById("userName");
    const roleEl = document.getElementById("userRole");
    const iconEl = document.getElementById("profileIcon");

    if (nameEl) {
        nameEl.innerText = name;
    }

    if (roleEl) {
        roleEl.innerText = role;
    }

    const photo = localStorage.getItem(role + "_photo");

    if (photo && iconEl) {
        iconEl.src = photo;
    }
}


// ===================== LOGOUT =====================
function logout() {

    localStorage.removeItem("user_id");
    localStorage.removeItem("role");

    sessionStorage.clear();

    window.location.href = "index.html";
}


// ===================== GLOBAL FIX =====================
window.openChat = openChat;
window.openPuzzle = openPuzzle;
window.openProfile = openProfile;
window.connectWithCode = connectWithCode;
window.stopAlarm = stopAlarm;
window.logout = logout;
window.loadCheckin = loadCheckin;
window.showSOS = showSOS;
window.viewSOSHistory = viewSOSHistory;


// ===================== AUDIO UNLOCK =====================
document.body.addEventListener("click", () => {

    const alarm = document.getElementById("alarmSound");

    if (!alarm || audioUnlocked) return;

    alarm.volume = 0;

    alarm.play()

    .then(() => {

        alarm.pause();
        alarm.currentTime = 0;
        alarm.volume = 1;

        audioUnlocked = true;

        console.log("🔓 Audio unlocked successfully");
    })

    .catch(err => {
        console.log("Audio unlock failed:", err);
    });

}, { once: true });

// Make sure showSOS is globally available early
window.showSOS = showSOS;
window.onload = async () => {

    loadProfileHeader();
    checkConnection();
    loadCheckin();
    loadBond();
    loadLastSOS();
};