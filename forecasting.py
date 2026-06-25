def generate_weekly_forecast(dashboard_data: dict) -> dict:
    """
    Analyzes current spending to predict the next 7 days of expenses.
    """
    total_spent = dashboard_data.get("total_spent", 0.0)
    
    # In a real app, we would divide by the exact number of days in the month so far.
    # For this startup MVP, we will assume we are 14 days into the month.
    days_elapsed = 14 
    
    # 1. Calculate spending velocity
    daily_average = total_spent / days_elapsed if days_elapsed > 0 else 0
    
    # 2. Project the next 7 days
    predicted_next_week = daily_average * 7
    
    # 3. Generate a Smart Warning
    warning_flag = "🟢 On Track"
    advice = "Your spending velocity is stable."
    
    if daily_average > 100:
        warning_flag = "🔴 High Alert"
        advice = f"You are burning ${daily_average:.2f} a day. Slow down, or you will spend ${predicted_next_week:.2f} next week!"
    elif daily_average > 50:
        warning_flag = "🟡 Caution"
        advice = f"Watch your daily purchases. Projected next week: ${predicted_next_week:.2f}."
        
    return {
        "predicted_7_day_spend": round(predicted_next_week, 2),
        "daily_velocity": round(daily_average, 2),
        "status_flag": warning_flag,
        "smart_advice": advice
    }