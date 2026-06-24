function formatTimeSmart(time) {

    const date = new Date(
        time.replace(" ", "T")
    );

    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isToday) return timeStr;
    if (isYesterday) return "Yesterday " + timeStr;

    return date.toLocaleDateString() + " " + timeStr;
}

function showNotification(message, type = "info") {

    const box = document.getElementById("notification");
    const sound = document.getElementById("notifSound"); // 🔊 ADD

    if (!box) return;

    box.innerText = message;
    box.style.display = "block";

    if (type === "success") box.style.background = "#22C55E";
    else if (type === "error") box.style.background = "#EF4444";
    else box.style.background = "#2563EB";

    box.style.opacity = "1";
    box.style.transform = "translateY(0)";

    // 🔊 PLAY SOUND
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }

    setTimeout(() => {
        box.style.opacity = "0";
        box.style.transform = "translateY(-10px)";
    }, 2500);

    setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}
