let startTime = 0;
let timerInterval;

// ✅ GET USERNAME FROM PROFILE
function getUsername() {
    const role = sessionStorage.getItem("role");
    return localStorage.getItem(role + "_name") || "User";
}

// SEND PUZZLE
function sendPuzzle() {

    const fileInput = document.getElementById("imageInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Select an image");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {

        fetch("https://kinship-backend-oftd.onrender.com/send-puzzle", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                sender: getUsername(),
                image: e.target.result
            })
        })
        .then(() => {
            showNotification("Puzzle Sent🧩", "success");
        });
    };

    reader.readAsDataURL(file);
}

// LOAD PUZZLE
function loadPuzzle() {

    fetch("https://kinship-backend-oftd.onrender.com/puzzles")
    .then(res => res.json())
    .then(data => {

        if (!data.image) {
            alert("No puzzle available");
            return;
        }

        const img = new Image();

        img.onload = () => createPuzzle(img);

        img.src = data.image;
    })
    .catch(() => alert("No puzzle found"));
}

// CREATE PUZZLE
function createPuzzle(img) {

    const board = document.getElementById("puzzleBoard");
    board.innerHTML = "";

    const size = 3;
    const baseSize = 300;

    const aspectRatio = img.width / img.height;

    let boardWidth = baseSize;
    let boardHeight = baseSize / aspectRatio;

    // SET BOARD
    board.style.width = boardWidth + "px";
    board.style.height = boardHeight + "px";
    board.style.display = "grid";
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.gap = "0px";

    const pieceWidth = boardWidth / size;
    const pieceHeight = boardHeight / size;

    const pieces = [];
    let dragged = null;

    for (let i = 0; i < size * size; i++) {

        const piece = document.createElement("div");

        piece.style.width = pieceWidth + "px";
        piece.style.height = pieceHeight + "px";

        piece.style.backgroundImage = `url(${img.src})`;
        piece.style.backgroundSize = `${boardWidth}px ${boardHeight}px`;

        const x = (i % size) * pieceWidth;
        const y = Math.floor(i / size) * pieceHeight;

        piece.style.backgroundPosition = `-${x}px -${y}px`;

        piece.style.border = "1px solid #000";

        // TRACK STATE
        piece.dataset.correct = i;
        piece.dataset.current = i;

        piece.setAttribute("draggable", true);

        piece.addEventListener("dragstart", () => {
            dragged = piece;
        });

        piece.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        piece.addEventListener("drop", () => {

            if (!dragged || dragged === piece) return;

            // swap visuals
            const tempBg = dragged.style.backgroundPosition;
            dragged.style.backgroundPosition = piece.style.backgroundPosition;
            piece.style.backgroundPosition = tempBg;

            // swap logic
            const tempCurrent = dragged.dataset.current;
            dragged.dataset.current = piece.dataset.current;
            piece.dataset.current = tempCurrent;
        });

        pieces.push(piece);
    }

    // SHUFFLE
    pieces.sort(() => Math.random() - 0.5);

    pieces.forEach(p => board.appendChild(p));

    document.getElementById("finishBtn").style.display = "block";
    document.getElementById("sendResultBtn").style.display = "none";
    document.getElementById("result").innerText = "";

    startTimer();
}

// TIMER
function startTimer() {
    startTime = Date.now();

    timerInterval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById("timer").innerText = "⏱️ Time: " + seconds + "s";
    }, 1000);
}

// ✅ FIXED FINISH (NO STRING CHECK)
function finishPuzzle() {

    clearInterval(timerInterval);

    const pieces = document.querySelectorAll("#puzzleBoard div");

    let correct = true;

    pieces.forEach((piece, index) => {
        if (parseInt(piece.dataset.current) !== index) {
            correct = false;
        }
    });

    if (!correct) {
        document.getElementById("result").innerText = "❌ Not solved correctly";
        return;
    }

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    document.getElementById("result").innerText =
        "✅ Completed in " + timeTaken + " seconds";

    // 🔊 PLAY SOUND
    const sound = document.getElementById("successSound");
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    document.getElementById("sendResultBtn").style.display = "block";

    window.puzzleTime = timeTaken;
}

// SEND RESULT
// SEND RESULT
function sendResult() {

    const username = getUsername();
    const userId = localStorage.getItem("user_id");

    fetch("https://kinship-backend-oftd.onrender.com/send-message", {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
            sender_id: userId,
            sender_name: username,
            message:  `Completed in ${window.puzzleTime}s at ${formatTimeSmart(new Date())}`
        })
    })
    .then(() => {

        // ✅ SHOW NOTIFICATION HERE
        showNotification("Result sent to chat 🧩", "success");

        // ⏳ small delay so user can SEE it
        setTimeout(() => {

            const role = sessionStorage.getItem("role");

            if (role === "parent") {
                window.location.href = "parent-chat.html";
            } else {
                window.location.href = "student-chat.html";
            }

        }, 1000); // 1 second delay
    });
}