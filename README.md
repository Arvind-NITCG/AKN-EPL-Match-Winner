# ⚽ Match Winner AI: EPL Predictor

![React](https://img.shields.io/badge/Frontend-React-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green) ![CatBoost](https://img.shields.io/badge/AI-CatBoost-orange)

**Match Winner** is a full-stack AI application that predicts English Premier League match outcomes with high precision. Unlike standard predictors, it utilizes a **"Time-Machine" architecture** to prevent data leakage and incorporates live Elo ratings for dynamic accuracy.

---

## 🚀 Key Engineering Features

### 🧠 1. The "Time-Machine" Architecture (Anti-Leakage)
Many ML projects fail due to *Look-Ahead Bias* (using future stats like "Shots on Target" to predict the match result). 
- **My Solution:** I engineered a feature extraction pipeline that only sees historical data (Form, H2H, Past Ranks) available *before* kick-off.
- **Result:** A realistic, deployable model that simulates true forecasting.

### 🛡️ 2. Dynamic Fallback & Safety Nets
Real-world data is messy. The backend features a robust safety system:
- **Typo-Correction:** Automatically maps user inputs (e.g., "Man City" vs "Manchester City").
- **Cold Start Handling:** If teams have no H2H history, the system gracefully falls back to a **Rank-Based Heuristic** calculation.
- **Ghost Data Protection:** Catches `NaN` outputs caused by library version mismatches before they crash the frontend.

### ⚡ 3. Real-Time Interactive UI
Built with **React + Tailwind CSS**, focusing on Glassmorphism design principles:
- **Scroll-Locked Interface:** Prevents rubber-banding for a native-app feel.
- **Dynamic Visualization:** Custom SVG Donut charts and animation physics (Framer Motion).
- **Live Asset Loading:** Dynamically loads team logos based on dataset mapping.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Framer Motion, Axios
- **Backend:** FastAPI (Python), Uvicorn
- **Machine Learning:** CatBoost Classifier, Scikit-Learn, Pandas
- **Data Engineering:** Temporal Feature Sorting, Rolling Window Aggregation

---

## 📸 Screenshots

**
*![alt text](<Screenshot 2025-11-29 104041.png>)*

---

## 🏃‍♂️ How to Run

1. **Clone the Repo**
   ```bash
   git clone https://github.com/Arvind-NITCG/AKN-EPL-Match-Winner.git
2. **Start Backend**
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
3. **Start Frontend**
   cd frontend
   npm install
   npm start

## Created By Arvind K N , Second Year Computer Science Student at National Institute Of Technology Calicut.
