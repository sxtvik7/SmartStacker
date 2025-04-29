import * as vscode from "vscode";

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

export default getErrorMessage;