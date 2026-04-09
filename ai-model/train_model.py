import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
data = pd.read_csv("symptom_dataset.csv")

# Split features and labels
X = data.drop("disease", axis=1)
y = data["disease"]

# Train model
model = RandomForestClassifier()
model.fit(X, y)

# Save model
joblib.dump(model, "disease_prediction_model.pkl")

print("Model trained and saved successfully!")