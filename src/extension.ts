import * as vscode from 'vscode';
import { formatter } from './formatter';
import { commandFixTiming } from './command_fix_timing';
import { commandJoinFiles } from './command_join_files';

export function activate(context: vscode.ExtensionContext) {
	// command
	context.subscriptions.push(vscode.commands.registerCommand(
		'asciinema.fixTiming',	commandFixTiming));
	context.subscriptions.push(vscode.commands.registerCommand(
		'asciinema.joinFiles',	commandJoinFiles));

	// formatter
	vscode.languages.registerDocumentFormattingEditProvider('asciinema.asciicast', formatter);
}

export function deactivate() { }
