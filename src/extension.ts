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
	context.subscriptions.push(vscode.commands.registerCommand(
		'asciinema.convertToVersion',	commandJoinFiles)); // dropdown menu to select to which version convert (withoit current)

	// formatter
	vscode.languages.registerDocumentFormattingEditProvider('asciinema.asciicast', formatter);
}

export function deactivate() { }
