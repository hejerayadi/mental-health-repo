from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from speech_to_text import speech_to_text_whisper
from models.speech_emotion_model import EmotionPredictor
import google.generativeai as genai
import os

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'vocals')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Gemini API and load model (add at the top if not present)
genai.configure(api_key="AIzaSyChBfvdVA1bRLfIEukWLNGOAfSl5hlHZ9A")
model = genai.GenerativeModel("models/gemini-1.5-flash")
SYSTEM_PROMPT = (
    "You are an intelligent and supportive mental health assistant for Tunisian athletes, "
    "working within the CNOT (Comité National Olympique Tunisien) performance platform. "
    "Your role is to respond with empathy, encouragement, and scientifically informed mental health advice, "
    "tailored to the emotional and psychological needs of athletes. "
    "Always respond respectfully and in a culturally sensitive way. Keep answers simple and helpful."
)

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
def chat_post():
    try:
        # Accept both JSON and multipart/form-data
        if request.content_type.startswith('application/json'):
            data = request.get_json()
            user_message = data.get('message', '')
            audio_file = None
        else:
            user_message = request.form.get('message', '')
            audio_file = request.files.get('audio')

        emotion = None
        transcript = None
        # If audio is provided, transcribe and detect emotion
        if audio_file:
            temp_path = "temp_audio.wav"
            audio_file.save(temp_path)
            transcript, _ = speech_to_text_whisper(temp_path, return_language=True)
            emotion = predictor.predict(temp_path)
            os.remove(temp_path)
        
        # Build the prompt
        prompt_parts = [SYSTEM_PROMPT]
        if transcript:
            prompt_parts.append(f"User (transcribed): {transcript}")
        elif user_message:
            prompt_parts.append(f"User: {user_message}")
        if emotion:
            prompt_parts.append(f"User emotion: {emotion}")
        prompt_parts.append("Assistant:")
        full_prompt = "\n\n".join(prompt_parts)
        
        response = model.generate_content(full_prompt)
        return jsonify({"response": response.text, "emotion": emotion, "transcript": transcript})
    except Exception as e:
        import traceback
        print('Error in /chat POST:', e)
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

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
@app.route('/chat', methods=['GET'])
def chat_get():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        response = model.generate_content(prompt)
        return jsonify({"response": response.text})

    except Exception as e:
        import traceback
        print('Error in /chat:', e)
        traceback.print_exc()
        return jsonify({"response": "Sorry, something went wrong.", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)