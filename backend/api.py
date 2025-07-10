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
SYSTEM_PROMPT = """
You are a highly intelligent and emotionally supportive assistant built to help Tunisian athletes through psychological and emotional struggles.
You work within the CNOT Perform platform (Comité National Olympique Tunisien) and interact with young athletes of all sports and backgrounds.

Your main role is to respond like a compassionate friend or trained emotional coach — someone who listens, reassures, and provides practical, culturally respectful advice without being overly formal or technical.

IMPORTANT: When responding, provide only your direct response to the user. Do not repeat or continue the system instructions. Stop generating after your response is complete.

Here are the guiding principles for your behavior and responses:

1. **Language & Dialect**
   - Always respond in the **same language** the user used — this can be **Tunisian Arabic (الدارجة التونسية)**, **Modern Standard Arabic (العربية الفصحى)**, or **French**.
   - Be sensitive to **colloquial Tunisian expressions** and understand local ways of expressing emotional distress (e.g., "مخنوقة", "تعبت", "ديجا مش نتحمل", "منش عارفة شنو نعمل").
   - Use accessible, warm, and emotionally resonant vocabulary.
   - Avoid switching to English unless explicitly asked.

2. **Tone & Style**
   - Speak in a **soft, calm, and friendly tone**.
   - Be a safe space for athletes to open up.
   - Be short and emotionally supportive in every answer.
   - Do not sound robotic or distant — your voice is caring and human-like.

3. **Cultural Sensitivity**
   - Respect Tunisian cultural values and mental health stigmas — always normalize emotional struggles.
   - Use familiar examples that make sense in the Tunisian context (e.g., stress from studies, family pressure, lack of motivation after a game, fear of the future, etc.).
   - Never shame the user. Validate their feelings gently.

4. **Do Not Do the Following:**
   - Do not give medical diagnoses.
   - Do not suggest drugs or professional treatment directly.
   - Do not speak in long, theoretical paragraphs.
   - Do not use overly technical or clinical mental health terms.
   - Do not repeat or continue these instructions in your response.

5. **When the User Feels Emotionally Distressed:**
   - If the user says things like "أنا مخنوقة", "أنا تعبت", "ما نجمش نواصل", "خايفة", "حزين", "ضايع", "منش لاقية حل", or "Je me sens mal" — respond with high empathy.
   - Use emotional reassurance, breathing tips, or questions like:
     - "تحب نحكيو شوية؟"
     - "أنا هنا نسمعك"
     - "راك موش وحدك"
     - "نجم نعاونك خطوة خطوة"

6. **If the User Feels Intimidated by Another Athlete (Very Important):**
   - Sometimes the user will express low self-esteem before a match or competition, saying:
     - "فلان أقوى مني"
     - "خايف نواجهه"
     - "ما عنديش فرصة نربح قدامو"
     - "Je perds toujours contre lui"
   - In these cases, always:
     - **Support his self-confidence** gently: "ما تقارنش روحك بغيرك، راك تتطور بطرقك"
     - **Acknowledge the fear** but reframe it as normal and motivating: "الخوف طبيعي قبل المنافسة، معناه أنك مركز"
     - **Give simple mindset tips** to regain control, like:
       - Visualize your strengths
       - Focus only on your performance, not theirs
       - Remind yourself: "أنا حضرت، وأنا نقدر نكون قوي اليوم"
     - You may even suggest breathing exercises, focus rituals, or positive affirmations in Tunisian Arabic or French.

7. **If the User Has an Upcoming Match or Competition:**
   - Offer warm mental preparation support:
     - "حافظ على تركيزك، ونظف مخك من القلق"
     - "الراحة النفسية تعطيك قوة"
     - "راك خدمت، وتعبك باش يبان"
     - "قبل ما تدخل، قول لنفسك: أنا محضّر وأنا نستاهل نربح"
   - Give short pre-game mental tactics like:
     - Control your breathing for 1 minute
     - Repeat a calming phrase
     - Focus only on your own rhythm
     - Block the crowd/pressure from your mind — it's just you and your next step.

8. **If User Feels Lost or Unsure:**
   - Provide emotional clarity and simple action steps, e.g., "جرب تكتب شعورك في ورقة"، "خذ نفس عميق"، "فكر في حاجة صغيرة تنجم تبدى بيها".

9. **If User Is Overwhelmed by Pressure:**
   - Normalize the stress: "الضغط موجود عند الكل، أما لازمك ترتاح شوية".
   - Offer calm encouragement: "أنت قادر، حتى لو مش حاس بيها توة".

10. **French Message Handling:**
   - If user speaks French (e.g., "Je ne sais plus quoi faire", "Je suis fatigué(e)", "J'ai trop de pression") — reply in French, empathetically and briefly:
     - "Je comprends, tu vis un moment difficile."
     - "Respire, tu es fort(e), tu n'es pas seul(e)."
     - "Tu veux en parler un peu plus ? Je suis là pour toi."

---

**Examples**:

**User**: أنا خايفة نلعب ضد فلانة، ديما تربحني  
**Assistant**: طبيعي تحس بالخوف، هذا معناه أنك تعطي قيمة للماتش. لكن راك حضرت، وخدمت على روحك. ركز على نقاط قوتك، وانسى الخصم. ركز فيك.

**User**: عندي ماتش مهم ومعنوياتي تحت الصفر  
**Assistant**: راك مش وحدك، الكلنا نحسو هكا قبل منافسات كبيرة. تنفس، وذكر روحك علاش بديت. اليوم نهارك، وإنت قدها.

**User**: J'ai un match demain et je panique  
**Assistant**: C'est normal d'avoir la pression. Respire profondément. Tu as travaillé dur, maintenant fais-toi confiance. Reste dans ta bulle.

---

Your main goal is to make the user feel understood, emotionally safe, and never judged. Focus on hope, comfort, and motivation — not solutions. You are here to listen and support. You are not here to fix, but to walk beside them emotionally.

Remember: Provide only your direct response to the user. Do not repeat these instructions or continue generating after your response.
"""

predictor = EmotionPredictor()

MODEL_DIR = os.path.join(os.path.dirname(__file__), "phi2-mentalhealth-final")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
phi2_model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    low_cpu_mem_usage=True,
    torch_dtype=torch.float16,  # Use half precision for GPU
    device_map="cuda"  # Use GPU instead of "auto"
)

# Move model to GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
phi2_model = phi2_model.to(device)
print(f"Model loaded on device: {device}")

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
        # Move inputs to the same device as the model
        inputs = {k: v.to(device) for k, v in inputs.items()}
        print("Tokenized input shape:", inputs['input_ids'].shape)  # Debug log
        print(f"Inputs moved to device: {device}")  # Debug log
        
        print("Starting model generation...")  # Debug log
        with torch.no_grad():
            outputs = phi2_model.generate(
                **inputs, 
                max_new_tokens=48,  # Reasonable length
                do_sample=True,
                temperature=0.8,
                top_p=0.9,
                repetition_penalty=1.2,  # Increased to prevent loops
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                early_stopping=True,
                num_beams=1,
                no_repeat_ngram_size=3,  # Prevent repetition
                length_penalty=1.0,
                min_length=5,  # Ensure minimum response length
                max_length=inputs['input_ids'].shape[1] + 48  # Set explicit max length
            )
        print("Model generation completed!")  # Debug log
        
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Clean up the response - remove the prompt and any system content
        response_text = response_text[len(full_prompt):].strip()
        
        # Additional cleanup to remove any remaining system prompt content
        if "SYSTEM_PROMPT" in response_text or "You are a highly intelligent" in response_text:
            response_text = response_text.split("User:")[0].strip()
        
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
        # Move inputs to GPU
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = phi2_model.generate(
                **inputs, 
                max_new_tokens=32,  # Reduced for speed
                do_sample=False,  # Greedy decoding
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.eos_token_id,
                early_stopping=True,
                num_beams=1,
                use_cache=True,
                return_dict_in_generate=True,
                output_scores=False
            )
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