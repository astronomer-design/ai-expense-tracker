import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
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
      const response = await fetch(`http://127.0.0.1:8000/users/1/chat?query=${question}&mode=${aiMode}`);
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

        {/* --- BRAND NEW PREDICTIVE FORECAST CARD --- */}
        <View style={[styles.card, { backgroundColor: '#1E293B' }]}>
          <Text style={[styles.cardTitle, { color: '#94A3B8' }]}>🔮 Next Week's Forecast</Text>
          <Text style={[styles.score, { color: '#FFFFFF' }]}>
            ${(forecastData?.predicted_7_day_spend || 0).toFixed(2)}
          </Text>
          <Text style={{ color: '#FBBF24', fontWeight: 'bold', marginBottom: 5 }}>
            {forecastData?.status_flag} (Velocity: ${forecastData?.daily_velocity}/day)
          </Text>
          <Text style={[styles.advice, { color: '#CBD5E1' }]}>
            {forecastData?.smart_advice}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>${(dashboardData?.total_spent || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Categories</Text>
            <Text style={styles.statValue}>
              {Object.keys(dashboardData?.category_breakdown || {}).length}
            </Text>
          </View>
        </View>

        {/* Wired up the Scanner Button! */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleScanReceipt}>
          <Text style={styles.primaryButtonText}>📸 Scan New Receipt</Text>
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
          <Text style={styles.secondaryButtonText}>💬 Ask AI Assistant</Text>
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
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  scrollContent: { padding: 20, paddingTop: 40 },
  header: { marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 16, color: '#64748B', marginTop: 5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#475569' },
  score: { fontSize: 48, fontWeight: 'bold', color: '#10B981', marginVertical: 10 },
  advice: { fontSize: 14, color: '#64748B', textAlign: 'center', fontStyle: 'italic' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { backgroundColor: '#FFFFFF', width: '48%', borderRadius: 15, padding: 20, alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#64748B', marginBottom: 5 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  primaryButton: { backgroundColor: '#3B82F6', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#E2E8F0', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  secondaryButtonText: { color: '#1E293B', fontSize: 18, fontWeight: '600' },
});