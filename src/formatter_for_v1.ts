import * as vscode from 'vscode';
import { IDictionary, formatInsert, formatDelete } from './formatter';

/**
 * Format top JSON to look good
 * 
 * !!!!!!!!!!!!!!!!!!!
 * TODO
 * !!!!!!!!!!!!!!!!!!!
 * 
 * @param text text of whole document
 * @param document vscode document recieved for formatter
 * @param changes list of changes for vscode formatter
 * @returns index of last changes character - where top json ends
 */
 export function formatTopConfigV1(text: string, document: vscode.TextDocument, changes: vscode.TextEdit[]): number {
    const minimalConfig: IDictionary = {
        'version': 2,
        'width': 80,
        'height': 24,
        'timestamp': Date.now(),
        'env': {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'SHELL': process.env.SHELL || '/bin/bash',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'TERM': process.env.TERM || 'xterm-256color'
        }
    };

    let lastChar = 0;
    const firstOpeningCurlyBracket = text.indexOf('{');
    const firstOpeningSquareBracket = text.indexOf('[');
    if (firstOpeningCurlyBracket === -1 || (firstOpeningSquareBracket !== -1 && firstOpeningSquareBracket < firstOpeningCurlyBracket)) {
        // add default json config on top
        const configText = JSON.stringify(minimalConfig, null, 4) + '\n';
        formatInsert(document, changes, 0, configText);
        lastChar = 0;
    } else {
        // format json config
        let brackets = 1;
        let i = firstOpeningCurlyBracket + 1;
        while (brackets !== 0 && i < text.length) {
            const c = text.charAt(i);
            if (c === '{') { brackets++; }
            if (c === '}') { brackets--; }
            i++;
        }
        let jsonConfigSubstring = text.substring(firstOpeningCurlyBracket, i);
        while (brackets > 0) { jsonConfigSubstring = jsonConfigSubstring + '}'; brackets--; }
        while (brackets < 0) { jsonConfigSubstring = '{' + jsonConfigSubstring; brackets++; }
        const jsonConfig: IDictionary = JSON.parse(jsonConfigSubstring);
        if (jsonConfig === undefined) {
            vscode.window.showInformationMessage('Could\'t format json at the top of file.');
            return 0;
        }
        // check if config has all required fields
        for (let key in minimalConfig) {
            if (jsonConfig[key] === undefined) {
                jsonConfig[key] = minimalConfig[key];
            }
        }
        // add changes
        const configText = JSON.stringify(jsonConfig, null, 4) + '\n';
        formatDelete(document, changes, 0, i + 1);
        formatInsert(document, changes, 0, configText);
        lastChar = i;
    }
    return lastChar;
}

/**
 * Format saved lines of data (asciinema version 2)
 * 
 * !!!!!!!!!!!!!!!!!!
 * TODO
 * !!!!!!!!!!!!!!!!!!
 * 
 * @param text text of whole document
 * @param startChar index of last character of top config
 * @param document vscode document recieved for formatter
 * @param changes list of changes for vscode formatter
 */
export function formatDataV1(text: string, startChar: number, document: vscode.TextDocument, changes: vscode.TextEdit[]) {
}
