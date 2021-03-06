/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

// tslint:disable:no-any
import { DisposableCollection } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { EditorPreferenceChange, EditorPreferences, EditorDecorationsService, TextEditor, DiffNavigator } from '@theia/editor/lib/browser';
import { DiffUris } from '@theia/editor/lib/browser/diff-uris';
import { inject, injectable } from 'inversify';
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient';

import { MonacoCommandServiceFactory } from './monaco-command-service';
import { MonacoContextMenuService } from './monaco-context-menu';
import { MonacoDiffEditor } from './monaco-diff-editor';
import { MonacoDiffNavigatorFactory } from './monaco-diff-nagivator-factory';
import { MonacoEditor } from './monaco-editor';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoEditorService } from './monaco-editor-service';
import { MonacoQuickOpenService } from './monaco-quick-open-service';
import { MonacoTextModelService } from './monaco-text-model-service';
import { MonacoWorkspace } from './monaco-workspace';
import { ThemeService } from '@theia/core/lib/browser/theming';

import IEditorOverrideServices = monaco.editor.IEditorOverrideServices;

function changeTheme(editorTheme: string | undefined) {
    const monacoTheme = editorTheme || 'vs-dark';
    monaco.editor.setTheme(monacoTheme);
    document.body.classList.add(monacoTheme);
}
changeTheme(ThemeService.get().getCurrentTheme().editorTheme);
ThemeService.get().onThemeChange(event => changeTheme(event.newTheme.editorTheme));

@injectable()
export class MonacoEditorProvider {

    constructor(
        @inject(MonacoEditorService) protected readonly editorService: MonacoEditorService,
        @inject(MonacoTextModelService) protected readonly textModelService: MonacoTextModelService,
        @inject(MonacoContextMenuService) protected readonly contextMenuService: MonacoContextMenuService,
        @inject(MonacoToProtocolConverter) protected readonly m2p: MonacoToProtocolConverter,
        @inject(ProtocolToMonacoConverter) protected readonly p2m: ProtocolToMonacoConverter,
        @inject(MonacoWorkspace) protected readonly workspace: MonacoWorkspace,
        @inject(MonacoCommandServiceFactory) protected readonly commandServiceFactory: MonacoCommandServiceFactory,
        @inject(EditorPreferences) protected readonly editorPreferences: EditorPreferences,
        @inject(MonacoQuickOpenService) protected readonly quickOpenService: MonacoQuickOpenService,
        @inject(EditorDecorationsService) protected readonly decorationsService: EditorDecorationsService,
        @inject(MonacoDiffNavigatorFactory) protected readonly diffNavigatorFactory: MonacoDiffNavigatorFactory,
    ) { }

    protected async getModel(uri: URI, toDispose: DisposableCollection): Promise<MonacoEditorModel> {
        const reference = await this.textModelService.createModelReference(uri);
        toDispose.push(reference);
        return reference.object;
    }

    async get(uri: URI): Promise<MonacoEditor> {
        await this.editorPreferences.ready;

        const commandService = this.commandServiceFactory();
        const { editorService, textModelService, contextMenuService } = this;
        const override = {
            editorService,
            textModelService,
            contextMenuService,
            commandService
        };

        const toDispose = new DisposableCollection();
        const editor = await this.createEditor(uri, override, toDispose);
        editor.onDispose(() => toDispose.dispose());

        const standaloneCommandService = new monaco.services.StandaloneCommandService(editor.instantiationService);
        commandService.setDelegate(standaloneCommandService);
        this.installQuickOpenService(editor);

        return editor;
    }

    protected createEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoEditor> {
        if (DiffUris.isDiffUri(uri)) {
            return this.createMonacoDiffEditor(uri, override, toDispose);
        }
        return this.createMonacoEditor(uri, override, toDispose);
    }

    protected get preferencePrefixes(): string[] {
        return ['editor.'];
    }
    protected async createMonacoEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoEditor> {
        const model = await this.getModel(uri, toDispose);
        const options = this.createMonacoEditorOptions(model);
        const editor = new MonacoEditor(uri, model, document.createElement('div'), this.m2p, this.p2m, this.decorationsService, options, override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => this.updateMonacoEditorOptions(editor, event)));
        return editor;
    }
    protected createMonacoEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions {
        const options = this.createOptions(this.preferencePrefixes);
        options.model = model.textEditorModel;
        options.readOnly = model.readOnly;
        return options;
    }
    protected updateMonacoEditorOptions(editor: MonacoEditor, event: EditorPreferenceChange): void {
        const { preferenceName, newValue } = event;
        editor.getControl().updateOptions(this.setOption(preferenceName, newValue, this.preferencePrefixes));
    }

    protected get diffPreferencePrefixes(): string[] {
        return [...this.preferencePrefixes, 'diffEditor.'];
    }
    protected async createMonacoDiffEditor(uri: URI, override: IEditorOverrideServices, toDispose: DisposableCollection): Promise<MonacoDiffEditor> {
        const [original, modified] = DiffUris.decode(uri);

        const [originalModel, modifiedModel]  = await Promise.all([this.getModel(original, toDispose), this.getModel(modified, toDispose)]);

        const options = this.createMonacoDiffEditorOptions(originalModel, modifiedModel);
        const editor = new MonacoDiffEditor(
            uri,
            document.createElement('div'),
            originalModel, modifiedModel,
            this.m2p, this.p2m,
            this.decorationsService,
            this.diffNavigatorFactory,
            options,
            override);
        toDispose.push(this.editorPreferences.onPreferenceChanged(event => this.updateMonacoDiffEditorOptions(editor, event)));
        return editor;
    }
    protected createMonacoDiffEditorOptions(original: MonacoEditorModel, modified: MonacoEditorModel): MonacoDiffEditor.IOptions {
        const options = this.createOptions(this.diffPreferencePrefixes);
        options.originalEditable = !original.readOnly;
        options.readOnly = modified.readOnly;
        return options;
    }
    protected updateMonacoDiffEditorOptions(editor: MonacoDiffEditor, event: EditorPreferenceChange): void {
        const { preferenceName, newValue } = event;
        editor.diffEditor.updateOptions(this.setOption(preferenceName, newValue, this.diffPreferencePrefixes));
    }

    protected createOptions(prefixes: string[]): { [name: string]: any } {
        return Object.keys(this.editorPreferences).reduce((options, preferenceName) => {
            const value = (<any>this.editorPreferences)[preferenceName];
            return this.setOption(preferenceName, value, prefixes, options);
        }, {});
    }

    protected setOption(preferenceName: string, value: any, prefixes: string[], options: { [name: string]: any } = {}) {
        const optionName = this.toOptionName(preferenceName, prefixes);
        this.doSetOption(options, value, optionName.split('.'));
        return options;
    }
    protected toOptionName(preferenceName: string, prefixes: string[]): string {
        for (const prefix of prefixes) {
            if (preferenceName.startsWith(prefix)) {
                return preferenceName.substr(prefix.length);
            }
        }
        return preferenceName;
    }
    protected doSetOption(obj: { [name: string]: any }, value: any, names: string[], idx: number = 0): void {
        const name = names[idx];
        if (!obj[name]) {
            if (names.length > (idx + 1)) {
                obj[name] = {};
                this.doSetOption(obj[name], value, names, (idx + 1));
            } else {
                obj[name] = value;
            }
        }
    }

    protected installQuickOpenService(editor: MonacoEditor): void {
        const control = editor.getControl();
        const quickOpenController = control._contributions['editor.controller.quickOpenController'];
        quickOpenController.run = options => {
            const selection = control.getSelection();
            this.quickOpenService.internalOpen({
                ...options,
                onClose: canceled => {
                    quickOpenController.clearDecorations();

                    if (canceled && selection) {
                        control.setSelection(selection);
                        control.revealRangeInCenterIfOutsideViewport(selection);
                    }
                    editor.focus();
                }
            });
        };
    }

    getDiffNavigator(editor: TextEditor): DiffNavigator {
        if (editor instanceof MonacoDiffEditor) {
            return editor.diffNavigator;
        }
        return MonacoDiffNavigatorFactory.nullNavigator;
    }

}
