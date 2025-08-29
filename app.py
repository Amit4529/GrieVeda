from flask import Flask, request, jsonify, send_from_directory
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from googletrans import Translator
import torch
import os

app = Flask(__name__)

# Load model and tokenizer once
model_path = r"C:\Users\itsam\GrieVeda\complaint_classifier"
tokenizer = DistilBertTokenizerFast.from_pretrained(model_path)
model = DistilBertForSequenceClassification.from_pretrained(model_path)
model.eval()
translator = Translator()

labels_map = {0: "Potholes", 1: "Streetlight", 2: "Garbage", 3: "Water Supply", 4: "Electricity"}

# Route to serve your HTML page
@app.route("/")
def home():
    return send_from_directory(os.getcwd(), "submit complain.html")

# Prediction API
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("message", "")

    if not text:
        return jsonify({"error": "No input text"}), 400

    # Translate to English
    translated = translator.translate(text, dest='en')

    # Tokenize
    inputs = tokenizer(translated.text, truncation=True, padding=True, return_tensors="pt")

    # Predict
    with torch.no_grad():
        outputs = model(**inputs)
        preds = torch.argmax(outputs.logits, dim=-1).item()

    return jsonify({
        "input": text,
        "translated": translated.text,
        "prediction": labels_map[preds]
    })

if __name__ == "__main__":
    app.run(debug=True)
