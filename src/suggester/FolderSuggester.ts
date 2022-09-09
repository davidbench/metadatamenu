// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import MetadataMenu from "main";
import { TAbstractFile, TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";

export class FolderSuggest extends TextInputSuggest<TFolder> {

    private plugin: MetadataMenu

    constructor(plugin: MetadataMenu, inputEl: HTMLInputElement | HTMLTextAreaElement) {
        super(inputEl);
        this.plugin = plugin
    }

    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.plugin.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder);
            }
        });

        return folders;
    }

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}
