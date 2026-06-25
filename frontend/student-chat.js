let lastMsgTime = null;

// ✅ GET USERNAME FROM PROFILE
function getUsername() {
    const role = sessionStorage.getItem("role");
    return localStorage.getItem(role + "_name") || "User";
}

function loadMessages() {

    fetch('https://kinship-backend-oftd.onrender.com/messages')
    .then(res => res.json())
    .then(data => {

        const chatBox = document.getElementById("chatBox");
        chatBox.innerHTML = "";

        const currentUserId = localStorage.getItem("user_id");

        data.forEach((msg) => {

            const msgDiv = document.createElement("div");

            msgDiv.classList.add("message");

            if (String(msg.sender_id) === String(currentUserId)) {

                msgDiv.classList.add("sent");

            } else {

                msgDiv.classList.add("received");
            }

            msgDiv.innerHTML = `
                ${msg.message}
                <br><small>${formatTimeSmart(msg.time)}</small>
            `;

            chatBox.appendChild(msgDiv);

        });

        chatBox.scrollTop = chatBox.scrollHeight;
    });
}


// SEND MESSAGE
function sendMessage() {

    const input = document.getElementById("messageInput");
    const text = input.value;

    if (!text.trim()) return;

    const username = sessionStorage.getItem("username");
    const userId = localStorage.getItem("user_id");

    fetch('https://kinship-backend-oftd.onrender.com/send-message', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
            sender_id: userId,
            sender_name: username,
            message: text
        })
    })
    .then(() => {

        input.value = "";

        showNotification(
            "Message sent",
            "success"
        );

        loadMessages();

    });
}

function loadBond() {
    fetch('https://kinship-backend-oftd.onrender.com/relationship-score')
    .then(res => res.json())
    .then(data => {
        const score = data.score;
        document.getElementById("bondFill").style.width = score + "%";
        document.getElementById("bondPercent").innerText = score + "%";
    });
}

// BACK BUTTON FIX
function goBack() {
    window.location.href = "student.html";
}

// AUTO REFRESH
setInterval(loadMessages, 2000);

// INITIAL LOAD
loadMessages();
loadBond();