import * as vscode from "vscode";
import axios from "axios";
import path from "path";
import * as dotenv from "dotenv";
// dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/*
 TypeError: Cannot read properties of undefined (reading 'foo')
 An expression of type 'void' cannot be tested for truthiness.ts(1345)
 Type 'string | undefined' is not assignable to type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.ts(2322)
*/

const STACK_EXCHANGE_API_KEY = process.env.APIKEY;

console.log("API:", STACK_EXCHANGE_API_KEY);

// Search stack overflow for Error
export async function searchStackflow(errMessage: string){
    const query = encodeURIComponent(errMessage); 
    const apiUrl = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${query}&site=stackoverflow&filter=!9_bDDxJY5&key=${STACK_EXCHANGE_API_KEY}`;
    try{
        const response = await axios.get(apiUrl);
        const topResult = response.data.items?.[0];

        if(topResult){
            return {
                link: topResult.link,
                title: topResult.title,
                questionId: topResult.question_id,
                body:topResult.body,
                errMsg:errMessage,
            };
        } else {

            const askAI = await vscode.window.showInformationMessage(
                "No relevent answer found.",
                "Ask AI",
                "cancle",
            );

            if (askAI === "Ask AI"){
                openAIWebview(errMessage);
            }

            return;
        }

    } catch (err){
        console.error(`Stack Overflow API Error:, ${err}`);
        vscode.window.showErrorMessage("Error Fetching Data from Stack Overflow");
        return null;
    }
}

// Fetch answer for the error
export async function getTopAnswer( questionId: number){
    const apiUrl = `https://api.stackexchange.com/2.3/questions/${questionId}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody&key=${STACK_EXCHANGE_API_KEY}`;
    try{
        const response = await axios.get(apiUrl);
        const topAnswer = response.data.items?.[0];

        if(topAnswer) {
            return {
                body: topAnswer.body,
                answerLink: `https://stackoverflow.com/a/${topAnswer.answer_id}`,
            };
        } else {
            vscode.window.showInformationMessage("No answer found for this question.");
            return null;
        }
    } catch(err) {
        console.error("Error Fetching Answer: ", err);
        vscode.window.showErrorMessage("Error Fetching answer from Stack Overflow");
        return null;
    }
}

// vs webview window for stack
function openWebViewPanel(answerHtml: string, answerLink: string) {
    const panel = vscode.window.createWebviewPanel(
        "stackOverflowFinder",
        "Stack Overflow Answer",
        vscode.ViewColumn.One, 
        {enableScripts: true}
    );

    panel.webview.html = 
    /*html */
    `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Stack Overflow Answer</title>
            <style>
                body { font-family: sans-serif; padding: 16px; }
                pre { background-color:rgb(40, 40, 40); padding: 10px; border-radius: 4px; }
                /*
                code { background-color: #eee; padding: 2px 4px; border-radius: 4px; }
                */
            </style>
        </head>
        <body>
            <h2>Top Answer</h2>
            <div>${answerHtml}</div>
            <p><a href="${answerLink}" target="_blank">🔗 View on Stack Overflow</a></p>
        </body>
        </html>
    `;
}
// ___________________________________________________________

// vs webviwe window for AI chat
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

    async function askOllama(prompt: string) : Promise<string> {
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

// Start/entry for the extension
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('searchStackOverflow', async () => {
        const editor = vscode.window.activeTextEditor;
        if(!editor){
            vscode.window.showInformationMessage("Open a file to use Stack Overflow Finder.");
            return;
        }

        const errMessage = await getErrorMessage();
        if(errMessage) {
            vscode.window.showInformationMessage(`Searching Stack Overflow for: ${errMessage}`);

            const result = await searchStackflow(errMessage);
            if(result){
                openWebViewPanel(result.body, result.link);
            } else {

            }
        } else {
            vscode.window.showInformationMessage("No error message found to search.");
        }
    });

    context.subscriptions.push(disposable);
}

async function getErrorMessage(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (selectedText && selectedText.length > 10) {
            return selectedText;
        }
    }

    return await vscode.window.showInputBox({
        prompt: "Enter or paste an error message to search on Stack Overflow",
        placeHolder: "e.g. TypeError: Cannot read properties of undefined",
    }) ?? null;
}