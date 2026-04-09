from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

model = joblib.load("disease_prediction_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():

    data = request.json

    symptoms = [[
        data["fever"],
        data["cough"],
        data["headache"],
        data["fatigue"],
        data["body_pain"],
        data["nausea"]
    ]]

    prediction = model.predict(symptoms)[0]

    return jsonify({
        "predicted_disease": prediction
    })

if __name__ == "__main__":
    app.run(port=5001)