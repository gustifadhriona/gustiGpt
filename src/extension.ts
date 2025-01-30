
import * as vscode from 'vscode';
import ollama from 'ollama';
import { text } from 'stream/consumers';

export function activate(context: vscode.ExtensionContext) {
	

	const disposable = vscode.commands.registerCommand('gustiseek-ext.gustiGpt', () => {
		
		const panel = vscode.window.createWebviewPanel(
			'gustiGpt',
			'Tanya GustiGPT',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);
		
		panel.webview.html = getWebViewContent();

		panel.webview.onDidReceiveMessage(async (message:any) => {
			if (message.command === 'chat'){
				const userPrompt = message.text;
				let responseText = '';

				try{
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:7b',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true,
					});

					for await (const part of streamResponse){
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText });
					}
				} catch (err) {
					console.error('Ollama Error:', err);
					vscode.window.showErrorMessage(`Ollama Error: ${err}`);
				}
			}

		});
	});

	context.subscriptions.push(disposable);
}

function getWebViewContent(): string {
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<style>
				body { font-family: sans-serif; margin: 1rem; }
				#prompt { width: 100%; box-sizing: border-box; }
				#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0,5rem; }
			</style>
		</head>
		<body>
			<h2>GustiGPT</h2>
			<textarea id="prompt" rows="3" placeholder="Apa masalahnya..."></textarea>
			<button id="askBtn">Tanya</button>
			<div id="response"></div>

			<script>
				const vscode = acquireVsCodeApi();

				document.getElementById('askBtn').addEventListener('click', () => {
					const text = document.getElementById('prompt').value;
					vscode.postMessage({ command: 'chat', text });
				});

				window.addEventListener('message', event => {
					const { command, text} = event.data;
					if ( command === 'chatResponse'){
						document.getElementById('response').innerText = text;
					}
				})
			</script>
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
