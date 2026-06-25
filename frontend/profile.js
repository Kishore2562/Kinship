// ===================== ELEMENTS =====================
const profileImage = document.getElementById("profileImage");
const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");
const roleDisplay = document.getElementById("roleDisplay");
const photoInput = document.getElementById("photoInput");
const saveBtn = document.getElementById("saveProfileBtn");

// ===================== GET ROLE =====================
function getRole() {
  return sessionStorage.getItem("role");
}

// ===================== LOAD PROFILE =====================
window.onload = () => {

  const role = getRole();
  const userId = localStorage.getItem("user_id");

  if (roleDisplay) roleDisplay.value = role || "";

  if (userId) {
    fetch(`https://kinship-backend-oftd.onrender.com/get-profile/${userId}`)
    .then(res => res.json())
    .then(data => {

      if (data.name) {
        nameInput.value = data.name;
        phoneInput.value = data.phone || "";

        localStorage.setItem(role + "_name", data.name);
        localStorage.setItem(role + "_phone", data.phone || "");

        if (data.photo && profileImage) {
          profileImage.src = data.photo;
          localStorage.setItem(role + "_photo", data.photo);
        }

      } else {
        loadLocalProfile();
      }

    })
    .catch(() => loadLocalProfile());
  } else {
    loadLocalProfile();
  }
};

// ===================== LOCAL FALLBACK =====================
function loadLocalProfile() {
  const role = getRole();

  nameInput.value = localStorage.getItem(role + "_name") || "";
  phoneInput.value = localStorage.getItem(role + "_phone") || "";

  const savedPhoto = localStorage.getItem(role + "_photo");

  if (savedPhoto && profileImage) {
    profileImage.src = savedPhoto;
  }
}

// ===================== SAVE PROFILE =====================
if (saveBtn) {
  saveBtn.onclick = () => {

    const role = getRole();
    const userId = localStorage.getItem("user_id");

    const name = nameInput.value;
    const phone = phoneInput.value;

    localStorage.setItem(role + "_name", name);
    localStorage.setItem(role + "_phone", phone);

    const file = photoInput.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {

        const photoData = e.target.result;

        localStorage.setItem(role + "_photo", photoData);

        if (profileImage) profileImage.src = photoData;

        saveToServer(userId, name, phone, photoData);
      };

      reader.readAsDataURL(file);

    } else {

      const photoData = localStorage.getItem(role + "_photo") || null;

      saveToServer(userId, name, phone, photoData);
    }

    alert("Profile saved ✅");
  };
}

// ===================== SAVE TO SERVER =====================
function saveToServer(userId, name, phone, photo) {

  if (!userId) return;

  fetch("https://kinship-backend-oftd.onrender.com/save-profile", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      user_id: userId,
      name: name,
      phone: phone,
      photo: photo
    })
  });
}