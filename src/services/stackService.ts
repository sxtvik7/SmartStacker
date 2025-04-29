import * as vscode from "vscode";
 import axios from "axios";
import { STACK_EXCHANGE_API_KEY } from "../extension";
import openAIWebview from "../views/aiChatView";


// Search stack overflow for Error
 export default async function searchStackflow(errMessage: string){
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
