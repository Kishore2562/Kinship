
// ---------------- DEVICE ----------------
function getDeviceId() {
    let deviceId = localStorage.getItem("device_id");

    if (!deviceId) {
        deviceId = "dev-" + Math.random().toString(36).substring(2);
        localStorage.setItem("device_id", deviceId);
    }

    return deviceId;
}

// ---------------- LOGIN ----------------
function login() {

    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Enter email");
        return;
    }

    const deviceId = getDeviceId();

    fetch("https://kinship-backend-oftd.onrender.com/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, device_id: deviceId })
    })
    .then(res => res.json())
    .then(data => {

        if (data.verified) {
            completeLogin(data);
        } else {
            document.getElementById("msg").textContent = "OTP required";
            document.getElementById("otpSection").style.display = "block";
            sendOTP();
        }
    })
    .catch(() => {
        alert("Server error");
    });
}

// ---------------- SEND OTP ----------------
function sendOTP() {

    const email = document.getElementById("email").value.trim();

    fetch("https://kinship-backend-oftd.onrender.com/send-email-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email
        })
    })
    .then(async res => {

        const text = await res.text();

        console.log("STATUS:", res.status);
        console.log("RESPONSE:", text);

        if (!res.ok) {
            throw new Error(text);
        }

        document.getElementById("msg").textContent =
            "OTP sent to email";
    })
    .catch(err => {

        console.error(err);

        alert("Failed to send OTP");
    });
}
// ---------------- VERIFY OTP ----------------
function verifyOTP() {

    const email = document.getElementById("email").value.trim();
    const otp = document.getElementById("otp").value.trim();
    const deviceId = getDeviceId();

    if (!otp) {
        alert("Enter OTP");
        return;
    }

    fetch("https://kinship-backend-oftd.onrender.com/verify-email-otp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, otp, device_id: deviceId })
    })
    .then(res => res.json())
    .then(data => {

        if (data.error) {
            alert("Invalid or expired OTP");
            return;
        }

        fetch("https://kinship-backend-oftd.onrender.com/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, device_id: deviceId })
        })
        .then(res => res.json())
        .then(data => {
            completeLogin(data);
        });
    })
    .catch(() => {
        alert("Verification failed");
    });
}

// ---------------- FINAL LOGIN ----------------
function completeLogin(data) {

    localStorage.setItem("user_id", data.user_id);
    sessionStorage.setItem("kinship_unlocked", "true");

    if (!data.role) {

        window.location.href = "pin.html";

    } else {

        sessionStorage.setItem("role", data.role);

        if (data.role === "parent") {

            window.location.href = "parent.html";

        } else {

            window.location.href = "student.html";

        }
    }
}
// ---------------- PWA SERVICE WORKER ----------------
if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("/service-worker.js")

            .then(reg => {
                console.log("PWA READY");
                console.log(reg.scope);
            })

            .catch(err => {
                console.log(err);
            });

    });

}

// ---------------- GLOBAL ACCESS ----------------
window.login = login;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;