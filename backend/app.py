from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from email.mime.text import MIMEText
from flask_socketio import SocketIO, emit
import sqlite3
import random
import smtplib
import os
app = Flask(__name__)

# ✅ FIXED CORS (ONLY THIS — remove previou 
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(
    app,
    cors_allowed_origins="*"
)
@app.route('/version')
def version():
    return jsonify({
        "version": "OTP_DEBUG_26_JUNE"
    })
@app.route('/test')
def test():
    print("TEST ROUTE HIT")
    return jsonify({"status":"ok"})

@app.route("/smtp-test")
def smtp_test():

    sender = os.environ.get("EMAIL_USER")
    password = os.environ.get("EMAIL_PASS")

    return jsonify({
        "sender": sender,
        "password_exists": bool(password)
    })

def send_email_otp(email, otp):

    sender = os.environ.get("EMAIL_USER")
    password = os.environ.get("EMAIL_PASS")

    print("========== EMAIL DEBUG ==========")
    print("EMAIL =", email)
    print("SENDER =", sender)
    print("PASSWORD EXISTS =", bool(password))

    try:

        msg = MIMEText(f"""
        <html>
        <body style="font-family: Arial; background:#f4f6f8; padding:20px;">

        <div style="max-width:500px; margin:auto; background:white; padding:20px; border-radius:10px;">

        <h2 style="color:#2563eb;">Kinship 💙</h2>

        <p>Hello 👋,</p>

        <p>Welcome to <b>Kinship</b> — where connection meets care.</p>

        <p>Your One-Time Password (OTP) is:</p>

        <h1 style="letter-spacing:5px; color:#111;">{otp}</h1>

        <p>This OTP is valid for 5 minutes.</p>

        <hr>

        <p style="font-size:12px; color:gray;">
        If you didn't request this, please ignore this email.
        </p>

        <p style="font-size:12px; color:gray;">
        — Team Kinship ❤️
        </p>

        </div>

        </body>
        </html>
        """, "html")

        msg["Subject"] = "🔐 Your Kinship Login Code"
        msg["From"] = sender
        msg["To"] = email

        print("CONNECTING TO GMAIL")

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:

            print("LOGGING IN")

            server.login(sender, password)

            print("SENDING EMAIL")

            server.send_message(msg)

        print("EMAIL SENT TO:", email)

    except Exception as e:

        print("EMAIL ERROR ❌:", str(e))

@app.route('/send-email-otp', methods=['POST'])
def send_email_otp_route():

    try:

        print("STEP 1")

        data = request.get_json()

        print("STEP 2")

        email = data.get('email')

        print("EMAIL =", email)

        otp = str(random.randint(1000, 9999))

        print("OTP =", otp)

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO otp_codes (email, otp) VALUES (?, ?)",
            (email, otp)
        )

        conn.commit()
        conn.close()

        print("OTP SAVED")

        send_email_otp(email, otp)

        print("EMAIL FUNCTION CALLED")

        return jsonify({
            "message": "OTP sent"
        })

    except Exception as e:

        print("OTP ROUTE ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
        
@app.route('/verify-email-otp', methods=['POST'])
def verify_email_otp():

    try:

        data = request.get_json()

        email = data.get('email')
        otp = data.get('otp')
        device_id = data.get('device_id')

        conn = get_db_connection() 
        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM otp_codes
            WHERE email=?
            AND otp=?
            AND datetime(created_at) >= datetime('now', '-5 minutes')
            ORDER BY id DESC
            LIMIT 1
        """, (email, otp))

        record = cursor.fetchone()

        if not record:
            conn.close()

            return jsonify({
                "error": "Invalid or expired OTP"
            })

        cursor.execute(
            "UPDATE users SET device_id=? WHERE email=?",
            (device_id, email)
        )

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Verified"
        })

    except Exception as e:

        print("VERIFY OTP ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500
# ---------------- DATABASE ----------------
@app.route('/db-test')
def db_test():

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) FROM otp_codes"
        )

        count = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            "status": "ok",
            "count": count
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

def get_db_connection():
    conn = sqlite3.connect('database/kinship.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    device_id = data.get('device_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cursor.fetchone()

    if user:
        user_id = user["id"]
        role = user["role"]

        # CHECK DEVICE MATCH
        if user["device_id"] == device_id:
            verified = True
        else:
            verified = False

    else:
        # NEW USER (FIXED)
        cursor.execute(
            "INSERT INTO users (email, role, device_id) VALUES (?, ?, NULL)",
            (email, None)
        )
        conn.commit()

        user_id = cursor.lastrowid
        role = None
        verified = False

    conn.close()

    return jsonify({
        "user_id": user_id,
        "role": role,
        "verified": verified
    })
# ---------------- HOME ----------------
@app.route('/')
def home():
    return "Kinship backend running"

# ---------------- CHECK-IN ----------------
@app.route('/checkin', methods=['POST'])
def checkin():

    try:

        data = request.get_json()

        user_id = data.get('user_id')
        status = data.get('status')

        if not user_id or not status:
            return jsonify({
                "error": "Missing data"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO checkins
            (user_id, status, created_at)
            VALUES (?, ?, ?)
            """,
            (
                user_id,
                status,
                datetime.now()
            )
        )

        conn.commit()
        conn.close()

        # ================= SOCKET EVENT =================
        socketio.emit(
            "checkin_update",
            {
                "status": status,
                "time": str(datetime.now())
            }
        )

        print("📡 CHECKIN EMITTED")

        return jsonify({
            "message": "Check-in saved"
        }), 201

    except Exception as e:

        print("CHECKIN ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
# ---------------- GENERATE CODE ----------------
@app.route('/generate-code', methods=['POST'])
def generate_code():
    try:
        data = request.get_json()
        student_id = data.get('student_id')

        code = "KIN" + str(random.randint(1000, 9999))

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM pair_codes WHERE student_id=?", (student_id,))
        cursor.execute(
            "INSERT INTO pair_codes (code, student_id) VALUES (?, ?)",
            (code, student_id)
        )

        conn.commit()
        conn.close()

        return jsonify({"code": code})

    except Exception as e:
        print("PAIR ERROR:", e)
        return jsonify({"error": "Server error"}), 500

# ---------------- CONNECT ----------------
@app.route('/connect-by-code', methods=['POST'])
def connect_by_code():
    try:
        data = request.get_json()
        parent_id = data.get('parent_id')
        code = data.get('code')

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT student_id FROM pair_codes WHERE code=?",
            (code,)
        )

        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({"message": "Invalid code"}), 400

        student_id = row["student_id"]

        if str(student_id) == str(parent_id):
            conn.close()
            return jsonify({"message": "Cannot connect to yourself"}), 400

        cursor.execute("DELETE FROM connections WHERE parent_id=?", (parent_id,))
        cursor.execute(
            "INSERT INTO connections (parent_id, student_id) VALUES (?, ?)",
            (parent_id, student_id)
        )

        conn.commit()
        conn.close()

        return jsonify({"message": "Connected successfully"})

    except Exception as e:
        print("CONNECT ERROR:", e)
        return jsonify({"error": "Server error"}), 500

# ---------------- CHECK CONNECTION ----------------
@app.route('/check-connection/<int:user_id>', methods=['GET'])
def check_connection(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM connections
        WHERE parent_id=? OR student_id=?
        ORDER BY id DESC LIMIT 1
    """, (user_id, user_id))

    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            "connected": True,
            "parent_id": row["parent_id"],
            "student_id": row["student_id"]
        })
    else:
        return jsonify({"connected": False})

# ---------------- LATEST CHECK-IN ----------------
@app.route('/latest-checkin/<int:parent_id>', methods=['GET'])
def latest_checkin(parent_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT student_id FROM connections
        WHERE parent_id=?
        ORDER BY id DESC LIMIT 1
    """, (parent_id,))

    row = cursor.fetchone()

    if not row:
        return jsonify({"message": "No connected student"})

    student_id = row["student_id"]

    cursor.execute("""
        SELECT status, created_at
        FROM checkins
        WHERE user_id=?
        ORDER BY created_at DESC LIMIT 1
    """, (student_id,))

    checkin = cursor.fetchone()
    conn.close()

    if not checkin:
        return jsonify({"message": "No check-in yet"})

    return jsonify({
        "status": checkin["status"],
        "time": checkin["created_at"]
    })

# ---------------- CHAT ----------------
@app.route('/send-message', methods=['POST'])
def send_message():

    data = request.get_json()

    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name')
    message = data.get('message')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO messages
        (sender_id, sender, message, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (
            sender_id,
            sender_name,
            message,
            datetime.now()
        )
    )

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Message sent"
    })

@app.route('/messages', methods=['GET'])
def get_messages():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT *
        FROM (
            SELECT sender_id,
                   sender,
                   message,
                   created_at
            FROM messages
            ORDER BY created_at DESC
            LIMIT 100
        )
        ORDER BY created_at ASC
    """)

    rows = cursor.fetchall()

    conn.close()

    return jsonify([
        {
            "sender_id": r["sender_id"],
            "sender": r["sender"],
            "message": r["message"],
            "time": r["created_at"]
        }
        for r in rows
    ])

# ---------------- SOS ----------------
@app.route('/sos', methods=['POST'])
def sos():

    try:

        data = request.get_json()

        triggered_by = data.get("triggered_by")

        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO sos_events
            (triggered_by, triggered_at)
            VALUES (?, ?)
            """,
            (
                triggered_by,
                current_time
            )
        )

        cursor.execute("""
            DELETE FROM sos_events
            WHERE id NOT IN (
                SELECT id
                FROM sos_events
                ORDER BY id DESC
                LIMIT 5
            )
        """)

        conn.commit()

        socketio.emit(
            "sos_alert",
            {
                "triggered_by": triggered_by,
                "time": current_time
            }
        )

        conn.close()

        print("🚨 SOS SAVED:", triggered_by)
        print("🕒 SOS TIME:", current_time)
        print("📡 SOS EMITTED")

        return jsonify({
            "status": "SOS sent"
        })

    except Exception as e:

        print("SOS ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500
@app.route('/latest-sos', methods=['GET'])
def latest_sos():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT triggered_by, triggered_at
        FROM sos_events
        ORDER BY triggered_at DESC
        LIMIT 1
    """)

    row = cursor.fetchone()

    conn.close()

    if not row:

        return jsonify({
            "message": "No SOS"
        }), 404

    return jsonify({
        "triggered_by": row["triggered_by"],
        "time": row["triggered_at"]
    })

@app.route('/sos-history', methods=['GET'])
def sos_history():

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id,
               triggered_by,
               triggered_at
        FROM sos_events
        ORDER BY triggered_at DESC
        LIMIT 5
    """)

    rows = cursor.fetchall()

    conn.close()

    return jsonify([
        {
            "id": row["id"],
            "triggered_by": row["triggered_by"],
            "time": row["triggered_at"]
        }
        for row in rows
    ])

def init_db():

    os.makedirs("database", exist_ok=True)

    conn = sqlite3.connect("database/kinship.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sender_id INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sos_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        triggered_by TEXT,
        triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS puzzles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER,
        student_id INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pair_codes (
        code TEXT,
        student_id INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        phone TEXT,
        photo TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        role TEXT,
        device_id TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        otp TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

    print("✅ DATABASE INITIALIZED")


# ---------------- RELATIONSHIP ----------------
@app.route('/relationship-score', methods=['GET'])
def relationship_score():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM messages")
    total = cursor.fetchone()["total"]

    if total == 0:
        score = 10
    elif total < 5:
        score = 30
    elif total < 15:
        score = 60
    elif total < 30:
        score = 80
    else:
        score = 95

    conn.close()
    return jsonify({"score": score})

# ---------------- REGISTER ROLE ----------------
@app.route('/register_user', methods=['POST'])
def register_user():
    data = request.get_json()

    user_id = data.get('user_id')
    role = data.get('role')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE users SET role=? WHERE id=?",
        (role, user_id)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Role updated"})

# ---------------- PUZZLE ----------------
@app.route('/send-puzzle', methods=['POST'])
def send_puzzle():

    data = request.get_json()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO puzzles
        (sender, image, created_at)
        VALUES (?, ?, ?)
        """,
        (
            data.get('sender'),
            data.get('image'),
            datetime.now()
        )
    )

    cursor.execute("""
        DELETE FROM puzzles
        WHERE id NOT IN (
            SELECT id
            FROM puzzles
            ORDER BY id DESC
            LIMIT 5
        )
    """)

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Puzzle sent"
    })
@app.route('/puzzles', methods=['GET'])
def get_puzzles():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sender, image, created_at
        FROM puzzles
        ORDER BY created_at DESC
        LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"message": "No puzzles"}), 404

    return jsonify({
        "sender": row["sender"],
        "image": row["image"],
        "time": row["created_at"]
    })
    

# ---------------- PROFILE ----------------
@app.route('/save-profile', methods=['POST'])
def save_profile():
    data = request.get_json()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM profiles WHERE user_id=?", (data.get('user_id'),))

    cursor.execute(
        "INSERT INTO profiles (user_id, name, phone, photo) VALUES (?, ?, ?, ?)",
        (data.get('user_id'), data.get('name'), data.get('phone'), data.get('photo'))
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Profile saved"})

@app.route('/get-profile/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM profiles WHERE user_id=?", (user_id,))
    row = cursor.fetchone()

    conn.close()

    if not row:
        return jsonify({"message": "No profile"})

    return jsonify({
        "name": row["name"],
        "photo": row["photo"]
    })

@socketio.on("connect")
def handle_connect():
    print("🟢 CLIENT CONNECTED")


@socketio.on("disconnect")
def handle_disconnect():
    print("🔴 CLIENT DISCONNECTED")

# ---------------- RUN ----------------
if __name__ == '__main__':

    init_db()

    port = int(os.environ.get("PORT", 5000))

    socketio.run(
        app,
        host="0.0.0.0",
        port=port
    )