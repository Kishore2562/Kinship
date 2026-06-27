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
        const res = await fetch("https://kinship-backend-oftd.onrender.com/generate-code", {
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

    fetch("https://kinship-backend-oftd.onrender.com/checkin", {
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
let sosSending = false;

function sendSOS() {

    if (sosSending) {
        return;
    }

    sosSending = true;

    const userId =
        localStorage.getItem("user_id");

    fetch(
        "https://kinship-backend-oftd.onrender.com/sos",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                triggered_by:
                    "Student " + userId
            })
        }
    )

    .then(() => {

        if (
            typeof showNotification ===
            "function"
        ) {

            showNotification(
                "SOS sent 🚨",
                "error"
            );
        }

    })

    .finally(() => {

        setTimeout(() => {

            sosSending = false;

        }, 3000);

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

    fetch(
        `https://kinship-backend-oftd.onrender.com/check-connection/${userId}`
    )
    .then(res => res.json())
    .then(data => {

        if (data.connected) {

            localStorage.setItem(
                "paired",
                "true"
            );

            const pairSection =
                document.getElementById(
                    "pairSection"
                );

            if (pairSection) {

                pairSection.style.display =
                    "none";
            }
        }
    })
    .catch(err => {

        console.log(
            "Connection check failed:",
            err
        );

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

// ===================== GLOBAL FIX =====================
window.generatePairCode = generatePairCode;
window.sendCheckin = sendCheckin;
window.sendSOS = sendSOS;
window.openChat = openChat;
window.openPuzzle = openPuzzle;
window.openProfile = openProfile;
window.logout = logout;

// ===================== LOAD =====================
// ===================== LOAD =====================
window.onload = () => {

    loadProfileHeader();

    checkConnection();

};