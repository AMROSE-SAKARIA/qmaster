from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from jwt import decode, encode, ExpiredSignatureError
from bcrypt import hashpw, gensalt, checkpw
from dotenv import load_dotenv
from uuid import uuid4
import os
import pdfplumber
from datetime import datetime, timedelta
import logging
import smtplib
from email.mime.text import MIMEText
import random
import spacy
import time
from bson.objectid import ObjectId
from ai.question_generator import generate_mcqs, generate_descriptive_questions

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"], "supports_credentials": True}})

# MongoDB Connection
try:
    client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/qmaster'), 
                         maxPoolSize=10, serverSelectionTimeoutMS=5000)
    db = client['qmaster']
    logger.info("MongoDB Connected")
except ServerSelectionTimeoutError as e:
    logger.error(f"MongoDB connection error: {e}")
    exit(1)

# Collections
notes = db.notes
submissions = db.submissions
users = db.users
questions = db.questions
tests = db.tests

# OTP Store
otps = {}

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secure-secret-key')
JWT_EXPIRATION = timedelta(hours=24)

# Email Configuration
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASS = os.getenv('EMAIL_PASS')

# spaCy for similarity comparison
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.error("spaCy model 'en_core_web_sm' not found. Please install it using: python -m spacy download en_core_web_sm")
    exit(1)

def send_otp_email(to_email, otp):
    try:
        msg = MIMEText(f"Your OTP for QMaster registration is: {otp}\nIt expires in 10 minutes.")
        msg['Subject'] = 'QMaster Registration OTP'
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
        logger.info(f"OTP email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send OTP email: {e}")
        raise

def authenticate(token):
    try:
        payload = decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except ExpiredSignatureError:
        logger.error("JWT expired")
        return None
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        return None

# Custom JSON encoder to handle ObjectId
def mongo_to_json(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

@app.route('/api/setup-user', methods=['POST'])
def setup_user():
    data = request.get_json()
    username = data.get('username', 'teacher1')
    password = data.get('password', 'password123')
    role = data.get('role', 'teacher')
    email = data.get('email', '')
    if users.find_one({"username": {"$regex": f"^{username}$", "$options": "i"}}):
        return jsonify({"error": "Username taken"}), 400
    hashed = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')
    users.insert_one({
        "username": username,
        "password": hashed,
        "role": role,
        "email": email,
        "createdAt": datetime.now(),
        "conductedTests": [] if role == "teacher" else None,
        "attendedTests": [] if role == "student" else None
    })
    logger.info(f"User {username} created successfully with hashed password")
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'student')
    email = data.get('email')
    if not all([username, password, email]) or users.find_one({"username": {"$regex": f"^{username}$", "$options": "i"}}):
        return jsonify({"error": "Username taken or invalid data"}), 400
    otp = str(random.randint(100000, 999999))
    otps[username] = {"otp": otp, "expires": datetime.now() + timedelta(minutes=10), "email": email, "password": password, "role": role}
    try:
        send_otp_email(email, otp)
    except Exception as e:
        return jsonify({"error": f"Failed to send OTP email: {e}"}), 500
    return jsonify({"message": f"OTP sent to {email}"}), 200

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    username = data.get('username')
    otp = data.get('otp')
    stored = otps.get(username)
    if not stored or stored['otp'] != otp or stored['expires'] < datetime.now():
        return jsonify({"error": "Invalid or expired OTP"}), 400
    email = stored['email']
    password = stored['password']
    role = stored['role']
    hashed = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')
    users.insert_one({
        "username": username,
        "password": hashed,
        "role": role,
        "email": email,
        "createdAt": datetime.now(),
        "conductedTests": [] if role == "teacher" else None,
        "attendedTests": [] if role == "student" else None
    })
    del otps[username]
    logger.info(f"User {username} registered successfully")
    return jsonify({"message": "User registered"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    logger.info(f"Attempting login for username: {username}")
    user = users.find_one({"username": {"$regex": f"^{username}$", "$options": "i"}})
    if not user:
        logger.info(f"User {username} not found in the database")
        return jsonify({"error": "Invalid credentials"}), 401
    try:
        password_match = checkpw(password.encode('utf-8'), user['password'].encode('utf-8'))
    except Exception as e:
        logger.error(f"Error during password comparison: {e}")
        return jsonify({"error": "Password verification failed"}), 500
    if not password_match:
        logger.info("Password does not match")
        return jsonify({"error": "Invalid credentials"}), 401
    expiration_time = int(time.time() + JWT_EXPIRATION.total_seconds())
    payload = {
        "id": str(user['_id']),
        "role": user['role'],
        "username": username,
        "exp": expiration_time
    }
    token = encode(payload, JWT_SECRET, algorithm="HS256")
    logger.info(f"Generated token: {token}, Expiration: {datetime.fromtimestamp(expiration_time)}")
    return jsonify({"token": token, "role": user['role']}), 200

@app.route('/api/profile', methods=['GET'])
def get_profile():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload:
        return jsonify({"error": "Unauthorized"}), 403

    user = users.find_one({"_id": ObjectId(payload['id'])})
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = {
        "username": user['username'],
        "email": user.get('email', 'Not registered'),
        "role": user['role'],
        "conductedTests": user.get('conductedTests', []) if user['role'] == 'teacher' else [],
        "attendedTests": user.get('attendedTests', []) if user['role'] == 'student' else []
    }
    for item in profile.get('conductedTests', []) + profile.get('attendedTests', []):
        if '_id' in item:
            item['_id'] = str(item['_id'])
    return jsonify(profile), 200

@app.route('/api/upload-content', methods=['POST'])
def upload_content():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'teacher':
        return jsonify({"error": "Unauthorized"}), 403

    input_type = request.form.get('inputType')
    subject = request.form.get('subject', 'General')  # New: Default to 'General' if not provided
    if not input_type or input_type not in ['text', 'pdf']:
        return jsonify({"error": "Invalid input type. Must be 'text' or 'pdf'"}), 400

    text_content = ""
    pdf_content = ""

    if input_type == 'pdf':
        if 'pdf' not in request.files:
            return jsonify({"error": "No PDF file provided"}), 400
        pdf_file = request.files['pdf']
        logger.info(f"Processing PDF file: {pdf_file.filename}")
        try:
            with pdfplumber.open(pdf_file) as pdf:
                pdf_content = ''.join(page.extract_text() or '' for page in pdf.pages)
            logger.info(f"Extracted PDF content length: {len(pdf_content)} characters")
            if not pdf_content.strip():
                return jsonify({"error": "No readable text found in the PDF"}), 400
        except Exception as e:
            logger.error(f"Failed to extract PDF content: {e}")
            return jsonify({"error": f"Failed to process PDF: {e}"}), 400
    else:
        text_content = request.form.get('textContent', '')
        if not text_content:
            return jsonify({"error": "No text content provided"}), 400
        if len(text_content.split()) > 3000:
            return jsonify({"error": "Text exceeds 3000 words limit"}), 400

    try:
        num_mcqs = int(request.form.get('numMCQs', 5))
        num_descriptive = int(request.form.get('numDescriptive', 3))
        mcq_marks = float(request.form.get('mcqMarks', 2))
        descriptive_marks = float(request.form.get('descriptiveMarks', 10))
        logger.info(f"Parameters: num_mcqs={num_mcqs}, num_descriptive={num_descriptive}, mcq_marks={mcq_marks}, descriptive_marks={descriptive_marks}")
    except ValueError as e:
        logger.error(f"Invalid numeric parameters: {e}")
        return jsonify({"error": "Invalid numeric parameters"}), 400

    token_id = str(uuid4())
    mcqs = []
    descriptive = []
    start_time = time.time()

    try:
        content_to_process = pdf_content if input_type == 'pdf' else text_content
        if not content_to_process.strip():
            return jsonify({"error": "No valid content to process for question generation"}), 400

        logger.info(f"Generating {num_mcqs} MCQs from {input_type} content")
        mcqs = generate_mcqs(content_to_process, num_mcqs)
        logger.info(f"Successfully generated {len(mcqs)} MCQs from {input_type} content in {time.time() - start_time:.2f}s")

        logger.info(f"Generating {num_descriptive} descriptive questions from {input_type} content")
        descriptive = generate_descriptive_questions(content_to_process, num_descriptive)
        logger.info(f"Successfully generated {len(descriptive)} descriptive questions from {input_type} content in {time.time() - start_time:.2f}s")

        if len(mcqs) == 0:
            logger.warning(f"No MCQs were generated from the provided {input_type} content")
        if len(descriptive) == 0:
            logger.warning(f"No descriptive questions were generated from the provided {input_type} content")
        if not mcqs and not descriptive:
            return jsonify({"error": "Failed to generate any questions"}), 500

    except Exception as e:
        logger.error(f"Question generation failed: {e}", exc_info=True)
        return jsonify({"error": f"Question generation failed: {e}"}), 500

    questions_to_insert = []
    for mcq in mcqs:
        questions_to_insert.append({
            "token": token_id,
            "type": "mcq",
            "question": mcq['question'],
            "options": mcq['options'],
            "correctAnswer": mcq['correct'],
            "correctIndex": mcq.get('correct_index', 0),
            "marks": mcq_marks,
            "context": mcq['context'],
            "difficulty": mcq['difficulty'],
            "subject": subject  # Add subject to each question
        })
    for desc in descriptive:
        questions_to_insert.append({
            "token": token_id,
            "type": "descriptive",
            "question": desc['question'],
            "correctAnswer": desc['answer'],
            "marks": descriptive_marks,
            "pdfContent": pdf_content if input_type == 'pdf' else None,
            "context": desc['context'],
            "difficulty": desc['difficulty'],
            "subject": subject  # Add subject to each question
        })

    try:
        if questions_to_insert:
            questions.insert_many(questions_to_insert)
            logger.info(f"Inserted {len(questions_to_insert)} questions into database")
        content_to_store = content_to_process
        notes.insert_one({"token": token_id, "content": content_to_store, "createdAt": datetime.now(), "inputType": input_type, "subject": subject})
        logger.info(f"Inserted note with token: {token_id}")
    except Exception as e:
        logger.error(f"Database insertion failed: {e}", exc_info=True)
        return jsonify({"error": f"Database insertion failed: {e}"}), 500

    return jsonify({"token": token_id, "mcqs": mcqs, "descriptiveQuestions": descriptive}), 201

@app.route('/api/teacher/questions/<token>', methods=['GET'])
def get_questions(token):
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'teacher':
        return jsonify({"error": "Unauthorized"}), 403
    mcqs = list(questions.find({"token": token, "type": "mcq"}))
    descriptive = list(questions.find({"token": token, "type": "descriptive"}))
    valid_mcqs = []
    for mcq in mcqs:
        if (mcq.get('question') and not mcq['question'].startswith("Generate") and len(mcq['question']) > 10 and
            mcq['question'].endswith("?") and
            mcq.get('options') and len(mcq['options']) == 4 and all(len(opt) > 2 for opt in mcq['options']) and
            mcq.get('correctAnswer') and mcq['correctAnswer'] in mcq['options']):
            valid_mcqs.append(mcq)
        else:
            logger.warning(f"Filtered out invalid MCQ: {mcq.get('question', 'No question')}")
    valid_descriptive = []
    for desc in descriptive:
        if (desc.get('question') and not desc['question'].startswith("Generate") and len(desc['question']) > 10 and
            desc['question'].endswith("?") and desc.get('correctAnswer')):
            valid_descriptive.append(desc)
        else:
            logger.warning(f"Filtered out invalid Descriptive: {desc.get('question', 'No question')}")
    total_mcqs = len(valid_mcqs)
    total_descriptive = len(valid_descriptive)
    if total_mcqs == 0 and total_descriptive == 0:
        return jsonify({"error": "No valid questions found for this token"}), 404
    logger.info(f"Fetched MCQ IDs: {[str(mcq['_id']) for mcq in valid_mcqs]}")
    logger.info(f"Fetched Descriptive IDs: {[str(desc['_id']) for desc in valid_descriptive]}")
    for item in valid_mcqs + valid_descriptive:
        if '_id' in item:
            item['_id'] = str(item['_id'])
    return jsonify({
        "mcqs": valid_mcqs,
        "descriptive": valid_descriptive,
        "totalMCQs": total_mcqs,
        "totalDescriptive": total_descriptive,
        "subject": valid_mcqs[0]['subject'] if valid_mcqs else valid_descriptive[0]['subject'] if valid_descriptive else 'General'  # Return subject
    }), 200

@app.route('/api/teacher/question-history/<token>', methods=['GET'])
def get_question_history(token):
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'teacher':
        return jsonify({"error": "Unauthorized"}), 403

    # Fetch all questions for the token
    questions_list = list(questions.find({"token": token}))

    # Fetch all submissions for the token
    submissions_list = list(submissions.find({"token": token}))

    # Aggregate student performance with answers
    history = []
    for question in questions_list:
        question_data = {
            "_id": str(question['_id']),
            "question": question['question'],
            "type": question['type'],
            "subject": question['subject'],
            "difficulty": question['difficulty'],
            "context": question['context'],
            "options": question.get('options', []),
            "correctAnswer": question.get('correctAnswer'),
            "marks": question['marks']
        }
        student_performance = []
        for submission in submissions_list:
            answers = submission.get('answers', {})
            if question['type'] == 'mcq':
                for answer in answers.get('mcq', []):
                    if str(answer['id']) == str(question['_id']):
                        student_performance.append({
                            "studentName": submission['studentName'],
                            "answer": answer['answer'],
                            "isCorrect": answer['answer'] == question['correctAnswer'],
                            "score": question['marks'] if answer['answer'] == question['correctAnswer'] else 0,
                            "submittedAt": submission['submittedAt'].isoformat()
                        })
            elif question['type'] == 'descriptive':
                for answer in answers.get('descriptive', []):
                    if str(answer['id']) == str(question['_id']):
                        student_answer = nlp(answer['answer'].lower() if answer['answer'] else "")
                        correct_answer = nlp(question['correctAnswer'].lower() if question['correctAnswer'] else "")
                        similarity = student_answer.similarity(correct_answer) if student_answer and correct_answer else 0
                        score = min(similarity * question['marks'], question['marks'])
                        student_performance.append({
                            "studentName": submission['studentName'],
                            "answer": answer['answer'],
                            "similarity": similarity,
                            "score": round(score, 2),
                            "submittedAt": submission['submittedAt'].isoformat()
                        })
        question_data['studentPerformance'] = student_performance
        history.append(question_data)

    return jsonify({"history": history}), 200

# ... (previous imports and setup remain the same)

@app.route('/api/teacher/create-test', methods=['POST'])
def create_test():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'teacher':
        return jsonify({"error": "Unauthorized"}), 403
    data = request.get_json()
    token = data.get('token')
    desired_mcqs = int(data.get('desiredMCQs', 0))
    desired_descriptive = int(data.get('desiredDescriptive', 0))
    logger.info(f"Create Test Request - Token: {token}, Desired MCQs: {desired_mcqs}, Desired Descriptive: {desired_descriptive}")

    # Fetch the question pool to validate the desired counts
    mcqs = list(questions.find({"token": token, "type": "mcq"}))
    descriptive = list(questions.find({"token": token, "type": "descriptive"}))

    # Filter valid questions (same as get_questions endpoint)
    valid_mcqs = [
        mcq for mcq in mcqs
        if (mcq.get('question') and not mcq['question'].startswith("Generate") and len(mcq['question']) > 10 and
            mcq['question'].endswith("?") and
            mcq.get('options') and len(mcq['options']) == 4 and all(len(opt) > 2 for opt in mcq['options']) and
            mcq.get('correctAnswer') and mcq['correctAnswer'] in mcq['options'])
    ]
    valid_descriptive = [
        desc for desc in descriptive
        if (desc.get('question') and not desc['question'].startswith("Generate") and len(desc['question']) > 10 and
            desc['question'].endswith("?") and desc.get('correctAnswer'))
    ]

    if desired_mcqs > len(valid_mcqs):
        logger.warning(f"Adjusting desiredMCQs from {desired_mcqs} to {len(valid_mcqs)} due to insufficient questions")
        desired_mcqs = len(valid_mcqs)
    if desired_descriptive > len(valid_descriptive):
        logger.warning(f"Adjusting desiredDescriptive from {desired_descriptive} to {len(valid_descriptive)} due to insufficient questions")
        desired_descriptive = len(valid_descriptive)

    if desired_mcqs == 0 or desired_descriptive == 0:
        return jsonify({"error": "Desired MCQs and Descriptive questions must be greater than 0"}), 400

    # Fetch the subject from the notes collection
    note = notes.find_one({"token": token})
    subject = note.get('subject', 'General') if note else 'General'

    # Store only the desired counts in the test configuration
    test_config = {
        "token": token,
        "desiredMCQs": desired_mcqs,
        "desiredDescriptive": desired_descriptive,
        "createdAt": datetime.now(),
        "subject": subject  # Include subject in test configuration
    }
    tests.insert_one(test_config)
    users.update_one(
        {"_id": ObjectId(payload['id'])},
        {
            "$push": {
                "conductedTests": {
                    "token": token,
                    "createdAt": datetime.now(),
                    "numMCQs": desired_mcqs,
                    "numDescriptive": desired_descriptive,
                    "subject": subject  # Add subject to conductedTests
                }
            }
        }
    )
    logger.info(f"Updated conductedTests for teacher {payload['username']} with token {token}")
    return jsonify({"testToken": token, "message": f"Test created with {desired_mcqs} MCQs and {desired_descriptive} descriptive questions to be randomly selected from the pool"}), 201

# ... (rest of the app.py remains the same)

@app.route('/api/student/join', methods=['POST'])
def join_test():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 403
    data = request.get_json()
    token = data.get('token')
    test_config = tests.find_one({"token": token})
    if not test_config:
        return jsonify({"error": "Invalid token"}), 404
    desired_mcqs = test_config['desiredMCQs']
    desired_descriptive = test_config['desiredDescriptive']

    # Fetch all valid questions from the question pool
    mcqs = list(questions.find({"token": token, "type": "mcq"}))
    descriptive = list(questions.find({"token": token, "type": "descriptive"}))

    # Filter valid questions
    valid_mcqs = [
        mcq for mcq in mcqs
        if (mcq.get('question') and not mcq['question'].startswith("Generate") and len(mcq['question']) > 10 and
            mcq['question'].endswith("?") and
            mcq.get('options') and len(mcq['options']) == 4 and all(len(opt) > 2 for opt in mcq['options']) and
            mcq.get('correctAnswer') and mcq['correctAnswer'] in mcq['options'])
    ]
    valid_descriptive = [
        desc for desc in descriptive
        if (desc.get('question') and not desc['question'].startswith("Generate") and len(desc['question']) > 10 and
            desc['question'].endswith("?") and desc.get('correctAnswer'))
    ]

    if len(valid_mcqs) < desired_mcqs or len(valid_descriptive) < desired_descriptive:
        return jsonify({"error": "Not enough valid questions available in the pool"}), 400

    # Randomly select the desired number of questions for this student
    selected_mcqs = random.sample(valid_mcqs, desired_mcqs)
    selected_descriptive = random.sample(valid_descriptive, desired_descriptive)

    # Prepare the response
    for item in selected_mcqs + selected_descriptive:
        if '_id' in item:
            item['_id'] = str(item['_id'])
    return jsonify({
        "mcqs": selected_mcqs,
        "descriptive": selected_descriptive,
        "token": token
    }), 200

@app.route('/api/student/submit', methods=['POST'])
def submit_test():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 403
    data = request.get_json()
    token = data.get('token')
    answers = data.get('answers', {})
    student_name = payload['username']
    total_score = 0
    total_marks = 0
    mcq_answers = answers.get('mcq', [])
    descriptive_answers = answers.get('descriptive', [])

    # Fetch the questions based on the IDs in the answers
    mcq_questions = list(questions.find({"_id": {"$in": [ObjectId(doc['id']) for doc in mcq_answers]}}))
    descriptive_questions = list(questions.find({"_id": {"$in": [ObjectId(doc['id']) for doc in descriptive_answers]}}))

    # Calculate the score
    for answer in mcq_answers:
        question = next((q for q in mcq_questions if str(q['_id']) == answer['id']), None)
        if question and question['correctAnswer'] == answer['answer']:
            total_score += question['marks']
        if question:
            total_marks += question['marks']
    for answer in descriptive_answers:
        question = next((q for q in descriptive_questions if str(q['_id']) == answer['id']), None)
        if question:
            student_answer = nlp(answer['answer'].lower() if answer['answer'] else "")
            correct_answer = nlp(question['correctAnswer'].lower() if question['correctAnswer'] else "")
            similarity = student_answer.similarity(correct_answer) if student_answer and correct_answer else 0
            total_score += min(similarity * question['marks'], question['marks'])
            total_marks += question['marks']

    # Store the questions along with the answers in the submission
    submission = {
        "token": token,
        "studentName": student_name,
        "answers": answers,
        "questions": {
            "mcq": [
                {key: question[key] for key in question if key != '_id'} | {"_id": str(question['_id'])}
                for question in mcq_questions
            ],
            "descriptive": [
                {key: question[key] for key in question if key != '_id'} | {"_id": str(question['_id'])}
                for question in descriptive_questions
            ]
        },
        "score": round(total_score, 2),
        "totalMarks": total_marks,
        "submittedAt": datetime.now()
    }
    submissions.insert_one(submission)
    users.update_one(
        {"_id": ObjectId(payload['id'])},
        {
            "$push": {
                "attendedTests": {
                    "token": token,
                    "submittedAt": datetime.now(),
                    "score": round(total_score, 2),
                    "totalMarks": total_marks
                }
            }
        }
    )
    logger.info(f"Updated attendedTests for student {student_name} with token {token}")
    return jsonify({"score": total_score, "total": total_marks}), 201

@app.route('/api/teacher/results/<token>', methods=['GET'])
def teacher_results(token):
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'teacher':
        return jsonify({"error": "Unauthorized"}), 403
    submissions_list = list(submissions.find({"token": token}))
    class_average = sum(sub['score'] for sub in submissions_list) / len(submissions_list) if submissions_list else 0
    for item in submissions_list:
        if '_id' in item:
            item['_id'] = str(item['_id'])
        item['answers'] = item.get('answers', {})
        item['questions'] = item.get('questions', {})
    return jsonify({"submissions": submissions_list, "classAverage": round(class_average, 2)}), 200

@app.route('/api/student/results', methods=['GET'])
def student_results():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 403
    submissions_list = list(submissions.find({"studentName": payload['username']}))
    for item in submissions_list:
        if '_id' in item:
            item['_id'] = str(item['_id'])
    return jsonify(submissions_list), 200

@app.route('/api/leaderboard/<token>', methods=['GET'])
def leaderboard(token):
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload:
        return jsonify({"error": "Unauthorized"}), 403

    submissions_list = list(submissions.find({"token": token}).sort("score", -1))
    total_questions = questions.count_documents({"token": token})
    class_average = sum(sub['score'] for sub in submissions_list) / len(submissions_list) if submissions_list else 0
    leaderboard_data = []
    for i, sub in enumerate(submissions_list, 1):
        leaderboard_data.append({
            "_id": str(sub['_id']),
            "rank": i,
            "studentName": sub['studentName'],
            "score": sub['score'],
            "totalMarks": sub['totalMarks'],
            "submittedAt": sub['submittedAt'].isoformat()
        })
    return jsonify({
        "leaderboard": leaderboard_data,
        "classAverage": round(class_average, 2),
        "totalQuestions": total_questions
    }), 200

@app.route('/api/teacher/history', methods=['GET'])
def teacher_history():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'teacher':
        return jsonify({"error": "Unauthorized"}), 403
    user = users.find_one({"_id": ObjectId(payload['id'])})
    conducted_tests = user.get('conductedTests', [])
    return jsonify({"conductedTests": conducted_tests}), 200

@app.route('/api/student/history', methods=['GET'])
def student_history():
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"error": "No token provided"}), 401
    payload = authenticate(auth_token[7:])
    if not payload or payload['role'] != 'student':
        return jsonify({"error": "Unauthorized"}), 403
    user = users.find_one({"_id": ObjectId(payload['id'])})
    attended_tests = user.get('attendedTests', [])
    return jsonify({"attendedTests": attended_tests}), 200

@app.route('/api/debug-password', methods=['POST'])
def debug_password():
    data = request.get_json()
    password = data.get('password')
    stored_hash = data.get('storedHash')
    if not password or not stored_hash:
        return jsonify({"error": "Missing password or stored hash"}), 400
    hashed = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')
    logger.info(f"Generated hash for {password}: {hashed}")
    try:
        match = checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        logger.info(f"Password match with stored hash: {match}")
    except Exception as e:
        logger.error(f"Error during password comparison: {e}")
        return jsonify({"error": f"Password comparison failed: {e}"}), 500
    return jsonify({"generatedHash": hashed, "match": match}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.json_encoder = mongo_to_json
    app.run(debug=True, host='0.0.0.0', port=port)