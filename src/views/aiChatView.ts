import * as vscode from "vscode";
import askOllama from "../services/aiService";

function openAIWebview(errMessage: string){
    const panel = vscode.window.createWebviewPanel(
        "aiAssistant",
        "SmartStacker AI Chat",
        vscode.ViewColumn.One,
        {
            enableScripts:true,
            retainContextWhenHidden: true,
        },
    );

    

    panel.webview.html = getAIChatHTML(errMessage);

    panel.webview.onDidReceiveMessage(
        async(message) => {
            if(message.type === "ask") {
                const userInput = message.question;

                const fullPrompt = `Error: ${errMessage}\n\nUser follow-u: ${userInput}`;

                const aiResponse = await askOllama(fullPrompt);

                panel.webview.postMessage({
                    type: "response",
                    answer: aiResponse,
                });
            }
        }
    );
}

// AI chat HTML
function getAIChatHTML(errorMessage: string): string {
	return /* html */`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>SmartStacker AI Chat</title>
			<style>
				body { font-family: sans-serif; padding: 16px; }
				textarea { width: 100%; height: 120px; margin-top: 10px; }
				button { margin-top: 10px; padding: 6px 12px; }
			</style>
		</head>
		<body>
			<h2>SmartStacker AI Assistant</h2>
			<p>Error: <strong>${errorMessage}</strong></p>
			<textarea id="userInput" placeholder="Add more context or ask a follow-up..."></textarea>
			<br/>
			<button onclick="sendToAI()">Send</button>
			<div id="response"></div>

			<script>
				const vscode = acquireVsCodeApi();

				function sendToAI() {
					const input = document.getElementById("userInput").value;
					vscode.postMessage({ type: "ask", question: input });
				}

				window.addEventListener("message", event => {
					const { type, answer } = event.data;
					if (type === "answer") {
						document.getElementById("response").innerHTML = "<pre>" + answer + "</pre>";
					}
				});
			</script>
		</body>
		</html>
	`;
}

export default openAIWebview;