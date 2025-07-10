from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

print(torch.cuda.is_available())           # → Should print: True
# Check for GPU availability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Load base model (Phi-2) to GPU
base_model = AutoModelForCausalLM.from_pretrained(
    "microsoft/phi-2", 
    trust_remote_code=True,
    torch_dtype=torch.float16,  # Use half precision for GPU
    device_map="cuda" if torch.cuda.is_available() else "cpu"
).to(device)

# Load PEFT fine-tuned adapter (local path)
model = PeftModel.from_pretrained(base_model, "./phi2-mentalhealth-final").to(device)

# Load tokenizer (you can reuse the same directory if the tokenizer is included)
tokenizer = AutoTokenizer.from_pretrained("./phi2-mentalhealth-final", trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

# Generate response function
def generate_response(prompt):
    input_text = (
        f"### Instruction: Provide a helpful mental health response\n"
        f"### Context: {prompt}\n### Response:"
    )
    inputs = tokenizer(input_text, return_tensors="pt", padding=True, truncation=True)
    # Move inputs to GPU
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    print(f"Input shape: {inputs['input_ids'].shape}")
    print(f"Inputs moved to device: {device}")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=48,  # Reduced for speed testing
            temperature=0.8,
            top_p=0.9,
            repetition_penalty=1.2,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            early_stopping=True,
            num_beams=1,
            no_repeat_ngram_size=3,
            min_length=5,
            max_length=inputs['input_ids'].shape[1] + 48
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Clean up response
    response = response[len(input_text):].strip()
    return response

# Example usage
if __name__ == "__main__":
    import time
    
    prompt = "I've been feeling really anxious lately and can't sleep well. What can I do?"
    
    print("Testing model speed...")
    start_time = time.time()
    
    response = generate_response(prompt)
    
    end_time = time.time()
    generation_time = end_time - start_time
    
    print(f"\nGeneration time: {generation_time:.2f} seconds")
    print(f"\nGenerated Response:\n{response}")
    
    # Test multiple generations to get average speed
    print("\n" + "="*50)
    print("Testing multiple generations for average speed...")
    
    times = []
    for i in range(3):
        start_time = time.time()
        response = generate_response(prompt)
        end_time = time.time()
        generation_time = end_time - start_time
        times.append(generation_time)
        print(f"Generation {i+1}: {generation_time:.2f}s")
    
    avg_time = sum(times) / len(times)
    print(f"\nAverage generation time: {avg_time:.2f} seconds")
    print(f"Tokens per second: {48/avg_time:.1f}")
