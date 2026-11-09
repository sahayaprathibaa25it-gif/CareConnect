from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from datetime import datetime, date
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "careconnect_secret_key"

DATABASE = "careconnect.db"


# ---------------- DATABASE ----------------

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():

    conn = get_db()

    conn.executescript("""

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        emergency_contact TEXT
    );

    CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        status TEXT,
        note TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        time TEXT,
        dosage TEXT,
        taken INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        bp TEXT,
        temperature TEXT,
        sugar TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        doctor TEXT,
        appointment_date TEXT,
        hospital TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        phone TEXT,
        relation TEXT
    );

    """)

    # Demo account
    demo = conn.execute(
        "SELECT id FROM users WHERE email=?",
        ("elder@careconnect.com",)
    ).fetchone()

    if not demo:

        cur = conn.execute("""
            INSERT INTO users
            (name,email,password,role,emergency_contact)
            VALUES (?,?,?,?,?)
        """, (
            "Ravi's Grandmother",
            "elder@careconnect.com",
            generate_password_hash("123456"),
            "elderly",
            "9876543210"
        ))

        user_id = cur.lastrowid

        conn.execute("""
            INSERT INTO medications
            (user_id,name,time,dosage)
            VALUES (?,?,?,?)
        """, (
            user_id,
            "Morning Medicine",
            "08:30",
            "1 tablet"
        ))

        conn.execute("""
            INSERT INTO medications
            (user_id,name,time,dosage)
            VALUES (?,?,?,?)
        """, (
            user_id,
            "Evening Medicine",
            "20:00",
            "1 tablet"
        ))

        conn.execute("""
            INSERT INTO contacts
            (user_id,name,phone,relation)
            VALUES (?,?,?,?)
        """, (
            user_id,
            "Ravi",
            "9876543210",
            "Son"
        ))

        conn.commit()

    conn.close()


# ---------------- LOGIN CHECK ----------------

def login_required(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        if "user_id" not in session:
            return redirect(url_for("login"))

        return function(*args, **kwargs)

    return wrapper


# ---------------- HOME ----------------

@app.route("/")
def index():

    if "user_id" in session:
        return redirect(url_for("dashboard"))

    return render_template("index.html")


# ---------------- REGISTER ----------------

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form["name"]
        email = request.form["email"]
        password = request.form["password"]
        role = request.form["role"]
        emergency = request.form.get("emergency_contact", "")

        conn = get_db()

        try:

            conn.execute("""
                INSERT INTO users
                (name,email,password,role,emergency_contact)
                VALUES (?,?,?,?,?)
            """, (
                name,
                email,
                generate_password_hash(password),
                role,
                emergency
            ))

            conn.commit()

        except sqlite3.IntegrityError:

            flash("Email already registered.")

            conn.close()

            return redirect(url_for("register"))

        conn.close()

        flash("Registration successful!")

        return redirect(url_for("login"))

    return render_template("register.html")


# ---------------- LOGIN ----------------

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        conn = get_db()

        user = conn.execute(
            "SELECT * FROM users WHERE email=?",
            (email,)
        ).fetchone()

        conn.close()

        if user and check_password_hash(
            user["password"],
            password
        ):

            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["role"] = user["role"]

            return redirect(url_for("dashboard"))

        flash("Invalid email or password.")

    return render_template("login.html")


# ---------------- LOGOUT ----------------

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("index"))


# ---------------- DASHBOARD ----------------

@app.route("/dashboard")
@login_required
def dashboard():

    user_id = session["user_id"]

    conn = get_db()

    checkins = conn.execute("""
        SELECT * FROM checkins
        WHERE user_id=?
        ORDER BY id DESC
        LIMIT 5
    """, (user_id,)).fetchall()

    medications = conn.execute("""
        SELECT * FROM medications
        WHERE user_id=?
        ORDER BY time
    """, (user_id,)).fetchall()

    readings = conn.execute("""
        SELECT * FROM readings
        WHERE user_id=?
        ORDER BY id DESC
        LIMIT 5
    """, (user_id,)).fetchall()

    appointments = conn.execute("""
        SELECT * FROM appointments
        WHERE user_id=?
        ORDER BY appointment_date
    """, (user_id,)).fetchall()

    contacts = conn.execute("""
        SELECT * FROM contacts
        WHERE user_id=?
    """, (user_id,)).fetchall()

    latest_checkin = conn.execute("""
        SELECT * FROM checkins
        WHERE user_id=?
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,)).fetchone()

    conn.close()

    today = date.today().isoformat()

    today_checkin = None

    if latest_checkin:

        if latest_checkin["created_at"].startswith(today):
            today_checkin = latest_checkin

    routine_alert = today_checkin is None

    return render_template(
        "dashboard.html",
        checkins=checkins,
        medications=medications,
        readings=readings,
        appointments=appointments,
        contacts=contacts,
        today_checkin=today_checkin,
        routine_alert=routine_alert,
        now=datetime.now().strftime(
            "%d %b %Y, %I:%M %p"
        )
    )


# ---------------- CHECK-IN ----------------

@app.route("/checkin", methods=["POST"])
@login_required
def checkin():

    status = request.form.get(
        "status",
        "I'm fine"
    )

    note = request.form.get(
        "note",
        ""
    )

    conn = get_db()

    conn.execute("""
        INSERT INTO checkins
        (user_id,status,note,created_at)
        VALUES (?,?,?,?)
    """, (
        session["user_id"],
        status,
        note,
        datetime.now().isoformat(
            timespec="minutes"
        )
    ))

    conn.commit()
    conn.close()

    flash("Daily check-in recorded successfully.")

    return redirect(url_for("dashboard"))


# ---------------- ADD MEDICINE ----------------

@app.route("/medication/add", methods=["POST"])
@login_required
def add_medication():

    name = request.form["name"]
    time = request.form["time"]
    dosage = request.form.get("dosage", "")

    conn = get_db()

    conn.execute("""
        INSERT INTO medications
        (user_id,name,time,dosage)
        VALUES (?,?,?,?)
    """, (
        session["user_id"],
        name,
        time,
        dosage
    ))

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# ---------------- TOGGLE MEDICINE ----------------

@app.route("/medication/<int:med_id>/toggle", methods=["POST"])
@login_required
def toggle_medication(med_id):

    conn = get_db()

    medication = conn.execute("""
        SELECT * FROM medications
        WHERE id=? AND user_id=?
    """, (
        med_id,
        session["user_id"]
    )).fetchone()

    if medication:

        new_value = 0 if medication["taken"] else 1

        conn.execute("""
            UPDATE medications
            SET taken=?
            WHERE id=?
        """, (
            new_value,
            med_id
        ))

        conn.commit()

    conn.close()

    return redirect(url_for("dashboard"))


# ---------------- HEALTH READING ----------------

@app.route("/reading/add", methods=["POST"])
@login_required
def add_reading():

    bp = request.form.get("bp", "")
    temperature = request.form.get("temperature", "")
    sugar = request.form.get("sugar", "")

    conn = get_db()

    conn.execute("""
        INSERT INTO readings
        (user_id,bp,temperature,sugar,created_at)
        VALUES (?,?,?,?,?)
    """, (
        session["user_id"],
        bp,
        temperature,
        sugar,
        datetime.now().isoformat(
            timespec="minutes"
        )
    ))

    conn.commit()
    conn.close()

    flash("Health reading saved.")

    return redirect(url_for("dashboard"))


# ---------------- APPOINTMENT ----------------

@app.route("/appointment/add", methods=["POST"])
@login_required
def add_appointment():

    doctor = request.form["doctor"]
    appointment_date = request.form["appointment_date"]
    hospital = request.form.get("hospital", "")

    conn = get_db()

    conn.execute("""
        INSERT INTO appointments
        (user_id,doctor,appointment_date,hospital)
        VALUES (?,?,?,?)
    """, (
        session["user_id"],
        doctor,
        appointment_date,
        hospital
    ))

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# ---------------- CONTACT ----------------

@app.route("/contact/add", methods=["POST"])
@login_required
def add_contact():

    name = request.form["name"]
    phone = request.form["phone"]
    relation = request.form.get("relation", "")

    conn = get_db()

    conn.execute("""
        INSERT INTO contacts
        (user_id,name,phone,relation)
        VALUES (?,?,?,?)
    """, (
        session["user_id"],
        name,
        phone,
        relation
    ))

    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# ---------------- STATUS API ----------------

@app.route("/api/status")
@login_required
def status_api():

    conn = get_db()

    checkin = conn.execute("""
        SELECT * FROM checkins
        WHERE user_id=?
        ORDER BY id DESC
        LIMIT 1
    """, (
        session["user_id"],
    )).fetchone()

    conn.close()

    today = date.today().isoformat()

    if checkin and checkin["created_at"].startswith(today):

        return jsonify({
            "status": "checked_in",
            "message": "Today's check-in has been received.",
            "time": checkin["created_at"]
        })

    return jsonify({
        "status": "attention",
        "message": "We haven't received today's check-in. Please confirm that everything is okay."
    })


# ---------------- START SERVER ----------------

if __name__ == "__main__":

    

    app.run(
        debug=True
    )