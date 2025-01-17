import MetadataMenu from "main";
import { Menu, Platform, requireApiVersion, TAbstractFile, TFile } from "obsidian";
import OptionsList from "src/options/OptionsList";
import FileClassOptionsList from "./FileClassOptionsList";
import { frontMatterLineField, getLineFields } from "src/utils/parser";
import FieldCommandSuggestModal from "./FieldCommandSuggestModal";
import { FileClass } from "src/fileClass/fileClass";

export default class linkContextMenu {

	constructor(private plugin: MetadataMenu) {
		this.createContextMenu();
	};

	private buildOptions(file: TFile | TAbstractFile | null, menu: Menu, includedFields?: string[]): void {
		const classFilesPath = this.plugin.settings.classFilesPath
		if (file instanceof TFile && file.extension === 'md') {
			if (!Platform.isMobile && requireApiVersion("0.16.0")) {
				if (classFilesPath && file.path.startsWith(classFilesPath)) {
					const fileClassName = FileClass.getFileClassNameFromPath(this.plugin, file.path)
					//@ts-ignore
					menu.setSectionSubmenu(`metadata-menu-fileclass.${fileClassName}.fileclass-fields`, { title: "Manage fields", icon: "wrench" });
				} else {
					//@ts-ignore
					menu.setSectionSubmenu("metadata-menu.current_field", { title: "Current field", icon: "pencil" })
					//@ts-ignore
					menu.setSectionSubmenu("metadata-menu.fields", { title: "Manage fields", icon: "pencil" })
					const fileClasses = this.plugin.fieldIndex.filesFileClasses.get(file.path) || [];
					fileClasses.forEach(fileClass => {
						//@ts-ignore
						menu.setSectionSubmenu(`metadata-menu-fileclass.${fileClass.name}.fileclass-fields`, { title: `Manage ${fileClass.name} fields`, icon: "wrench" })
					})
				}
			}
			if (this.plugin.settings.displayFieldsInContextMenu) {
				//If fileClass
				if (classFilesPath && file.path.startsWith(classFilesPath)) {
					const fileClassOptionsList = new FileClassOptionsList(this.plugin, file, menu)
					fileClassOptionsList.createExtraOptionList();
				} else {
					const optionsList = new OptionsList(this.plugin, file, menu, includedFields);
					optionsList.createExtraOptionList();
				};
			} else {
				menu.addItem((item) => {
					item.setIcon("list")
					item.setTitle("Field Options")
					item.onClick(() => {
						const fieldCommandSuggestModal = new FieldCommandSuggestModal(this.plugin.app)
						const optionsList = new OptionsList(this.plugin, file, fieldCommandSuggestModal);
						optionsList.createExtraOptionList();
					})
				})
			}
		};
	}

	private createContextMenu(): void {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('file-menu', (menu, abstractFile, source) => {
				const file = this.plugin.app.vault.getAbstractFileByPath(abstractFile.path);
				this.buildOptions(file, menu);
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on('editor-menu', (menu, editor, view) => {
				const file = this.plugin.app.workspace.getActiveFile();
				const includedFields: string[] = [];
				const frontmatter = this.plugin.app.metadataCache.getFileCache(view.file)?.frontmatter;
				if (frontmatter
					&& editor.getCursor().line > frontmatter.position.start.line
					&& editor.getCursor().line < frontmatter.position.end.line
				) {
					const attribute = frontMatterLineField(editor.getLine(editor.getCursor().line))
					if (attribute) includedFields.push(attribute);
				} else {
					getLineFields(editor.getLine(editor.getCursor().line)).forEach(field => {
						if (editor.getCursor().ch <= field.index + field.length && editor.getCursor().ch >= field.index) {
							includedFields.push(field.attribute);
						}
					})
				}
				if (includedFields.length) {
					this.buildOptions(file, menu, includedFields);
				} else {
					this.buildOptions(file, menu);
				}

			})
		)
	};
};