// ===================== ROLE PROTECTION =====================
const role = sessionStorage.getItem("role");

// ===================== GENERATE CODE =====================
async function generatePairCode() {

    const userId = localStorage.getItem("user_id");

    if (!userId) {
        alert("User not registered");
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:5000/generate-code", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ student_id: userId })
        });

        const data = await res.json();

        document.getElementById("pairCodeDisplay").innerText = data.code;
        document.getElementById("generateBtn").disabled = true;

    } catch {
        alert("Server error");
    }
}

// ===================== CHECK-IN =====================
function sendCheckin(status) {

    const userId = localStorage.getItem("user_id");

    fetch("http://127.0.0.1:5000/checkin", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            user_id: userId,
            status: status
        })
    })
    .then(() => {
        if (typeof showNotification === "function") {
            showNotification("Check-in sent ✅", "success");
        }
    });
}

// ===================== SOS =====================
function sendSOS() {


    let sosSending = false;

function sendSOS() {

    if (sosSending) {
        console.log("SOS already sending");
        return;
    }

    sosSending = true;

    const userId = localStorage.getItem("user_id");

    fetch("http://127.0.0.1:5000/sos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            triggered_by: "Student " + userId
        })
    })
    .finally(() => {
        setTimeout(() => {
            sosSending = false;
        }, 3000);
    });
}
    const userId = localStorage.getItem("user_id");

    fetch("http://127.0.0.1:5000/sos", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            triggered_by: "Student " + userId
        })
    })
    .then(() => {
        if (typeof showNotification === "function") {
            showNotification("SOS sent 🚨", "error");
        }
    });
}

// ===================== NAVIGATION =====================
function openChat() {
    window.location.href = "student-chat.html";
}

function openPuzzle() {
    window.location.href = "puzzle.html";
}

function openProfile() {
    window.location.href = "profile.html";
}

// ===================== CONNECTION CHECK =====================
function checkConnection() {

    const userId = localStorage.getItem("user_id");

    if (!userId) return;

    fetch(`http://127.0.0.1:5000/check-connection/${userId}`)
    .then(res => res.json())
    .then(data => {

        if (data.connected) {

            localStorage.setItem("paired", "true");

            const btn = document.getElementById("generateBtn");
            if (btn) btn.style.display = "none";
        }
    });
}

// ===================== PROFILE HEADER =====================
function loadProfileHeader() {

    const role = sessionStorage.getItem("role");

    const name = localStorage.getItem(role + "_name") || "User";

    const nameEl = document.getElementById("userName");
    const roleEl = document.getElementById("userRole");
    const iconEl = document.getElementById("profileIcon");

    if (nameEl) nameEl.innerText = name;
    if (roleEl) roleEl.innerText = role;

    const photo = localStorage.getItem(role + "_photo");

    if (photo && iconEl) {
        iconEl.src = photo;
    }
}

// ===================== LOGOUT =====================
function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}

async function setupNotifications() {

    try {

        const token = await getFirebaseToken();

        console.log("STUDENT TOKEN:", token);

        if (!token) return;

        const userId = localStorage.getItem("user_id");

        if (!userId) return;

        await fetch("http://127.0.0.1:5000/save-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: userId,
                token: token
            })
        });

        console.log("✅ STUDENT TOKEN SAVED");

    } catch (err) {

        console.log("Student notification error:", err);
    }
}

// ===================== GLOBAL FIX =====================
window.generatePairCode = generatePairCode;
window.sendCheckin = sendCheckin;
window.sendSOS = sendSOS;
window.openChat = openChat;
window.openPuzzle = openPuzzle;
window.openProfile = openProfile;
window.logout = logout;

// ===================== LOAD =====================
window.onload = async () => {
    loadProfileHeader();
    checkConnection();

    await setupNotifications();
};