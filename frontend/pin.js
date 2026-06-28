// ===================== INITIAL SETUP =====================
const savedPin = localStorage.getItem("kinship_pin");
const infoText = document.getElementById("infoText");
const errorText = document.getElementById("error");
const savedRole = localStorage.getItem("role");

if(localStorage.getItem("user_id")){
    document.getElementById("switchBtn").style.display="block";
}

if (savedRole) {
    document.getElementById("role").style.display = "none";
}

if (localStorage.getItem("paired") === "true") {
    document.getElementById("role").disabled = true;
}

if (!savedPin) {
    infoText.innerText = "Set a new 4-digit PIN";
} else {
    infoText.innerText = "Enter your 4-digit PIN";
}


// ===================== REGISTER USER (BACKGROUND) =====================
function registerUser(role) {
    // 🔥 FIXED: use user_id instead of device_id
    const userId = localStorage.getItem("user_id");

    if (!userId) {
        console.log("No user_id found");
        return;
    }

    fetch("https://kinship-backend-oftd.onrender.com/register_user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: userId,
            role: role
        })
    })
    .then(res => res.json())
    .then(() => {
        console.log("Role updated");
    })
    .catch(() => {
        console.log("Backend not reachable yet");
    });
}


// ===================== MAIN FUNCTION =====================
function handlePin() {
    const enteredPin = document.getElementById("pinInput").value;

    const role =
        localStorage.getItem("role") ||
        document.getElementById("role").value;

    if (!/^\d{4}$/.test(enteredPin)) {
        errorText.innerText = "PIN must be exactly 4 digits";
        return;
    }

    if (!savedPin) {
        localStorage.setItem("kinship_pin", enteredPin);
    }

    if (!savedPin || enteredPin === savedPin) {

        const userId = localStorage.getItem("user_id");

        if (!userId) {
            errorText.innerText = "Login expired. Please login again.";
            window.location.href = "index.html";
            return;
        }

        sessionStorage.setItem("role", role);
        localStorage.setItem("role", role);
        sessionStorage.setItem("kinship_unlocked", "true");

        // 🔥 FIXED REGISTER CALL
        fetch("https://kinship-backend-oftd.onrender.com/register_user", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                user_id: userId,
                role: role
            })
        })
        .then(res => res.json())
        .then(() => {

            console.log("Role saved for user:", userId);

            const target = role === "parent"
                ? "parent.html"
                : "student.html";

            window.location.href = target;
        })
        .catch(() => {
            errorText.innerText = "Server not running";
        });

    } else {
        errorText.innerText = "Incorrect PIN";
    }
}


// ===================== RESET =====================
function resetApp() {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
}