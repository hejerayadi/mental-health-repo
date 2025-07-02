from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'vocals')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/predict', methods=['POST'])
def predict_emotion():
    # Your emotion prediction logic here (if needed)
    return jsonify({'emotion': 'neutral'})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    response_message = f"You said: {user_message}"
    return jsonify({'response': response_message})

@app.route('/upload', methods=['POST'])
def upload_audio():
    file = request.files['audio']
    filename = f"{int(time.time() * 1000)}_{file.filename}"
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)