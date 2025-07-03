import whisper

# Load the model once
model = whisper.load_model("base")  # or "small", "medium", "large"

def speech_to_text_whisper(audio_path, return_language=False):
    result = model.transcribe(audio_path)
    print("🈶 Detected Language:", result["language"])
    print("🈶 Transcription:", result["text"])
    if return_language:
        return result["text"], result["language"]
    return result["text"]

