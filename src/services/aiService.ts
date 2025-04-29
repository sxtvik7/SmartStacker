import * as vscode from "vscode";


export default async function askOllama(prompt: string) : Promise<string> {
    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            model: 'deepseek-r1:1.5b', //model 
            prompt,
            stream: false
        })
    });
    
    if(response.ok) {
        const data = await response.json() as {response: string}; 
        return data.response;
    } else {
        vscode.window.showErrorMessage("AI request failed");
        return "Sorry, the AI request failed";
    }
}
