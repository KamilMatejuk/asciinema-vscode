import * as vscode from 'vscode';
import { IDictionary, formatInsert, formatDelete } from './formatter';

/**
 * Format top JSON to one line
 * 
 * @param text text of whole document
 * @param document vscode document recieved for formatter
 * @param changes list of changes for vscode formatter
 * @returns index of last changes character - where top json ends
 */
 export function formatTopConfigV2(text: string, document: vscode.TextDocument, changes: vscode.TextEdit[]): number {
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
        const configText = JSON.stringify(minimalConfig) + '\n';
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
        // order config
        const orderedJsonConfig: IDictionary = {};
        for (let key in minimalConfig) {
            orderedJsonConfig[key] = jsonConfig[key];
        }
        for (let key in jsonConfig) {
            if (!(key in orderedJsonConfig)) {
                orderedJsonConfig[key] = jsonConfig[key];
            }
        }
        // add changes
        const configText = JSON.stringify(orderedJsonConfig).replace(/,/g, ', ').replace(/:/g, ': ') + '\n';
        formatDelete(document, changes, 0, i + 1);
        formatInsert(document, changes, 0, configText);
        lastChar = i;
    }
    return lastChar;
}

/**
 * Format saved lines of data (asciinema version 2)
 * @param text text of whole document
 * @param startChar index of last character of top config
 * @param document vscode document recieved for formatter
 * @param changes list of changes for vscode formatter
 */
export function formatDataV2(text: string, startChar: number, document: vscode.TextDocument, changes: vscode.TextEdit[]) {
    // find max width of segments
    let i = startChar > 0 ? startChar - 1 : 0;
    let maxNumberLength = 0;
    let maxTypeLength = 0;
    while (i < text.length) {
        const c = text.charAt(i);
        if (c === '[') {
            // find number
            let number = (text.substring(i).match(/[0-9.]+/g) || ['0'])[0];
            let numberStart = i + text.substring(i + 1).indexOf(number) + 1;
            let numberEnd = numberStart + number.length;
            maxNumberLength = Math.max(maxNumberLength, number.indexOf('.'));
            // find type
            let type = (text.substring(numberEnd).match(/["]+[^"]*["]+/g) || ['"o"'])[0];
            let typeStart = numberEnd + text.substring(numberEnd + 1).indexOf(type) + 1;
            let typeEnd = typeStart + type.length;
            maxTypeLength = Math.max(maxTypeLength, type.length);
            // find saved text
            let savedTextStart = typeEnd + text.substring(typeEnd + 1).search(/["']{1}/g) + 1;
            let savedTextEnd = savedTextStart + text.substring(savedTextStart + 1).search(/[^\\]{1}["']{1}/g) + 3;
            i = savedTextEnd;
        }
        i++;
    }
    // format lines
    i = startChar > 0 ? startChar - 1 : 0;
    let prevTime = 0;
    while (i < text.length) {
        const c = text.charAt(i);
        if (c === '[') {

            // remove spaces before line
            let charNumber = document.positionAt(i).character;
            if (charNumber !== 0) {
                let prevBracket = text.substring(i - charNumber, i).lastIndexOf(']');
                if(prevBracket === -1) {
                    formatDelete(document, changes, i - charNumber, i);
                } else {
                    formatDelete(document, changes, i - charNumber + prevBracket + 1, i);
                    formatInsert(document, changes, i, '\n');
                }
            }

            // time
            let number = (text.substring(i).match(/[0-9.]+/g) || ['0'])[0];
            let numberStart = i + text.substring(i + 1).indexOf(number) + 1;
            let numberEnd = numberStart + number.length;
            let paddingStart = maxNumberLength - (numberStart - i + number.indexOf('.') - 1);
            if (paddingStart > 0) {
                formatInsert(document, changes, numberStart, Array(paddingStart).fill(' ').join(''));
            } else if (paddingStart < 0) {
                formatDelete(document, changes, i + 1, i + 1 - paddingStart);
            }
            let paddingEnd = 6 - (number.length - number.indexOf('.') - 1);
            if (paddingEnd > 0) {
                formatInsert(document, changes, numberEnd, Array(paddingEnd).fill(0).join(''));
            }

            // type
            let type = (text.substring(numberEnd).match(/["]+[^"]*["]+/g) || ['"o"'])[0];
            let typeStart = numberEnd + text.substring(numberEnd + 1).indexOf(type) + 1;
            let typeEnd = typeStart + type.length;
            if (text.substring(numberEnd, typeStart) !== ', ') {
                formatDelete(document, changes, numberEnd, typeStart);
                formatInsert(document, changes, typeStart, ', ');
            }
            if (type.length < maxTypeLength) {
                formatInsert(document, changes, typeStart, Array(maxTypeLength - type.length).fill(' ').join(''));
            }

            // saved text
            let savedTextStart = typeEnd + text.substring(typeEnd + 1).search(/["']{1}/g) + 1;
            let savedTextEnd = savedTextStart + text.substring(savedTextStart + 1).search(/[^\\]{1}["']{1}/g) + 3;
            if (text.substring(typeEnd, savedTextStart) !== ', ') {
                formatDelete(document, changes, numberEnd, typeStart);
                formatInsert(document, changes, typeStart, ', ');
            }

            // remove spaces after line
            let closingBracket = savedTextEnd + text.substring(savedTextEnd).indexOf(']') + 1;
            if ((closingBracket - savedTextEnd - 1) !== 0) {
                formatDelete(document, changes, savedTextEnd, closingBracket - 1);
            }

            i = savedTextEnd;
        }
        i++;        
    }
}