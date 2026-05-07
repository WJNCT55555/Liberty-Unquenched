import { GoogleGenAI } from "@google/genai";
import { GameState } from "../game/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getStrategicAdvice = async (state: GameState): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    return "AI Advisor: API Key not configured. Please add GEMINI_API_KEY in settings.";
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are a strategic advisor for the CNT-FAI during the Spanish Civil War (1931-1939).
    Current Game State:
    - Year: ${state.year}, Month: ${state.month}
    - Phase: ${state.phase}
    - Resources: ${state.resources}, Armaments: ${state.armaments}
    - Economy: ${state.stats.economy}%
    - Army Loyalty: ${state.stats.armyLoyalty}%
    - Political Tension: ${state.stats.tension}%
    - Worker Control: ${state.stats.workerControl}%
    - Popular Front Unity: ${state.popularFrontUnity}%
    - Civil War Status: ${state.civilWarStatus}
    - War Progress: ${state.warProgress}%
    
    Factions:
    - Faistas (Radicals): Influence ${state.factions.Faistas.influence}, Dissent ${state.factions.Faistas.dissent}
    - Cenetistas (Moderates): Influence ${state.factions.Cenetistas.influence}, Dissent ${state.factions.Cenetistas.dissent}
    
    Relations:
    - USSR: ${state.relations.ussr}
    - France: ${state.relations.france}
    - UK: ${state.relations.uk}
    
    Based on this state, provide a concise (max 100 words) strategic recommendation in ${state.language === 'zh' ? 'Chinese' : 'English'}. 
    Focus on immediate priorities and potential risks. Be thematic and historical.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "The advisor is silent...";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "The advisor is currently unavailable due to communication issues.";
  }
};
