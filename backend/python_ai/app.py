from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS so Node.js can easily hit this service if needed directly from browser,
# though normally Node hits it server-to-server.
CORS(app) 

@app.route('/predict', methods=['POST'])
def predict():
    """
    Accepts JSON containing { "symptoms": ["..."] }
    Returns { "predicted_disease": "..." }
    """
    data = request.json
    symptoms = data.get('symptoms', [])
    
    # For now, we use a simple heuristic to mock an ML backend. 
    # In production, you would load your scikit-learn or tensorflow model here:
    # model = joblib.load('model.pkl')
    # prediction = model.predict(encoded_symptoms)
    
    prediction = "General Illness"
    
    if not symptoms:
        return jsonify({"predicted_disease": "Undiagnosable without symptoms"})

    # Join all symptoms into a single block of lowercase text for substring matching
    symptoms_text = " ".join([str(s).lower() for s in symptoms])
    
    if any(keyword in symptoms_text for keyword in ['chest pain', 'shortness of breath', 'heart', 'palpitations', 'breathing', 'breathless', 'wheezing']):
        prediction = "Respiratory Distress / Potential Asthma"
    elif any(keyword in symptoms_text for keyword in ['severe headache', 'migraine', 'light sensitivity']):
        prediction = "Migraine"
    elif any(keyword in symptoms_text for keyword in ['stomach ache', 'stomach pain', 'vomiting', 'diarrhea', 'nausea', 'belly']):
        prediction = "Gastroenteritis / Food Poisoning"
    elif any(keyword in symptoms_text for keyword in ['fever', 'cough', 'fatigue', 'body ache', 'cold', 'sore throat', 'chills']):
        prediction = "Viral Flu / Influenza"
    elif any(keyword in symptoms_text for keyword in ['joint pain', 'muscle ache', 'stiffness', 'back pain', 'knee', 'leg pain', 'bone']):
        prediction = "Arthritis / Osteoarthritis / Muscular Strain"
    elif any(keyword in symptoms_text for keyword in ['rash', 'itchy', 'skin', 'redness']):
        prediction = "Dermatitis / Allergic Reaction"
    elif any(keyword in symptoms_text for keyword in ['headache', 'dizzy', 'dizziness']):
        prediction = "Tension Headache / Fatigue"
    elif any(keyword in symptoms_text for keyword in ['anxiety', 'stress', 'tired', 'sleep']):
        prediction = "Stress / Anxiety / Sleep Deprivation"
    
    return jsonify({"predicted_disease": prediction})

if __name__ == '__main__':
    # Running on 5001 as required by aiController.js
    app.run(port=5001, debug=False)
