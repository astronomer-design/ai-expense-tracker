import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // <-- We added the image picker!

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/users/1/dashboard');
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    const question = "How much did I spend on food?";
    try {
      const response = await fetch(`http://127.0.0.1:8000/users/1/chat?query=${question}`);
      const data = await response.json();

      if (Platform.OS === 'web') {
        window.alert("🤖 Financial AI Assistant\n\n" + data.response);
      } else {
        Alert.alert("🤖 Financial AI Assistant", data.response);
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert("Error connecting to AI.");
      else Alert.alert("Error", "Could not connect to the AI.");
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
        const response = await fetch('http://127.0.0.1:8000/upload-receipt/', {
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
          <Text style={styles.secondaryButtonText}>💬 Ask AI Assistant</Text>
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