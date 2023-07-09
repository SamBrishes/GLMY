
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

import NightFormControl from "./night-form-control";


class NightEditor extends NightFormControl {

    /**
     * Editor
     */
    private editor: Editor;

    /**
     * Editor View
     */
    private view: EditorView|null = null;

    /**
     * Current Value
     */
    private _content: string = '';

    /**
     * Current Lines Counter
     */
    private lines: number = 0;

    /**
     * Current Words Counter
     */
    private words: number = 0;

    /**
     * Current Characters Counter
     */
    private characters: number = 0;

    /**
     * Create a new <night-editor /> instance
     */
    constructor() {
        super();

        this.editor = Editor
            .make()
            .config(ThemeNord)
            .config(ctx => {
                ctx.set(rootCtx, this)
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
     * Current Lines Counter
     */
    get countLines(): number {
        return this.lines;
    }

    /**
     * Current Words Counter
     */
    get countWords(): number {
        return this.words;
    }

    /**
     * Current Words Counter
     */
    get countCharacters(): number {
        return this.characters;
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
        this._internals.setFormValue(this._content);
        this.editor.action(replaceAll(this._content));
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

                            // Old Values
                            let counts = {
                                lines: self.countLines,
                                words: self.countWords,
                                characters: self.countCharacters,
                            };

                            // New Values
                            self.lines = doc.childCount;
                            self.words = words;
                            self.characters = Math.max(chars-1, 0);

                            // Dispatch Event
                            let event = new CustomEvent('counter', {
                                bubbles: false,
                                cancelable: false,
                                composed: false,
                                detail: {
                                    old: counts,
                                    new: {
                                        lines: self.countLines,
                                        words: self.countWords,
                                        characters: self.countCharacters
                                    }
                                }
                            })
                            self.dispatchEvent(event);
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
     * Render Component
     */
    public async render() {
        this.style.maxHeight = `${this.offsetHeight - 100}px`;
        
        await this.editor.create()
        new SimpleBar(this);

        this.addEventListener('click', (ev) => {
            let target = ev.target as HTMLElement;
            let milkdown = this.querySelector('.milkdown') as HTMLElement;
            if (target === milkdown || milkdown.contains(target)) {
                return;
            }

            if (!this.contains(target)) {
                return;
            }

            this.view?.focus();
        });
    }

}

// Define custom element
window.customElements.define('night-editor', NightEditor);

// Export Module
export default NightEditor;
