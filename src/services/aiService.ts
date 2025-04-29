import axios from "axios";
import * as vscode from "vscode";


export async function askOllama(prompt: string) : Promise<string> {
    try{
        const response = await fetch("http://localhost:11434/api/generate", {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                model: 'deepseek-coder',
                prompt, 
                stream: false
            })
        });

        const data = await response.json() as {response: string};
        return data.response || "No response from Ollama";
    } catch(err) {
        console.error("Error asking Ollama");
        return "Failed to fetch from Ollama";
    }
}


export async function refineWithGemini(rawOllamaResponse: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment.');
    };

    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

    console.log(`Sending request to: ${geminiEndpoint}?key=${apiKey}`);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an assistant that refines AI responses for developers. Gi ven the following raw AI response, make it short, clear, and only output the final helpful answer without any thinking or analysis.\n\nRaw response:\n\n${rawOllamaResponse}`
            }
          ]
        }
      ]
    };

    const response = await axios.post(`${geminiEndpoint}?key=${apiKey}`, requestBody);

    const finalAnswer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return finalAnswer || 'No refined response received from Gemini.';
  } catch (error) {
    console.error('Error refining with Gemini:', error);
    return 'Failed to refine response with Gemini.';
  }
}


export async function getFinalAIResponse(errorPrompt: string): Promise<string>{
    const OllamaRaw = await askOllama(errorPrompt);
    const refinedAnswer = await refineWithGemini(OllamaRaw);
    return refinedAnswer;
}