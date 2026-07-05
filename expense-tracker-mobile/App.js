import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker'; // <-- We added the image picker!

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [aiMode, setAiMode] = useState("toast"); // Defaults to nice!
  const [loading, setLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState(""); // <-- ADD THIS
  const [aiLoading, setAiLoading] = useState(false); // <-- ADD THIS

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Current Data (Temporarily back to LOCAL for testing)
      const resDash = await fetch('https://ai-expense-tracker-backend-vs7z.onrender.com/users/1/dashboard');
      const dataDash = await resDash.json();
      setDashboardData(dataDash);

      // 2. Fetch Future Forecast (Local only right now!)
      const resForecast = await fetch('https://ai-expense-tracker-backend-vs7z.onrender.com/users/1/forecast');
      const dataForecast = await resForecast.json();
      setForecastData(dataForecast);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    setAiLoading(true);
    setAiResponse(""); // Clears the previous message

    const question = "Analyze my recent spending.";
    try {
      // (Make sure this URL is pointing to your live Render link or 127.0.0.1 depending on where you are testing!)
      const response = await fetch(`https://ai-expense-tracker-backend-vs7z.onrender.com/users/1/chat?query=${question}&mode=${aiMode}`);
      const data = await response.json();

      // Save the AI's words to our new variable instead of an Alert
      setAiResponse(data.reply);
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Whoops! The AI is taking a nap. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- BRAND NEW SCANNER FUNCTION ---
  const handleScanReceipt = async () => {
    // 1. Open the photo gallery
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    // 2. If the user picks an image and doesn't cancel...
    if (!result.canceled) {
      if (Platform.OS === 'web') {
        window.alert("Uploading receipt to Python AI Engine...");
      } else {
        Alert.alert("Uploading...", "Sending receipt to Python AI Engine...");
      }

      try {
        // Grab the image file
        const imageUri = result.assets[0].uri;
        const imageFetch = await fetch(imageUri);
        const imageBlob = await imageFetch.blob();

        // Package it up to send over the network
        const formData = new FormData();
        formData.append('file', imageBlob, 'receipt.jpg');

        // Send it to the ML Brain!
        const response = await fetch('https://ai-expense-tracker-backend-vs7z.onrender.com/upload-receipt/', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        const aiData = data.ai_extracted_data;

        // Display the results from the Machine Learning model!
        const resultText = `Merchant: ${aiData.merchant}\nCategory: ${aiData.predicted_category}\nAmount: $${aiData.amount}`;

        if (Platform.OS === 'web') {
          window.alert("✅ AI Scan Complete!\n\n" + resultText);
        } else {
          Alert.alert("✅ AI Scan Complete!", resultText);
        }

      } catch (error) {
        console.error(error);
        if (Platform.OS === 'web') window.alert("Failed to process receipt.");
        else Alert.alert("Error", "Failed to process receipt.");
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 15, color: '#64748B' }}>Connecting to AI Backend...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Expense Tracker</Text>
          <Text style={styles.headerSubtitle}>Welcome back, User #1</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Health Score</Text>
          <Text style={styles.score}>{dashboardData?.health_score || 0} / 100</Text>
          <Text style={styles.advice}>
            "{dashboardData?.financial_advice || "No advice available."}"
          </Text>
        </View>

        {/* --- GLOWING SPENDING TREND CHART --- */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden', paddingBottom: 10 }]}>
          <Text style={[styles.cardTitle, { padding: 20, paddingBottom: 5 }]}>📈 6-Month Spending Trend</Text>
          <LineChart
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
              datasets: [{ data: [120, 210, 150, 310, 280, 190] }]
            }}
            width={Dimensions.get("window").width - 40} // Auto-sizes to your screen!
            height={220}
            yAxisLabel="$"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#1E293B',
              backgroundGradientFrom: '#1E293B',
              backgroundGradientTo: '#0F172A',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Glowing Electric Green
              labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#0F172A"
              }
            }}
            bezier // This makes the line beautifully curved instead of jagged!
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        {/* --- BULLETPROOF PREDICTIVE FORECAST CARD --- */}
        {!forecastData ? (
          <View style={[styles.card, { backgroundColor: '#1E293B', alignItems: 'center', paddingVertical: 30 }]}>
            <Text style={{ color: '#94A3B8', fontStyle: 'italic' }}>🔮 Booting up Predictive AI Engine...</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: '#1E293B', borderColor: forecastData.daily_velocity > 100 ? '#EF4444' : '#334155' }]}>
            <Text style={styles.cardTitle}>🔮 Next Week's Forecast</Text>
            <Text style={styles.score}>
              ${(forecastData.predicted_7_day_spend).toFixed(2)}
            </Text>

            <Text style={{ color: forecastData.daily_velocity > 100 ? '#EF4444' : '#FBBF24', fontWeight: '700', marginBottom: 12, fontSize: 13 }}>
              {forecastData.status_flag} (Velocity: ${forecastData.daily_velocity}/day)
            </Text>

            {/* VISUAL VELOCITY GAUGE TRACK */}
            <View style={{ height: 6, backgroundColor: '#334155', borderRadius: 3, width: '100%', marginBottom: 15, overflow: 'hidden' }}>
              <View style={{
                height: '100%',
                backgroundColor: forecastData.daily_velocity > 100 ? '#EF4444' : forecastData.daily_velocity > 50 ? '#FBBF24' : '#10B981',
                width: `${Math.min((forecastData.daily_velocity / 150) * 100, 100)}%`
              }} />
            </View>

            <Text style={styles.advice}>
              {forecastData.smart_advice}
            </Text>
          </View>
        )}

        {/* --- UPGRADED RECEIPT SCANNER BUTTON --- */}
        <TouchableOpacity style={styles.button} onPress={handleScanReceipt}>
          <Text style={styles.buttonText}>📷 Scan New Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleAskAI}>
          {/* --- ROAST VS TOAST TOGGLE --- */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 15 }}>
            <TouchableOpacity
              onPress={() => setAiMode("toast")}
              style={{
                backgroundColor: aiMode === "toast" ? '#10B981' : '#334155',
                padding: 10,
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
              }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>🍞 Toast Me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAiMode("roast")}
              style={{
                backgroundColor: aiMode === "roast" ? '#EF4444' : '#334155',
                padding: 10,
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
              }}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>🔥 Roast Me</Text>
            </TouchableOpacity>
          </View>
          {/* --- UPGRADED AI CHAT BUTTON --- */}
          <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={handleAskAI}>
            <Text style={styles.buttonText}>💬 Ask AI Assistant</Text>
          </TouchableOpacity>
          {/* --- AI RESPONSE DISPLAY --- */}
          {aiLoading && (
            <Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 15, fontStyle: 'italic' }}>
              Gemini is analyzing your terrible financial choices...
            </Text>
          )}

          {aiResponse !== "" && !aiLoading && (
            <View style={[styles.card, { backgroundColor: '#334155', marginTop: 15, borderWidth: 1, borderColor: aiMode === 'roast' ? '#EF4444' : '#10B981' }]}>
              <Text style={{ color: '#F8FAFC', fontSize: 16, lineHeight: 24 }}>
                {aiResponse}
              </Text>
            </View>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep slate space background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 25,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    marginVertical: 6,
    letterSpacing: -1,
  },
  advice: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#3B82F6', // Vibrant electric blue
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});