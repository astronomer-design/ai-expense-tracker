from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# 1. Provide the AI with "Training Data"
# We teach the AI by giving it examples of merchants and their correct categories.
training_merchants = [
    "Starbucks", "McDonalds", "Burger King", "Sweetgreen", # Food
    "Uber", "Lyft", "Delta Airlines", "Shell Gas Station", # Travel
    "Amazon", "Target", "Walmart", "Apple Store",          # Shopping
    "CVS Pharmacy", "Walgreens", "City Hospital",          # Healthcare
    "Netflix", "Spotify", "Hulu", "AMC Theaters",          # Entertainment
    "Electric Bill", "Water Utility", "Comcast Internet"   # Utilities
]

training_categories = [
    "Food", "Food", "Food", "Food",
    "Travel", "Travel", "Travel", "Travel",
    "Shopping", "Shopping", "Shopping", "Shopping",
    "Healthcare", "Healthcare", "Healthcare",
    "Entertainment", "Entertainment", "Entertainment", "Entertainment",
    "Utilities", "Utilities", "Utilities"
]

# 2. Build the Machine Learning Pipeline
# CountVectorizer turns the text words into math/numbers. 
# MultinomialNB is the brain algorithm that finds the patterns.
model = make_pipeline(CountVectorizer(), MultinomialNB())

# 3. Train the AI Model!
model.fit(training_merchants, training_categories)

def predict_category(merchant_name: str) -> str:
    """
    Takes a new merchant name and uses the trained AI to guess its category.
    """
    try:
        # The model expects a list of text, so we put the merchant name in brackets
        prediction = model.predict([merchant_name])
        return prediction[0]
    except Exception:
        return "Other" # Fallback if the AI gets confused