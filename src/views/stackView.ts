import * as vscode from "vscode";

function openWebViewPanel(answerHtml: string, answerLink: string, originalError: string){
    const panel = vscode.window.createWebviewPanel(
        "stackOverflowFinder",
        "Stack Overflow Answer",
        vscode.ViewColumn.One, 
        {
            enableScripts: true,
        }
    );
    panel.webview.html = getWebviewContent(answerHtml, answerLink, originalError);

    return panel;

    // panel.webview.onDidReceiveMessage(async (message) => {
    //     if(message.command === "askAI") {
    //         const prompt = message.text;
    //         vscode.commands.executeCommand('smartstacker.askAI', prompt, panel);
    //     }
    // });
}

function getWebviewContent(answerHtml: string, answerLink: string, originalError: string){
    return /*html */ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Stack Overflow Answer</title>
    </head>
    <body>
      <h2>Top Stack Overflow Answer:</h2>
      <div>${answerHtml}</div>
      <p><a href="${answerLink}" target="_blank">View Full Answer on StackOverflow</a></p>
  
      <hr>
  
      <h3>Not satisfied? Chat with AI!</h3>
      <textarea id="followUp" rows="4" cols="50" placeholder="Ask a follow-up question..."></textarea><br>
      <button onclick="askAI()">Ask AI</button>
  
      <h3>AI Response:</h3>
      <div id="aiResponse"></div>
  
      <script>
        const vscode = acquireVsCodeApi();
  
        function askAI() {
          const followUp = document.getElementById('followUp').value;
          vscode.postMessage({ type: 'chat', content: followUp });
        }
  
        window.addEventListener('message', event => {
          const { type, content } = event.data;
          if (type === 'aiAnswer') {
            document.getElementById('aiResponse').innerHTML = content;
          }
        });
      </script>
    </body>
    </html>
    `;
}

export default openWebViewPanel;

/*
<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SmartStacker</title>
      <style>
        body {
          font-family: sans-serif;
          margin: 0;
          padding: 0;
        }
        .stack-answer {
          padding: 10px;
          background: #f9f9f9;
          border-bottom: 2px solid #ddd;
        }
        .chat-container {
          padding: 10px;
          height: 400px;
          overflow-y: auto;
          background: #fff;
        }
        .chat-input {
          display: flex;
          padding: 10px;
          border-top: 2px solid #ddd;
          background: #fafafa;
        }
        .chat-input input {
          flex: 1;
          padding: 8px;
          margin-right: 5px;
        }
        .chat-input button {
          padding: 8px 12px;
        }
        .user-msg {
          text-align: right;
          color: blue;
          margin: 5px 0;
        }
        .ai-msg {
          text-align: left;
          color: green;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="stack-answer">
        <h3>StackOverflow Answer</h3>
        ${answerHtml}
        <p><a href="${answerLink}" target="_blank">View on StackOverflow</a></p>
      </div>
      
      <div class="chat-container" id="chatContainer">
        <!-- Chat messages will appear here -->
      </div>

      <div class="chat-input">
        <input type="text" id="userInput" placeholder="Ask AI something..." />
        <button onclick="sendMessage()">Send</button>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        function sendMessage() {
          const input = document.getElementById('userInput');
          const text = input.value.trim();
          if (text) {
            addMessage('user', text);
            vscode.postMessage({ command: 'askAI', text: text });
            input.value = '';
          }
        }

        function addMessage(sender, text) {
          const container = document.getElementById('chatContainer');
          const div = document.createElement('div');
          div.className = sender === 'user' ? 'user-msg' : 'ai-msg';
          div.textContent = (sender === 'user' ? "You: " : "AI: ") + text;
          container.appendChild(div);
          container.scrollTop = container.scrollHeight;
        }

        window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'aiResponse') {
            addMessage('ai', message.text);
          }
        });
      </script>
    </body>
    </html>
*/ 