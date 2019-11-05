"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("../protocol");
const vscode = require("vscode");
const Constants = require("../constants/constants");
const fs_1 = require("fs");
const util_1 = require("util");
const ejs = require("ejs");
const path = require("path");
function readFile(filePath) {
    return util_1.promisify(fs_1.readFile)(filePath);
}
function createMessageProtocol(webview) {
    return {
        sendMessage: message => webview.postMessage(message),
        onMessage: message => webview.onDidReceiveMessage(message)
    };
}
class WebviewPanelController {
    constructor(_vscodeWrapper, uri, title, serverProxy, baseUri) {
        this._vscodeWrapper = _vscodeWrapper;
        this.baseUri = baseUri;
        this._disposables = [];
        this._isDisposed = false;
        this._rendered = false;
        const config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, vscode.Uri.parse(uri));
        const retainContextWhenHidden = config[Constants.configPersistQueryResultTabs];
        const column = this.newResultPaneViewColumn(uri);
        this._disposables.push(this._panel = vscode.window.createWebviewPanel(uri, title, column, {
            retainContextWhenHidden,
            enableScripts: true
        }));
        this._panel.onDidDispose(() => {
            this.dispose();
        });
        this._disposables.push(this._panel.onDidChangeViewState((p) => {
            // occurs when current tab is back in focus
            if (p.webviewPanel.active && p.webviewPanel.visible) {
                this._isActive = true;
                return;
            }
            // occurs when we switch the current tab
            if (!p.webviewPanel.active && !p.webviewPanel.visible) {
                this._isActive = false;
                return;
            }
        }));
        this.proxy = protocol_1.createProxy(createMessageProtocol(this._panel.webview), serverProxy, false);
    }
    newResultPaneViewColumn(queryUri) {
        // Find configuration options
        let config = this._vscodeWrapper.getConfiguration(Constants.extensionConfigSectionName, queryUri);
        let splitPaneSelection = config[Constants.configSplitPaneSelection];
        let viewColumn;
        switch (splitPaneSelection) {
            case 'current':
                viewColumn = this._vscodeWrapper.activeTextEditor.viewColumn;
                break;
            case 'end':
                viewColumn = vscode.ViewColumn.Three;
                break;
            // default case where splitPaneSelection is next or anything else
            default:
                // if there's an active text editor
                if (this._vscodeWrapper.isEditingSqlFile) {
                    viewColumn = this._vscodeWrapper.activeTextEditor.viewColumn;
                    if (viewColumn === vscode.ViewColumn.One) {
                        viewColumn = vscode.ViewColumn.Two;
                    }
                    else {
                        viewColumn = vscode.ViewColumn.Three;
                    }
                }
                else {
                    // otherwise take default results column
                    viewColumn = vscode.ViewColumn.Two;
                }
        }
        return viewColumn;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const sqlOutputPath = path.resolve(__dirname);
            const fileContent = yield readFile(path.join(sqlOutputPath, 'sqlOutput.ejs'));
            const htmlViewPath = ['out', 'src'];
            const baseUri = `${vscode.Uri.file(path.join(this.baseUri, ...htmlViewPath)).with({ scheme: 'vscode-resource' })}/`;
            const formattedHTML = ejs.render(fileContent.toString(), { basehref: baseUri, prod: false });
            this._panel.webview.html = formattedHTML;
        });
    }
    dispose() {
        this._disposables.forEach(d => d.dispose());
        this._isDisposed = true;
    }
    revealToForeground() {
        this._panel.reveal();
    }
    /** Getters */
    /**
     * Property indicating whether the tab is active
     */
    get isActive() {
        return this._isActive;
    }
    /**
     * Property indicating whether the panel controller
     * is disposed or not
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Property indicating whether the angular app
     * has rendered or not
     */
    get rendered() {
        return this._rendered;
    }
    /**
     * Setters
     */
    /**
     * Property indicating whether the angular app
     * has rendered or not
     */
    set rendered(value) {
        this._rendered = value;
    }
}
exports.WebviewPanelController = WebviewPanelController;

//# sourceMappingURL=webviewController.js.map