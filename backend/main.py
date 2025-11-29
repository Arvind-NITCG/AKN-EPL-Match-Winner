import pandas as pd
import pickle
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from catboost import CatBoostClassifier
import numpy as np
import os

# ==========================================
# 1. SETUP & CONFIGURATION
# ==========================================
app = FastAPI(title="EPL Prediction AI", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
df = None
team_strengths = None
form_columns = []

# --- DICTIONARY: User Input -> Dataset Name ---
TEAM_NAME_MAP = {
    "manchester city": "Man City",
    "man city": "Man City",
    "manchester united": "Man United",
    "man united": "Man United",
    "utd": "Man United",
    "nottingham forest": "Nott'm Forest",
    "nottm forest": "Nott'm Forest",
    "wolves": "Wolves",
    "wolverhampton": "Wolves",
    "sheffield united": "Sheffield United",
    "sheffield": "Sheffield United",
    "qpr": "QPR",
    "queens park rangers": "QPR",
    "brighton and hove albion": "Brighton",
    "west ham united": "West Ham",
    "tottenham hotspur": "Tottenham",
    "spurs": "Tottenham"
}

def normalize_name(name: str):
    """Converts user input to the exact name in our CSV."""
    clean_name = name.lower().strip()
    # 1. Check dictionary
    if clean_name in TEAM_NAME_MAP:
        return TEAM_NAME_MAP[clean_name]
    
    # 2. Check if it's already a valid name in the CSV (case insensitive)
    # (Assuming we loaded 'df' globally)
    if df is not None:
        valid_teams = df['HomeTeam'].unique()
        for valid in valid_teams:
            if clean_name == valid.lower():
                return valid
                
    # 3. Return as is (hoping for the best)
    return name.title() # "arsenal" -> "Arsenal"

# ==========================================
# 2. LOAD RESOURCES
# ==========================================
@app.on_event("startup")
def load_artifacts():
    global model, df, team_strengths, form_columns
    print("🚀 Starting AI Engine...")

    # --- 1. DEFINE PATHS (The Professional Way) ---
    # Get the current folder where main.py is located
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Construct paths to your new folders
    MODEL_PATH = os.path.join(BASE_DIR, "models", "pure_catboost_assets.pkl")
    DATA_PATH = os.path.join(BASE_DIR, "data", "full_feature_dataset_expanded.csv")
    STRENGTH_PATH = os.path.join(BASE_DIR, "models", "final_strength_ratings.pkl")

    # --- A. Load the Model ---
    try:
        with open(MODEL_PATH, "rb") as f:  # <--- USE MODEL_PATH
            assets = pickle.load(f)
        model = assets['model'] if isinstance(assets, dict) and 'model' in assets else assets
        print(f"✅ Loaded Model from {MODEL_PATH}")

    except Exception as e:
        print(f"❌ Critical Error loading Model: {e}")

    # --- B. Load the Dataset ---
    try:
        df = pd.read_csv(DATA_PATH)  # <--- USE DATA_PATH
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
        df = df.sort_values(by='Date')
        form_columns = [col for col in df.columns if 'form' in col or 'win_pct' in col]
        print(f"✅ Loaded Dataset from {DATA_PATH}")
    except Exception as e:
        print(f"❌ Error loading CSV: {e}")

    # --- C. Load Team Strengths ---
    try:
        with open(STRENGTH_PATH, "rb") as f:  # <--- USE STRENGTH_PATH
            team_strengths = pickle.load(f)
        print("✅ Loaded Strength Ratings.")
    except:
        team_strengths = {}

# ==========================================
# 3. PREDICTION LOGIC
# ==========================================
class MatchRequest(BaseModel):
    home_team: str
    away_team: str
    home_rank: int
    away_rank: int

def build_features(req: MatchRequest):
    home = normalize_name(req.home_team)
    away = normalize_name(req.away_team)
    
    h_rows = df[df['HomeTeam'] == home]
    a_rows = df[df['AwayTeam'] == away]
    
    # --- FALLBACK LOGIC ---
    if h_rows.empty or a_rows.empty:
        raise ValueError("NO_HISTORY") # Trigger the rank-based fallback
        
    latest_home_game = h_rows.iloc[-1]
    latest_away_game = a_rows.iloc[-1]
    
    features = {
        'HomeTeam': home,
        'AwayTeam': away,
        'Season': '2024-2025',
        'HomeTeam_League_Rank': req.home_rank, # Trust User Input
        'AwayTeam_League_Rank': req.away_rank, # Trust User Input
        'HomeTeam_Strength': team_strengths.get(home, latest_home_game.get('HomeTeam_Strength', 1500)),
        'AwayTeam_Strength': team_strengths.get(away, latest_away_game.get('AwayTeam_Strength', 1500))
    }
    
    # Inject Form
    for col in form_columns:
        if col in latest_home_game:
            if col.startswith("H_"): features[col] = latest_home_game[col]
            elif col.startswith("A_"): features[col] = latest_away_game[col]
            else: features[col] = latest_home_game[col]

    # Hotfixes
    features['H2H_draw_pct'] = latest_home_game.get('H2H_draw_pct', 0.25)
    features['Avg_Odds_H'] = latest_home_game.get('Avg_Odds_H', 2.5)
    features['Avg_Odds_D'] = latest_home_game.get('Avg_Odds_D', 3.2)
    features['Avg_Odds_A'] = latest_home_game.get('Avg_Odds_A', 2.5)

    return pd.DataFrame([features])

# Replace the predict_match function in main.py with this:

# Replace ONLY the predict_match function in main.py

@app.post("/predict")
def predict_match(req: MatchRequest):
    normalized_home = normalize_name(req.home_team)
    normalized_away = normalize_name(req.away_team)

    try:
        # 1. Build & Sort Features
        input_vector = build_features(req)
        # Ensure we have the model's feature names
        if hasattr(model, 'feature_names_'):
            input_vector = input_vector[model.feature_names_] 
        
        # 2. Get Probabilities
        probs = model.predict_proba(input_vector)[0]
        classes = list(model.classes_)
        
        # 3. Map Probabilities (Dynamic Safety)
        try:
            idx_h = classes.index("H")
            idx_a = classes.index("A")
            idx_d = classes.index("D")
        except ValueError:
            # Fallback if classes are named differently (e.g. 0, 1, 2)
            idx_h, idx_d, idx_a = 2, 1, 0 # Standard CatBoost default order fallback
        
        prob_home = probs[idx_h]
        prob_away = probs[idx_a]
        prob_draw = probs[idx_d]

        print(f"🧐 DEBUG: {normalized_home} vs {normalized_away} | P: {probs}")

        # 4. Check for NaNs (Ghost Data)
        if np.isnan(prob_home) or np.isnan(prob_away):
            raise ValueError("Model Output Corrupted (NaN)")

        # 5. Determine Winner
        if prob_home > prob_away and prob_home > prob_draw:
            winner_code = "H"
        elif prob_away > prob_home and prob_away > prob_draw:
            winner_code = "A"
        else:
            winner_code = "D"

        return{
            "prediction": str(winner_code),
            "probabilities": {
                "Home": round(prob_home * 100, 1),
                "Draw": round(prob_draw * 100, 1),
                "Away": round(prob_away * 100, 1)
            }
        }
        
    except ValueError as e:
        # Handles known issues like Missing History or NaN
        err_msg = str(e)
        print(f"⚠️ Handled Error: {err_msg}")
        
        if "NO_HISTORY" in err_msg or "NaN" in err_msg:
            # Rank-based fallback
            h_rank = req.home_rank
            a_rank = req.away_rank
            
            # Create Fake Probabilities based on Rank
            if h_rank < a_rank: 
                return {"prediction": "H", "probabilities": {"Home": 60.0, "Draw": 25.0, "Away": 15.0}}
            elif a_rank < h_rank: 
                return {"prediction": "A", "probabilities": {"Home": 15.0, "Draw": 25.0, "Away": 60.0}}
            else: 
                return {"prediction": "D", "probabilities": {"Home": 33.0, "Draw": 34.0, "Away": 33.0}}
        else:
            # CRITICAL: If it's some other ValueError, DON'T be silent! Raise it!
            raise HTTPException(status_code=500, detail=f"Unhandled ValueError: {err_msg}")

    except Exception as e:
        # Handles unexpected crashes
        print(f"🔥 CRITICAL FAILURE: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")