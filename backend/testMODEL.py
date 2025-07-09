from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

# Load base model (Phi-2) to CPU
base_model = AutoModelForCausalLM.from_pretrained("microsoft/phi-2", trust_remote_code=True).to("cpu")

# Load PEFT fine-tuned adapter (local path)
model = PeftModel.from_pretrained(base_model, "./phi2-mentalhealth-final").to("cpu")

# Load tokenizer (you can reuse the same directory if the tokenizer is included)
tokenizer = AutoTokenizer.from_pretrained("./phi2-mentalhealth-final", trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

# Generate response function
def generate_response(prompt):
    input_text = (
        f"### Instruction: Provide a helpful mental health response\n"
        f"### Context: {prompt}\n### Response:"
    )
    inputs = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True).to("cpu")
    outputs = model.generate(
        **inputs,
        max_new_tokens=200,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
        do_sample=True
    )
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

# Example usage
if __name__ == "__main__":
    prompt = "I’ve been feeling really anxious lately and can’t sleep well. What can I do?"
    response = generate_response(prompt)
    print("\nGenerated Response:\n", response)
