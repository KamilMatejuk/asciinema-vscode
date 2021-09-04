import * as vscode from 'vscode';
import { formatTopConfigV1, formatDataV1 } from './formatter_for_v1';
import { formatTopConfigV2, formatDataV2 } from './formatter_for_v2';

export interface IDictionary {
    [index:string]: string|number|object;
}

/**
 * Insert text
 * @param document vscode document recieved for formatter
 * @param changes list of changes for vscode formatter
 * @param start where to insert test
 * @param text what text to insert
 */
export function formatInsert(document: vscode.TextDocument, changes: vscode.TextEdit[], start: number, text: string) {
    changes.push(vscode.TextEdit.insert(document.positionAt(start), text));
}

/**
 * Delete text
 * @param document vscode document recieved for formatter
 * @param changes list of changes for vscode formatter
 * @param start where to start deletion part
 * @param end where to end deletion part
 */
export function formatDelete(document: vscode.TextDocument, changes: vscode.TextEdit[], start: number, end: number) {
    changes.push(vscode.TextEdit.delete(new vscode.Range(
        document.positionAt(start),
        document.positionAt(end)
    )));
}

/**
 * Check version of file
 * @param text text of whole document
 */
function checkVersion(text: string): number {
    let lastChar = 0;
    let versionText = (text.match(/"version":[ ]*[0-9]+/g) || ['"version": 2'])[0];
    return parseInt(versionText.replace('"version":', ''));
}

const formatter = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        const text = document.getText();
        const changes: vscode.TextEdit[] = [];
        // TODO sprawdzić wersję i uruchomić poprawne formatowanie dla wersji
        const version = checkVersion(text);
        if (version === 1) {
            const lastChar = formatTopConfigV1(text, document, changes);
            formatDataV1(text, lastChar, document, changes);
        } else if (version === 2) {
            const lastChar = formatTopConfigV2(text, document, changes);
            formatDataV2(text, lastChar, document, changes);
        } else {
            vscode.window.showInformationMessage(`Unknown version: ${version}`);
        }
        return changes;
    }
};
export { formatter };