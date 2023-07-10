
import type { Ctx } from '@milkdown/ctx';
import type { EditorView } from '@milkdown/prose/view';

import { Editor, rootCtx, prosePluginsCtx } from '@milkdown/core';
import { replaceAll } from '@milkdown/utils';
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { commonmark as PluginCommonMark } from '@milkdown/preset-commonmark';
import { gfm as PluginGFM } from '@milkdown/preset-gfm';
import { history as PluginHistory } from '@milkdown/plugin-history';
import { clipboard as PluginClipboard } from '@milkdown/plugin-clipboard';
import { listener as PluginListener } from '@milkdown/plugin-listener';
import { prism as PluginPrism } from '@milkdown/plugin-prism';
import { emoji as PluginEmoji } from '@milkdown/plugin-emoji';
import { indent as PluginIndent } from '@milkdown/plugin-indent';
import { upload as PluginUpload } from '@milkdown/plugin-upload';
import { nord as ThemeNord } from '@milkdown/theme-nord';
import SimpleBar from 'simplebar';

import AbstractFormControl from '../abstract/form-control';
import create from '../support/create';
import States from '../extensions/states';

interface NightEditorStates {
    lines: number;
    words: number;
    characters: number;
}

interface EditorOptions {
    title: string;
    content: string;
};

class NightEditor extends AbstractFormControl {

    /**
     * Editor
     */
    private editor: Editor;

    /**
     * Editor View
     */
    private view: EditorView|null = null;

    /**
     * Title Value
     */
    private _title: string = '';

    /**
     * Editor Value
     */
    private _content: string = '';

    /**
     * Component States
     */
    public states: States<NightEditorStates> = new States({
        lines: 0,
        words: 0,
        characters: 0,
    });

    /**
     * Create a new NightEditor component instance
     */
    constructor(options: EditorOptions) {
        super();
        this._title = options.title;
        this._content = options.content;

        this.editor = Editor
            .make()
            .config(ThemeNord)
            .config(ctx => {
                ctx.set(rootCtx, this.querySelector('.form-editor'))
            })
            .use(PluginCommonMark)
            .use(PluginGFM)
            .use(PluginHistory)
            .use(PluginClipboard)
            .use(PluginListener)
            .use(PluginPrism)
            .use(PluginEmoji)
            .use(PluginIndent)
            .use(PluginUpload)
            .use(ctx => this.milkdownExtensions(ctx));
    }

    /**
     * Get current title
     */
    get title() {
        return this._title;
    }

    /**
     * Set new title
     */
    set title(value: string) {
        this._title = value;
        this.setFormData();
    }

    /**
     * Get current value
     */
    get value() {
        return this._content;
    }

    /**
     * Set new value
     */
    set value(value: string) {
        this._content = value;
        this.editor.action(replaceAll(this._content));
        this.setFormData();
    }

    /**
     * Set Form Data
     */
    public setFormData() {
        let formData = new FormData();
        formData.set('title', this._title);
        formData.set('content', this._content);
        this._internals.setFormValue(formData);
    }

    /**
     * Apply custom milkdown extensions
     */
    private milkdownExtensions(ctx: Ctx) {
        const prosePlugins = ctx.get(prosePluginsCtx)

        const self = this;
        return async () => {
            const plugins = [
                ...prosePlugins,

                // Placeholder
                new Plugin({
                    key: new PluginKey('Placeholder'),
                    view(view) {
                        if (self.view === null) {
                            self.view = view;
                        }

                        const update = (view: EditorView) => {
                            const placeholder = "Start writing your story here..."
                            const doc = view.state.doc
                            if (
                                view.editable &&
                                doc.childCount === 1 &&
                                doc.firstChild?.isTextblock &&
                                doc.firstChild?.content.size === 0 &&
                                doc.firstChild?.type.name === 'paragraph'
                            ) {
                                view.dom.setAttribute('data-placeholder', placeholder);
                            } else {
                                view.dom.removeAttribute('data-placeholder');
                            }
                        };

                        update(view)
                        return { update };
                    }
                }),

                // Character Counter
                new Plugin({
                    key: new PluginKey('Counter'),

                    view(view) {
                        const update = (view: EditorView) => {
                            const doc = view.state.doc;

                            // Count
                            let wordsTest = view.dom.innerText.trim().match(/\S+/g);
                            let words = wordsTest === null ? 0 : wordsTest.length;
                            let chars = 0;
                            doc.nodesBetween(0, doc.nodeSize - 2, (node) => {
                                if (node.type.isTextblock) {
                                    chars += 1;
                                } else if (node.type.isText) {
                                    chars += node.textBetween(0, node.nodeSize).length;
                                }
                            });

                            // Set Values
                            self.states.set('lines', doc.childCount);
                            self.states.set('words', words);
                            self.states.set('characters', Math.max(chars-1, 0));
                        };

                        update(view)
                        return { update };
                    }
                })
            ];
            ctx.set(prosePluginsCtx, plugins);
        }
    }

    /**
     * Connected Callback
     */
    public async connectedCallback() {
        this.render();
    }

    /**
     * Disconnected Callback
     */
    public async disconnectedCallback() {
    }

    /**
     * Callback for changed states
     * @param key 
     * @param newValue 
     * @param oldValue 
     */
    public async onStateChanged(key: keyof NightEditorStates, newValue: any, oldValue: any) {
        if (key === 'lines') {
            let lineCounter = this.querySelector('[data-line-counter]') as HTMLElement|null;
            if (lineCounter) {
                lineCounter.innerText = newValue.toString();
            }
        }
        if (key === 'words') {
            let wordCounter = this.querySelector('[data-word-counter]') as HTMLElement|null;
            if (wordCounter) {
                wordCounter.innerText = newValue.toString();
            }
        }
        if (key === 'characters') {
            let characterCounter = this.querySelector('[data-character-counter]') as HTMLElement|null;
            if (characterCounter) {
                characterCounter.innerText = newValue.toString();
            }
        }
    }

    /**
     * Render Component
     */
    public async render() {
        if (this.children.length !== 0) {
            return;
        }
        this.append(this.renderForm(), this.renderFooter());

        // Initialize SimpleBar
        const editorForm = this.querySelector('form') as HTMLFormElement;
        const editorContent = this.querySelector('.night-editor-content') as HTMLDivElement;
        editorContent.style.height = `${editorForm.offsetHeight - 48}px`;
        new SimpleBar(editorContent as HTMLDivElement);
        
        // Initialize Editor
        await this.editor.create()

        // Handle clicks to focus Editor
        editorContent.addEventListener('click', (ev) => {
            this.view?.focus();
        });

        // Set Initial Value
        this.editor.action(replaceAll(this._content));
    }

    /**
     * Render main form element
     * @returns 
     */
    public renderForm() {
        const form = create<HTMLFormElement>('form', {
            action: '/',
            method: 'post',
            className: 'night-editor-form'
        });

        // Create title
        const title = create<HTMLDivElement>('div', {
            className: 'night-editor-title',
        });
        const input = create<HTMLInputElement>('input', {
            type: 'input',
            name: 'title',
            value: this._title,
            className: 'form-field',
            placeholder: 'Note Title',
            dataset: {
                noteTitle: 's'
            }
        });
        title.append(input);
        
        // Create Editor
        const editor = create<HTMLDivElement>('div', {
            className: 'night-editor-content',
            innerHTML: `
                <div class="form-editor"></div>
            `
        });

        // Append & Return
        form.append(title, editor);
        return form;
    }

    /**
     * Render main Footer
     * @returns
     */
    public renderFooter() {
        const footer = create<HTMLDivElement>('footer', {
            className: 'night-editor-form-stats',
            innerHTML: `
                <div class="stats">
                    <div class="stats-lines">Lines: <span data-line-counter>0</span></div>
                    <div class="stats-words">Words: <span data-word-counter>0</span></div>
                    <div class="stats-characters">Characters: <span data-character-counter>0</span></div>
                </div>
        
                <div class="stats">
                    <div class="stats-autosave">Last saved <span data-autosave-time>20 seconds ago</span></div>
                </div>
            `
        });
        return footer;
    }

}

// Define custom element
window.customElements.define('night-editor', NightEditor);

// Export Module
export default NightEditor;
