import axios from "axios";
import path from "path";
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function askOpenRouter(prompt: string) : Promise<string> {
    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", 
            {
                model: "deepseek/deepseek-r1:free",
                messages : [
                    {
                        role: "system",
                        content: "You are an assistant that answers programming errors and code questions clearly and concisely."
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }, 
            {
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "X-Title": "SmartStacker",
                },
            }
        );
        console.log(response);
        return response.data.choices?.[0]?.message?.content || "No response from OpenRouter";
    } catch (err) {
        console.error("Error using OpenRouter: ", err);
        return "Failed to get response from OpenRouter.";
    }
}
