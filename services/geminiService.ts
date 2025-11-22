import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';

let genAI: GoogleGenAI | null = null;

if (apiKey) {
  genAI = new GoogleGenAI({ apiKey: apiKey });
}

export const analyzeEntry = async (text: string, title: string): Promise<AiAnalysisResult> => {
  if (!genAI) {
    throw new Error("Gemini API Key is missing. Please check your environment variables.");
  }

  // We use the flash model for fast, cost-effective text analysis
  const modelId = 'gemini-2.5-flash';

  const prompt = `
    I am writing a journal entry about a reading source.
    Title: "${title}"
    Content/Notes: "${text}"

    Please analyze this text. 
    1. Write a concise 1-2 sentence summary of the main ideas captured in the notes.
    2. Generate 3-5 relevant topic tags (single words or short phrases) to categorize this entry.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise summary of the reading notes."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 3-5 relevant tags."
            }
          },
          required: ["summary", "tags"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text) as AiAnalysisResult;
      return result;
    }
    
    throw new Error("No response text received from Gemini.");

  } catch (error) {
    console.error("Error calling Gemini:", error);
    // Fallback in case of error
    return {
      summary: "Could not generate summary at this time.",
      tags: ["Reading"]
    };
  }
};