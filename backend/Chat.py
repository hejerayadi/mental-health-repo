import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key="AIzaSyChBfvdVA1bRLfIEukWLNGOAfSl5hlHZ9A")

# Load Gemini model
model = genai.GenerativeModel("models/gemini-1.5-flash")

# System prompt for consistent behavior
SYSTEM_PROMPT = (
    "You are an intelligent and supportive mental health assistant for Tunisian athletes, "
    "working within the CNOT (Comité National Olympique Tunisien) performance platform. "
    "Your role is to respond with empathy, encouragement, and scientifically informed mental health advice, "
    "tailored to the emotional and psychological needs of athletes. "
    "Always respond respectfully and in a culturally sensitive way. Keep answers simple and helpful."
)

def generate_response(user_prompt):
    if not user_prompt:
        return "Prompt cannot be empty."
    
    full_prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_prompt}\nAssistant:"
    
    try:
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"Error: {str(e)}"

# Quick test
if __name__ == "__main__":
    print(generate_response("I feel anxious before competitions. What should I do?"))
