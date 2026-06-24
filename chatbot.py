import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print(f"DEBUG - Did I find the key?: {os.getenv('GEMINI_API_KEY')}")

def ask_financial_assistant(user_query: str, dashboard_data: dict) -> str:
    """
    Sends the user's financial data and question to Gemini for personalized advice.
    """
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # We give the AI a "Persona" and feed it the live database numbers
        system_prompt = f"""
        You are a highly intelligent, encouraging, and concise personal financial advisor.
        Here is the user's current live financial data:
        Total Spent: ${dashboard_data.get('total_spent')}
        Health Score: {dashboard_data.get('health_score')}/100
        Category Breakdown: {dashboard_data.get('category_breakdown')}
        
        The user is going to ask you a question. Answer it directly based ONLY on this data. 
        Keep your answer under 3 sentences so it fits nicely on a mobile screen.
        """
        
        # Combine the persona and the user's specific question
        full_prompt = f"{system_prompt}\n\nUser Question: {user_query}"
        
        response = model.generate_content(full_prompt)
        return response.text.strip()
        
    except Exception as e:
        print(f"Chat API Error: {e}")
        return "I am having trouble connecting to my brain right now. Please check my API key!"