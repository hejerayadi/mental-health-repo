from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from speech_to_text import speech_to_text_whisper
from models.speech_emotion_model import EmotionPredictor
import time
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'vocals')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Gemini API and load model (add at the top if not present)
# genai.configure(api_key="AIzaSyChBfvdVA1bRLfIEukWLNGOAfSl5hlHZ9A")
# model = genai.GenerativeModel("models/gemini-1.5-flash")
SYSTEM_PROMPT = (
    "You are an intelligent and supportive mental health assistant for Tunisian athletes, "
    "working within the CNOT (Comité National Olympique Tunisien) performance platform. "
    "Your role is to respond with empathy, encouragement, and scientifically informed mental health advice, "
    "tailored to the emotional and psychological needs of athletes. "
    "Always respond respectfully and in a culturally sensitive way. Keep answers simple and helpful."
)

predictor = EmotionPredictor()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "phi2-mentalhealth-final")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
phi2_model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    low_cpu_mem_usage=True,
    torch_dtype=torch.float16,  # Use half precision
    device_map="auto"
)

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
        print("=== CHAT POST REQUEST RECEIVED ===")  # Debug log
        
        # Accept both JSON and multipart/form-data
        if request.content_type.startswith('application/json'):
            data = request.get_json()
            user_message = data.get('message', '')
            audio_file = None
        else:
            user_message = request.form.get('message', '')
            audio_file = request.files.get('audio')

        print(f"User message: {user_message}")  # Debug log
        print(f"Audio file: {audio_file}")  # Debug log

        transcript = None
        # If audio is provided, transcribe
        if audio_file:
            temp_path = "temp_audio.wav"
            audio_file.save(temp_path)
            transcript, _ = speech_to_text_whisper(temp_path, return_language=True)
            os.remove(temp_path)
        
        # Build the prompt
        prompt_parts = [SYSTEM_PROMPT]
        if transcript:
            prompt_parts.append(f"User (transcribed): {transcript}")
        elif user_message:
            prompt_parts.append(f"User: {user_message}")
        prompt_parts.append("Assistant:")
        full_prompt = "\n\n".join(prompt_parts)
        
        print(f"Full prompt: {full_prompt}")  # Debug log
        
        inputs = tokenizer(full_prompt, return_tensors="pt")
        print("Tokenized input shape:", inputs['input_ids'].shape)  # Debug log
        
        print("Starting model generation...")  # Debug log
        with torch.no_grad():
            outputs = phi2_model.generate(
                **inputs, 
                max_new_tokens=64,  # Reduced from 128 for speed
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.eos_token_id,
                early_stopping=True,  # Stop when EOS token is generated
                num_beams=1  # Use greedy decoding for speed
            )
        print("Model generation completed!")  # Debug log
        
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Optionally, remove the prompt from the response:
        response_text = response_text[len(full_prompt):].strip()
        
        print(f"Generated response: {response_text}")  # Debug log
        
        return jsonify({"response": response_text, "transcript": transcript})
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
        print(f"🈶 Detected Emotion: {emotion}")  # Print emotion to CMD
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

        inputs = tokenizer(prompt, return_tensors="pt")
        with torch.no_grad():
            outputs = phi2_model.generate(**inputs, max_new_tokens=256)
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response_text = response_text[len(prompt):].strip()
        return jsonify({"response": response_text})

    except Exception as e:
        import traceback
        print('Error in /chat:', e)
        traceback.print_exc()
        return jsonify({"response": "Sorry, something went wrong.", "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)