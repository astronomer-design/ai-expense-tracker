def generate_financial_summary(transactions, monthly_income=5000.0):
    """
    Takes a list of user transactions and generates a financial health report.
    We default to a mock monthly income of $5000 for the health score math.
    """
    # If the user has no transactions, return a blank slate
    if not transactions:
        return {
            "total_spent": 0.0,
            "category_breakdown": {},
            "health_score": 100,
            "financial_advice": "No spending yet! Keep up the great work."
        }

    # 1. Calculate Total Spent
    total_spent = sum(t.amount for t in transactions)
    
    # 2. Calculate Category Breakdown (e.g., Food: $100, Travel: $50)
    category_breakdown = {}
    for t in transactions:
        if t.category in category_breakdown:
            category_breakdown[t.category] += t.amount
        else:
            category_breakdown[t.category] = t.amount
            
    # 3. Calculate Dynamic Financial Health Score (0 to 100)
    # This checks how much of their income they are saving
    savings_ratio = (monthly_income - total_spent) / monthly_income
    
    # Ensure the score stays between 0 and 100
    health_score = max(0, min(100, int(savings_ratio * 100)))
    
    # 4. Generate Simple Advice
    if health_score > 50:
        advice = "You are in great financial shape! Your savings ratio is healthy."
    elif health_score > 20:
        advice = "You are spending a significant portion of your income. Consider reviewing your top categories."
    else:
        advice = "Warning: High risk of overspending! Please halt non-essential purchases."
        
    return {
        "total_spent": total_spent,
        "category_breakdown": category_breakdown,
        "health_score": health_score,
        "financial_advice": advice
    }