from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from speech_to_text import speech_to_text_whisper
from models.speech_emotion_model import EmotionPredictor

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'vocals')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

predictor = EmotionPredictor()

@app.route('/predict', methods=['POST'])
def predict_emotion():
    if 'file' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['file']
    temp_path = "temp_audio.wav"  # Use .wav for librosa compatibility
    audio_file.save(temp_path)

    try:
        emotion = predictor.predict(temp_path)
        print("Detected emotion:", emotion)  # This will show in your CMD/terminal
        os.remove(temp_path)
        return jsonify({'emotion': emotion})
    except Exception as e:
        print("Emotion prediction error:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
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

@app.route('/transcribe', methods=['POST'])
def transcribe():
    audio = request.files['audio']
    filename = audio.filename
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    audio.save(save_path)
    # Transcribe the latest audio (the one just saved)
    text, language = speech_to_text_whisper(save_path, return_language=True)
    # Also detect emotion
    #this is added recently to have the same request 
    try:
        emotion = predictor.predict(save_path)
    except Exception as e:
        print("Emotion prediction error:", e)
        emotion = None
    return jsonify({'text': text, 'language': language, 'emotion': emotion})

if __name__ == '__main__':
    app.run(port=5000, debug=True)