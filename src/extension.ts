import * as vscode from "vscode";
import path from "path";
import * as dotenv from "dotenv";
// dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import openWebViewPanel from "./views/stackView";
import getErrorMessage from "./utils/getError";
import searchStackflow, { getTopAnswer } from "./services/stackService";
import askOllama from "./services/aiService";


/*
 TypeError: Cannot read properties of undefined (reading 'foo')	
 An expression of type 'void' cannot be tested for truthiness.ts(1345)
 Type 'string | undefined' is not assignable to type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.ts(2322)
*/

export const STACK_EXCHANGE_API_KEY = process.env.APIKEY;


// Start/entry for the extension
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('searchStackOverflow', async () => {
		const errorMessage = await getErrorMessage();
		if(!errorMessage){
			vscode.window.showErrorMessage("No Error message provided");
			return;
		}
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: 'Searching Stack Overflow...',
			cancellable: false,
		}, async () => {
			const searchResults = await searchStackflow(errorMessage);
			const topAnswer = await getTopAnswer(searchResults?.questionId);

			if(topAnswer) {
				const panel = openWebViewPanel(topAnswer.body,  searchResults?.link, errorMessage);

				panel.webview.onDidReceiveMessage(async (message) => {
					if(message.type === 'chat') {
						const followUpQuestion = message.content;
						const aiPrompt = `Original Error: ${errorMessage}\n\nUser Follow-up: ${followUpQuestion}\n\nYou are an assistant that answers error-related queries.
						ONLY provide direct and clear answers without "thinking" or "analyzing" out loud.
						Write short, helpful, developer-friendly responses.
						Always stay professional and precise.`;
						const aiAnswer = await askOllama(aiPrompt);

						// const aiAnswer = await getFinalAIResponse(aiPrompt);

						panel.webview.postMessage({type: 'aiAnswer', content: aiAnswer});
					}
				});
			} else {
				vscode.window.showInformationMessage('No Stack Overflow answer found. You can ask AI directly.');
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate(){}
