import { App, Editor, MarkdownView, Notice, Plugin, TFile, View } from 'obsidian';
import { SampleSettingTab, MyPluginSettings, DEFAULT_SETTINGS } from './src/settings';
import { StatusBar } from './src/statusBar';
import { Ribbon } from './src/ribbon';
import { SampleModal } from './src/sampleModal';
import { SelectionPopup } from './src/selectionPopup';
import { CustomRenderer } from './src/renderer';
import { ContextMenu } from './src/contextMenu';
import { AutoComplete } from './src/autoComplete';

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	statusBar: StatusBar;
	ribbon: Ribbon;
	private selectionPopup: SelectionPopup;
	private renderer: CustomRenderer;
	private contextMenu: ContextMenu;
	private autoComplete: AutoComplete;

	async onload() {
		await this.loadSettings();

		this.statusBar = new StatusBar(this);
		this.ribbon = new Ribbon(this);

		this.addCommands();
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('클릭', evt);
		});

		this.renderer = new CustomRenderer();

		// 모든 프로세서를 등록하여 지원되는 언어에 대한 마크다운 코드 블록 프로세서를 설정합니다.
		// 각 프로세서는 CustomRenderer의 특정 처리기를 사용하여 소스 코드를 처리합니다.
		for (const lang of this.renderer.getSupportedLanguages()) {
			this.registerMarkdownCodeBlockProcessor(lang, (source, el, ctx) => {
				const processor = this.renderer.getProcessor(lang);
				if (processor) {
					processor(source, el, ctx);
				}
			});
		}

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		this.selectionPopup = new SelectionPopup(this);
		
		this.contextMenu = new ContextMenu(this);
		this.autoComplete = new AutoComplete(this);

	}

	onunload() {
		// 필���한 정리 작업 수행
	}

	private addCommands() {
		this.addCommand({
			id: 'show-current-view-type',
			name: '현재 뷰 타입 보기',
			callback: () => {
				const activeView = this.app.workspace.getActiveViewOfType(View);
				if (activeView) {
					const viewType = activeView.getViewType();
					new Notice(`현재 뷰 타입: ${viewType}`);
				} else {
					new Notice('활성화된 뷰가 없습니다.');
				}
			}
		});

		// 이것은 현재 편집기 인스턴스에서 작업을 수행할 수 있는 편집기 명령을 추가합니다
		this.addCommand({
			id: 'sample-editor-command',
			name: '샘플 편집기 명령',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('샘플 편집기 명령');
			}
		});

		// 이것은 앱의 현재 상태가 명령 실행을 허용하는지 확인할 수 있는 복잡한 명령을 추가합니다
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: '샘플 모달 열기 (복잡)',
			checkCallback: (checking: boolean) => {
				// 확할 조건
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// checking이 true이면, 단순히 명령을 실행할 수 있는지 "확인"하는 것입니다.
					// checking이 false이면, 실제로 작업을 수행하려는 것입니다.
					if (!checking) {
						new SampleModal(this.app).open();
					}
					// 이 명령은 확인 함수가 true를 반환할 때만 명령 팔레트에 표시됩니다
					return true;
				}
			}
		});

		// 사용자 리스트를 출력하는 새로운 명령어 추가
		this.addCommand({
			id: 'show-user-list',
			name: '사용자 리스트 보기',
			callback: () => this.showUserList()
		});

		// 선택된 JSON 파일 정보를 보여주는 명령어
		this.addCommand({
			id: 'show-selected-json-info',
			name: '선택된 JSON 파일 정보 보기',
			callback: () => this.showSelectedJsonInfo()
		});
	}

	// 사용자 리스트를 Notice로 출력하는 새로운 메서드
	private showUserList() {
		const userList = this.settings.userList;
		if (userList.length === 0) {
			new Notice('사용자 리스트가 비어있습니다.');
		} else {
			const userListString = userList.join(', ');
			new Notice(`사용자 리스트: ${userListString}`, 5000); // 5초 동안 표시
		}
	}

	// 선택된 JSON 파일의 정보를 보여주는 메서드
	private showSelectedJsonInfo() {
		const filePath = this.settings.selectedJsonFile;
		if (!filePath) {
			new Notice('선택된 JSON 파일이 없습니다.');
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			const fileName = file.name;
			new Notice(`선택된 JSON 파일:\n파일명: ${fileName}\n경로: ${filePath}`, 5000);
		} else {
			new Notice('선택된 파일을 찾을 수 없습니다.');
		}
	}

	private transformContent(source: string): string {
		return source.replace(/a/g, '1')
					 .replace(/b/g, '2')
					 .replace(/c/g, '3');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
