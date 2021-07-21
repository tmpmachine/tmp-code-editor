let navStructure = {
  root: {
    activeFile: null,
    fileTab: [],
    selectedFile: [],
    activeTab: 0,
    activeFolder: -1,
    breadcrumbs: [{folderId:-1,title:'My Files'}],
  },
};

let navMain = new lsdb('nav-main', navStructure);
let navTemp = new lsdb('nav-temp', navStructure);
let navs = [navMain, navTemp];

for (let key in navStructure.root) {
  Object.defineProperty(window, key, { 
    get: () => navs[activeWorkspace].data[key],
    set: value => navs[activeWorkspace].data[key] = value,
  })
}

// dom
let pressedKeys = {};

// global / environment
let notif;

// preview
// window.name = 'parent';

const fileExplorerManager = {
	lastClickEl: null,
	doubleClick: false,
};

const editorManager = {
	fontSizeIndex: 2,
	defaultFontSizeIndex: 2,
	fontSizes: [12, 14, 16, 18, 21, 24, 30, 36, 48],
	isPasteRow: false,
	changeFontIndex: function(value) {
		let temp = this.fontSizeIndex;
		if (value === 0) {
			this.fontSizeIndex = this.defaultFontSizeIndex;
		} else {
			this.fontSizeIndex += value;
			this.fontSizeIndex = Math.min(this.fontSizes.length-1, Math.max(0, this.fontSizeIndex))
		}
		let isChanged = (temp != this.fontSizeIndex);
		if (isChanged) {
			let row = this.firstVisibleRow;
		    fileTab[activeTab].editor.env.editor.setFontSize(this.fontSize);
			fileTab[activeTab].editor.env.editor.scrollToLine(row);
		}
	},
	get fontSize() { return this.fontSizes[this.fontSizeIndex] },
	get firstVisibleRow() { return fileTab[activeTab].editor.env.editor.getFirstVisibleRow() },
};

const stateManager = (function() {

	let states = [];

	function getState(stateNumber) {
		let state = '';
		switch (stateNumber) {
			case 0: state = 'modal-window'; break;
			case 1: state = 'file-manager'; break;
		}
		return state;
	}

	function pushState(_states) {
		for (let state of _states) {
			state = getState(state)
			let index = states.indexOf(state);
			if (index < 0)
				states.push(state);	
		}
	}

	function popState(_states) {
		for (let state of _states) {
			state = getState(state)
			let index = states.indexOf(state);
			if (index >= 0)
				states.splice(index,1);
		}
	}

	function hasState(_states, isOnlyState = false) {
		if (isOnlyState && (_states.length != states.length))
			return false;

		for (let state of _states) {
			state = getState(state);
			let index = states.indexOf(state);
			if (index < 0)
				return false;
		}
		return true;
	}

	function isState(stateId) {
		let result = false;
		switch (stateId) {
			case 0:
				result = hasState([1], true);
			break;
			case 1:
				result = hasState([0]);
			break;
		}
		return result;
	}

  function getStates() {
    return states;
  }

	return {
		pushState,
		popState,
		isState,
    getStates,
	};

})();

const modalWindowManager = (function() {

	let activeModal;

	function closeAll() {
		for (let modal of $('.modal-window'))
	      modal.classList.toggle('Hide', true);
      	stateManager.popState([0]);
	}

	function open(name) {
		closeAll();
		for (let modal of $('.modal-window')) {
		    if (modal.dataset.name == name) {
		      modal.classList.toggle('Hide', false);
		      stateManager.pushState([0]);
		      break;
		    }
		  }
	}

	function hasOpenModal() {
		return stateManager.isState(1);
	}	

	return {
		open,
		closeAll,
		hasOpenModal,
	};

})();

const ui = {
	tab: {
		openDirectory: function(self) {
			if (self.dataset.parentId != '' && self.classList.contains('isActive')) {
				let parentId = parseInt(self.dataset.parentId);
				tabManager.openDirectory(parentId);
			}
			event.preventDefault();
		},
	},
	fileGenerator: {
		generate: function() {
			let form = this.form;
			window.app.getComponent('single-file-generator').then(sfg => {
				sfg.generate(form);
			}).catch((e) => {
				aww.pop('Component is not ready yet.')
			});
		},
		copy: function() {
			let form = this.form;
			window.app.getComponent('single-file-generator').then(sfg => {
				sfg.copy(form);
			}).catch((e) => {
				aww.pop('Component is not ready yet.')
			});
		},
	},
	tree: {
		renameFolder: function(folder) {
			window.app.getComponent('file-tree').then(fileTree => {
    		fileTree.renameItem(folder, 'folder');
    	});
		},
		renameFile: function(file) {
			window.app.getComponent('file-tree').then(fileTree => {
    		fileTree.renameItem(file, 'file');
    	});
		},
		appendFile: function(file) {
			window.app.getComponent('file-tree').then(ft => {
	      ft.appendFile(file);
	    });
		},
		appendFolder: function(folder) {
			window.app.getComponent('file-tree').then(ft => {
	      ft.appendFolder(folder);
	    });
		},
		createWorkspace: function() {
			window.app.getComponent('file-tree').then(ft => {
	      ft.createWorkspace(activeFolder);
	    });
		},
	},
	highlightTree: function(fid, isRevealFileTree = true) {
		window.app.getComponent('file-tree').then(ft => {
      ft.highlightTree(fid, isRevealFileTree);
    });
	},
	reloadFileTree: function() {
		window.app.getComponent('file-tree').then(ft => {
			ft.reload();
		})
	},
	changeWorkspace: function() {
	  if (this.dataset.target != $('#workspace-title').textContent) {
	    for (let node of $('.workspace .Btn')) {
	      node.classList.toggle('active');
	    }
	    $('#workspace-title').textContent = this.dataset.target;
	    activeWorkspace = parseInt(this.dataset.index);
	    fileManager.list();
	    listTab();
	    if (fileTab.length === 0)
	      newTab();
	    focusTab(fileTab[activeTab].fid);
	    loadBreadCrumbs();
	    window.app.getComponent('file-tree').then(ft => {
				ft.reload();
			})
	  }
	},
  newFile: function() {
    if (!$('#btn-menu-my-files').classList.contains('active')) {
      ui.openNewTab();
    }
  },
  newDiskFile: function() {
    if (!$('#btn-menu-my-files').classList.contains('active')) {
      window.showSaveFilePicker({
        types: [
          {
            description: 'HTML (.html)',
            accept: {
              'text/javascript': ['.html'],
            },
          },
        ],
      }).then(fileHandle => {
        let tabData = {
          fileHandle,
          content: '',
          fid: '-' + (new Date).getTime(),
          name: fileHandle.name,
          editor: initEditor(),
        };
        newTab(-1, tabData);
      });
    }
  },
  myFiles: function() {
    $('#btn-menu-my-files').click();
  },
  trash: function() {
    if (!$('#in-trash').classList.contains('active'))
      $('#btn-menu-trash').click();
  },
  toggleTheme: function() {
    let editor = fileTab[activeTab].editor.env.editor;
    if (editor.getTheme().includes('codetmp'))
      editor.setTheme('ace/theme/github');
    else
      editor.setTheme('ace/theme/codetmp');
  },
  toggleInFrame: function() {
    $('#main-layout').classList.toggle('inframe-mode');
    $('#main-layout').classList.toggle('normal-mode');
    previewHandler.previewMode = (previewHandler.previewMode == 'normal') ? 'inframe' : 'normal';
    fileTab[activeTab].editor.env.editor.session.setUseWrapMode(settings.data.editor.wordWrapEnabled);
  },
  setFontSize: function() {
    modal.prompt('Editor Font Size', 16).then(size => {
      size = parseInt(size);
      if (size) {
        for (let tab of fileTab) {
          tab.editor.env.editor.setFontSize(size);
        }
      }
    });
  },
  changeFileListView: function() {
    changeExplorerView(this.dataset.type);
  },

	uploadFile: async function(self) {
    $('#file-upload').click();
	},

  reloadOpenTab: function(fid) {
    for (let tab of fileTab) {
      if (tab.fid == fid) {
        tab.editor.env.editor.setValue(tab.file.content);
      }
    }
  },

  toggleFileDownload: function() {
    toggleModal('file-download');
    let form = $('.modal-window[data-name="file-download"] form')[0];
    setTimeout(() => {
      form.submit.focus();
    }, 50)
  },

  toggleGenerateSingleFile: function() {
    toggleModal('generate-single-file');
    let form = $('.modal-window[data-name="generate-single-file"] form')[0];
    setTimeout(() => {
      form.submit.focus();
    }, 50)
  },

  previewMedia: function(file, mimeType) {
    toggleModal('media-preview');
    
    let media;
    if (mimeType.includes('audio')) 
      media = document.createElement('audio');
    else if (mimeType.includes('video'))
      media = document.createElement('video');
    else if (mimeType.includes('image')) {
      media = document.createElement('img');
      media.addEventListener('click', () => {
        toggleModal('media-preview');
      });
    }
    media.classList.add('Medial-el');
    media.setAttribute('controls','controls');
    $('.media-preview .Media')[0].append(media);
    
    return new Promise((resolve, reject) => {
      fileManager.getPreviewLink(file).then(resolve).catch(reject);
    }).then(src => {
      media.src = src;
      $('.media-preview .Title')[0].textContent = file.name;
      $('.media-preview .Download')[0].onclick = () => {
        let a = document.createElement('a');
        a.href = src;
        a.target = '_blank';
        a.download = file.name;
        $('#limbo').appendChild(a);
        a.click();
        $('#limbo').removeChild(a);
      };
    }).catch(() => {
      aww.pop('Failed to preview media.');
    });
  },

  closeMediaPreview: function() {
    let src = $('.media-preview .Media')[0].src;
    $('.media-preview .Title')[0].textContent = '';
    $('.media-preview .Download')[0].onclick = null;
    $('.media-preview .Medial-el')[0].remove();
    URL.revokeObjectURL(src);
  },

  enableJSZip: function() {
    $('.clickable[data-callback="file-download"]')[0].classList.toggle('hide', false);
  },

  toggleMyFiles: function() {
    if (stateManager.isState(1)) return;
    
    $('#btn-menu-my-files').click()
    if ($('#btn-menu-my-files').classList.contains('active')) {
      fileTab[activeTab].editor.env.editor.blur();
      stateManager.pushState([1]);
      setTimeout(() => { document.activeElement.blur() }, 1);
    } else {
      // fileClipBoard.clipBoard.length = 0;
      stateManager.popState([1]);
      fileTab[activeTab].editor.env.editor.focus();
    }
  },

	toggleFileActionButton: function() {
    let isHide = (selectedFile.length === 0);
    o.classList.toggle($('.btn-file-action'), 'w3-hide', isHide);
	},

  setGitToken: function() {
    toggleModal('settings');
    modal.prompt('Personal access token').then(token => {
      if (token !== null) {
        git.setToken(token);
        aww.pop('Personal access token has been set.');
      }
    });
  },

	fileManager: (function() {

		function commit(data) {
			fileManager.sync(data);
			drive.syncToDrive();
      fileStorage.save();
      fileManager.list();
		}
		function getSelected(el) {
			return {
				title: el.getAttribute('title'),
				id: Number(el.getAttribute('data')),
			};
		}

    function renameFolder() {
			let selection = getSelected(selectedFile[0]);
	      	modal.prompt('Rename', selection.title, '', helper.getFileNameLength(selection.title)).then(name => {
	        	if (!name || name === selection.title) 
	        		return;
	        
			      let folder = fileManager.get({fid: selection.id, type: 'folders'});
		        folder.name = name;
		        folder.modifiedTime = new Date().toISOString();
	        
		        commit({
		          fid: folder.fid,
		          action: 'update',
		          metadata: ['name'],
		          type: 'folders'
		        });
		        ui.tree.renameFolder(folder);

	      	});
	    }
	    function renameFile() {
	    	let selection = getSelected(selectedFile[0]);
	    	let fid = selection.id;
	      	modal.prompt('Rename', selection.title, '', helper.getFileNameLength(selection.title)).then(name => {
	        	if (!name || name == selection.title) 
	        		return;

		      	let file = fileManager.get({fid, type:'files'});
		        file.name = name;
		        commit({
		          fid: fid,
		          action: 'update',
		          metadata: ['name'],
		          type: 'files'
		        });
		        ui.tree.renameFile(file);

		        if (activeFile) {
		          if (fid === activeFile.fid)
		            setEditorMode(file.name);
		          
		          let index = 0
		          for (let tab of fileTab) {
		            if (tab.fid == fid) {
		              $('.file-name')[index].textContent = file.name;
		              break;
		            }
		            index++;
		          }
		        }
	      	});
	    }
	    function newFolder() {
	      	if (!$('#in-my-files').classList.contains('active'))
	      		return;
	      	
          modal.prompt('Folder name', 'New Folder').then(name => {
		        if (!name) 
		        	return;

		        let folder = fileManager.newFolder({
                name: fileManager.getDuplicateName(activeFolder, name, 'folder'),
		          	modifiedTime: new Date().toISOString(),
		          	parentId: activeFolder,
		        });
		        commit({
		        	fid: folder.fid,
		        	action: 'create',
		        	type: 'folders',
	        	});
	        	clearSelection();
	        	ui.tree.appendFolder(folder);

	      	});
	    }

      function newFile() {
          if (!$('#in-my-files').classList.contains('active')) {
						ui.openNewTab();
            return;
          }
          
          modal.prompt('File name', 'Untitled').then(name => {
            if (!name) 
              return;
            let file = fileManager.newFile({
                name: fileManager.getDuplicateName(activeFolder, name),
                modifiedTime: new Date().toISOString(),
                content: '',
            });
            commit({
              fid: file.fid,
              action: 'create',
              type: 'files',
            });
            clearSelection();
            ui.tree.appendFile(file);

          });
      }
      function confirmDeletion(message) {
        return new Promise(resolve => {
          modal.confirm(message).then(() => {
            resolve();
          })
        })
      }
	    function deleteFolder(selectedFile) {
	    	let selection = getSelected(selectedFile);
      	let data = fileManager.get({fid: selection.id, type: 'folders'});
      	data.trashed = true;
      	commit({
        	fid: data.fid,
        	action: 'update',
        	metadata: ['trashed'],
        	type: 'folders'
      	});
      	window.app.getComponent('file-tree').then(fileTree => {
      		fileTree.removeFolder(data);
      	});
	    }
	    function deleteFile(selectedFile) {
	    	let selection = getSelected(selectedFile);
	    	let fid = selection.id;
      	let data = fileManager.get({fid, type: 'files'});
      	data.trashed = true;
      
      	if (activeFile && data.fid === activeFile.fid) {
        	activeFile = null;
		  	fileTab[activeTab].fiber = 'fiber_manual_record';
        	$('.icon-rename')[activeTab].textContent = 'fiber_manual_record';
      	}
      
      	for (let sync of fileStorage.data.sync) {
        	if (sync.action === 52 && sync.copyId === fid) {
          	sync.action = 12;
        	}
      	}
      
		    commit({
		        fid: data.fid,
		        action: 'update',
		        metadata: ['trashed'],
		        type: 'files'
		    });
		    window.app.getComponent('file-tree').then(fileTree => {
	    		fileTree.removeFile(data);
	      });
	    }

	    function deleteSelected() {
		    if (selectedFile.length === 1) {
          confirmDeletion('Move selected item to trash?').then(() => {
  		      if (selectedFile[0].getAttribute('data-type') === 'folder')
  		        deleteFolder(selectedFile[0]);
  		      else if (selectedFile[0].getAttribute('data-type') === 'file')
  		        deleteFile(selectedFile[0]);
            clearSelection();
          })

		    } else if (selectedFile.length > 1) {
          confirmDeletion('Move selected items to trash?').then(() => {
            while (selectedFile.length > 0) {
              let selection = selectedFile[0];
              if (selection.getAttribute('data-type') === 'folder')
                deleteFolder(selection);
              else if (selection.getAttribute('data-type') === 'file')
                deleteFile(selection);  
            }
            clearSelection();
		    	});
		    }
		  }

    return {
			renameFolder,
			renameFile,
			newFolder,
      newFile,
			deleteSelected,
			getSelected,
    };

	})(), // end of ui.fileManager

  toggleMenu: function() {
    
    let targetId = this.getAttribute('target');
    let target;
    if (targetId)
      target = $('#'+targetId);
    else
      target = this;

    target.classList.toggle('active');
    
    
    target.lastElementChild.classList.toggle('active');
    target.firstElementChild.classList.toggle('active');
    let menuId = target.getAttribute('menu');
    let menu = $('#'+menuId);
    let block = $('#'+menuId+'-block');
    
    if (target.classList.contains('active') && (menuId === 'in-my-files' || menuId === 'in-trash')) {
      
      $('#list-trash').innerHTML = '';
      $('#file-list').innerHTML = '';
      if (menuId === 'in-my-files') {
        fileManager.list();
      }
      else if (menuId === 'in-trash')
        trashList();

      toggleInsertSnippet(false);
    }

    if (!menu) {
      setTimeout(function(){
        target.classList.toggle('active',false);
        target.lastElementChild.classList.toggle('active',false);
        target.firstElementChild.classList.toggle('active',false);
      }, 500);
      return;
    }
    
    for (let el of $('.btn-material')) {
      
      if (el !== target) {
        
        if (!el.classList.contains('active')) continue;
        el.classList.toggle('active',false);
        el.lastElementChild.classList.toggle('active',false);
        el.firstElementChild.classList.toggle('active',false);
        let menuId = el.getAttribute('menu');
        if (menuId === null) continue
        let menu = $('#'+menuId);
        let block = $('#'+menuId+'-block');
        menu.classList.toggle('active',false);
        block.classList.toggle('active',false);
      }
    }
     
    menu.classList.toggle('active');
    if (typeof(block) != 'undefined')
    	block.classList.toggle('active');
    
    if (!menu.classList.contains('active')) {
      selectedFile = [];
    }

    if ($('#in-my-files').classList.contains('active')) {
		$('#btn-menu-save-wrapper').classList.toggle('hide', true);
	  	$('#btn-menu-preview-wrapper').classList.toggle('hide', true);
	  	$('#btn-menu-template').classList.toggle('hide', true);

	  	$('#btn-home-wrapper').classList.toggle('hide', false);
	  	$('#btn-account-wrapper').classList.toggle('hide', false);
		$('#btn-undo').classList.toggle('hide', true);
		$('#btn-redo').classList.toggle('hide', true);
		stateManager.pushState([1]);
    } else {
	    $('#btn-menu-save-wrapper').classList.toggle('hide', false);
	  	$('#btn-menu-preview-wrapper').classList.toggle('hide', false);
	  	$('#btn-menu-template').classList.toggle('hide', false);
	  	$('#btn-home-wrapper').classList.toggle('hide', true);
	  	$('#btn-account-wrapper').classList.toggle('hide', true);
	  	$('#btn-undo').classList.toggle('hide', false);
		$('#btn-redo').classList.toggle('hide', false);
		stateManager.popState([1]);
    }
  },
  
  switchTab: function(direction = 1) {
    if ($('#in-my-files').classList.contains('active') || fileTab.length == 1) 
      return
    let fid;
    if (activeTab + direction > 0 && activeTab + direction < fileTab.length)
      fid = fileTab[activeTab + direction].fid
    else
      fid = (activeTab + direction == -1) ? fileTab[fileTab.length - 1].fid : fileTab[0].fid;
    focusTab(fid);
  },
  
  openNewTab: function() {
    newTab();
  },
  
  toggleAutoSync: function() {
    settings.data.autoSync = !settings.data.autoSync;
    settings.save();
    $('#check-auto-sync').checked = settings.data.autoSync ? true : false;
  },

  toggleSaveToken: function() {
    settings.data.saveGitToken = !settings.data.saveGitToken;
    settings.save();
    $('#check-save-token').checked = settings.data.saveGitToken ? true : false;
  },

  toggleHomepage: function() {
    settings.data.showHomepage = !settings.data.showHomepage;
    settings.save();
    $('#check-show-homepage').checked = settings.data.showHomepage ? true : false;
  },

  cloneRepo: function() {
    let message = $('#msg-git-rate-limit').content.cloneNode(true).firstElementChild;
    $('.Rate', message)[0].textContent = git.rateLimit;
    modal.prompt('Repository web URL', 'https://github.com/username/repository', message.innerHTML).then(url => {
      if (!url) 
        return;
      ui.alert({text:'Cloning repository...'});
      git.clone(url);
    });
  },

  confirmClearData: function() {
    modal.confirm('This will delete all Codetmp saved files & folders on current browser. Continue?', false).then(() => {
      fileStorage.reset();
      location.reload();
    });
  },

  alert: function({text, isPersistent = false, timeout}) {
    aww.pop(text, isPersistent, timeout);
  },

  fileDownload: function(self) {
  	window.app.getComponent('fileBundler').then(fb => {
  		fb.fileDownload(self);
  	}).catch((e) => {
  		L(e);
  		aww.pop('Component is not ready. Try again later.');
  	});
  },


}; // end of ui

// modal

function toggleModalByClick() {
  toggleModal(this.dataset.target);
}

function toggleModal(name) {
  for (let modal of $('.modal-window')) {
    if (modal.dataset.name == name) {
      let isHide = modal.classList.toggle('Hide');
      if (isHide) {
      	stateManager.popState([0]);
        if (modal.dataset.close)
          ui[modal.dataset.close]();
      } else {
      	stateManager.pushState([0]);
      }
      break;
    }
  }
}

// init
function initUI() {
  
	notif = Notifier($('#tmp-notif'), $('#notif-list'));
  // initInframeLayout();
  fileManager.list();
  preferences.loadSettings();
  newTab();
  initTabFocusHandler();
  // initMenuBar();
  changeExplorerView(settings.data.explorer.view);

  for (let modal of $('.modal-window')) {
    modal.classList.toggle('transition-enabled', true);
    $('.Overlay',modal)[0].addEventListener('click', toggleModalByClick);
    $('.Btn-close',modal)[0].addEventListener('click', toggleModalByClick);
  }
  
  function preventDefault(event) {
    event.preventDefault();
  }
  
  function blur() {
    document.activeElement.blur();
  }
  
  attachSubmitable('.submittable', DOMEvents.submittable);
  attachClickable('.clickable', DOMEvents.clickable);
  attachInputable('.inputable', DOMEvents.inputable);

  function attachSubmitable(selector, callback) {
    for (let node of document.querySelectorAll(selector)) {
      if (node.classList.contains('preventDefault'))
        node.addEventListener('submit', preventDefault);
      node.addEventListener('submit', callback[node.dataset.callback]);
    }
  }

  function attachClickable(selector, callback) {
    for (let element of document.querySelectorAll(selector)) {
      element.addEventListener('click', callback[element.dataset.callback]);
      element.addEventListener('click', blur);
    }
  }

  function attachInputable(selector, callback) {
    for (let element of document.querySelectorAll(selector))
      element.addEventListener('input', callback[element.dataset.callback]);
  }

	o.listen({
    '.btn-material': ui.toggleMenu,
	});
	// initNavMenus();
	// attachMouseListener();
}

// DOM events

function toggleInsertSnippet(persistent) {
  if ($('#in-my-files').classList.contains('active')) return

  let el = $('.search-box')[0];
  if (typeof(persistent) == 'undefined')
    el.classList.toggle('w3-hide');
  else
    el.classList.toggle('w3-hide', !persistent);

  if (!el.classList.contains('w3-hide')) {
    $('#search-input').value = '';
    setTimeout(() => { $('#search-input').focus(); }, 1);
  } else {
    setTimeout(() => { document.activeElement.blur() }, 1);
    if (typeof(persistent) === 'undefined')
      fileTab[activeTab].editor.env.editor.focus();
    $('#search-input').value = '';
    $('#search-input').blur();
  }
}

function openPreviewWindow() {
  if (!$('#btn-menu-my-files').classList.contains('active')) {
    let filePath = previewHandler.getPath();
    // delayed to focus
    setTimeout(() => {
      window.open(environment.previewUrl+filePath, previewHandler.getFrameName());
    }, 1)
  }
}

function setEditorMode(fileName = '') {
  let editor = fileTab[activeTab].editor.env.editor;
  if (fileName.endsWith('.txt'))
    editor.session.setMode();
  else if (fileName.endsWith('.css'))
    editor.session.setMode("ace/mode/css");
  else if (fileName.endsWith('.js'))
    editor.session.setMode("ace/mode/javascript");
  else if (fileName.endsWith('.json'))
    editor.session.setMode("ace/mode/json");
  else
    editor.session.setMode("ace/mode/html");
}

function initEditor(content = '', scrollTop = 0, row = 0, col = 0) {
  let editorElement = document.createElement('div');
  editorElement.classList.add('editor');
  editorElement.style.opacity = '0'
  let editor = ace.edit(editorElement);

  editor.setTheme("ace/theme/codetmp", () => {
    editorElement.style.opacity = '1';
  });
  editor.session.setMode("ace/mode/html");
  editor.session.setUseWrapMode(settings.data.editor.wordWrapEnabled);
  editor.session.setTabSize(2);
  editor.setFontSize(editorManager.fontSize);
  editor.clearSelection();
  editor.focus();
  editor.moveCursorTo(0,0);

  editor.commands.addCommand({
    name: "movelinesup",
    bindKey: {win:"Ctrl-Shift-Up"},
    exec: function(editor) {
      editor.moveLinesUp();
    }
  });
  editor.commands.addCommand({
    name: "movelinesdown",
    bindKey: {win:"Ctrl-Shift-Down"},
    exec: function(editor) {
      editor.moveLinesDown();
    }
  });
  editor.commands.addCommand({
    name: "select-or-more-after",
    bindKey: {win:"Ctrl-D"},
    exec: function(editor) {
      if (editor.selection.isEmpty()) {
        editor.selection.selectWord();
      } else {
        editor.execCommand("selectMoreAfter");
      }
    }
  });
  editor.commands.addCommand({
    name: "removeline",
    bindKey: {win: "Ctrl-Shift-K"},
    exec: function(editor) {
      editor.removeLines();
    }
  });
  
  editor.commands.addCommand({
    name: "custom-copy",
    bindKey: {win: "Ctrl-C"},
    exec: function(editor) {
      let selection = editor.getSelectionRange();
      if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
        let row = selection.start.row
        let col = selection.start.column
        editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}})
        document.execCommand('copy');
        editor.clearSelection();
        editor.moveCursorTo(row, col);
        editorManager.isPasteRow = true;
      } else {
        document.execCommand('copy');
        editorManager.isPasteRow = false;
      }
    }
  });
  
  editor.commands.addCommand({
    name: "custom-cut",
    bindKey: {win: "Ctrl-X"},
    exec: function(editor) {
      let selection = editor.getSelectionRange();
      if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
        let row = selection.start.row
        editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}})
        document.execCommand('cut');
        editorManager.isPasteRow = true;
      } else {
        document.execCommand('cut');
        editorManager.isPasteRow = false;
      }
    }
  });

  editor.commands.addCommand({
    name: "decrease-font-size",
    bindKey: {win: "Ctrl--"},
    exec: function(editor) {
      event.preventDefault();
      editorManager.changeFontIndex(-1);
    }
  });
  editor.commands.addCommand({
    name: "increase-font-size",
    bindKey: {win: "Ctrl-="},
    exec: function(editor) {
      event.preventDefault();
      editorManager.changeFontIndex(+1);
    }
  });
  editor.commands.addCommand({
    name: "reset-font-size",
    bindKey: {win: "Ctrl-0"},
    exec: function(editor) {
      event.preventDefault();
      editorManager.changeFontIndex(0);
    }
  });
  editor.commands.addCommand({
    name: "gotoline",
    bindKey: {win: "Ctrl-G"},
    exec: function(editor, line) {
      if (typeof line === "number" && !isNaN(line))
          editor.gotoLine(line);
      editor.prompt({ $type: "gotoLine" });
    },
  });
  editor.setValue(content)
  editor.clearSelection();
  editor.getSession().setUndoManager(new ace.UndoManager())
  editor.focus();
  editor.getSession().setScrollTop(scrollTop);
  editor.moveCursorTo(row, col);
  editor.commands.removeCommand('fold');
  editor.session.on("change", function(delta) {
    fileTab[activeTab].fiber = 'fiber_manual_record';
    $('.icon-rename')[activeTab].textContent = 'fiber_manual_record';
    $('.icon-rename')[activeTab].classList.toggle('w3-hide', false);
  })
   
  if (settings.data.editor.emmetEnabled) {
    editor.setOption('enableEmmet', true);
  }
  if (settings.data.editor.autoCompleteEnabled) {
    editor.setOptions({
      'enableBasicAutocompletion': true,
      'enableSnippets': true,
      'enableLiveAutocompletion': true,
    });
  }

  return editorElement;
}


// tab

// to do: remove after replacing all call to related component
function listTab() {
 	tabManager.list();
}

function newTab(position, data) {
  tabManager.newTab(position, data);
}

function focusTab(fid) {
  tabManager.focusTab(fid);
}

function getTabWidth() {
  let width = 0;
  for (let tab of $('.file-tab'))
    width += tab.offsetWidth;
  return width;
}

function fileClose(fid) {
  let idx;
  if (fid)
    idx = odin.idxOf(String(fid), fileTab, 'fid')
  else
    idx = activeTab
  
  if (activeTab == idx) {
    activeTab = idx
    confirmCloseTab()
  } else {
    let tmp = activeTab;
    activeTab = idx;
    if (idx < tmp)
      confirmCloseTab(true, tmp-1)
    else
      confirmCloseTab(true, tmp)
  }
}

function confirmCloseTab(focus = true, comeback) {
  if (focus) {
    if ($('.file-tab')[activeTab].firstElementChild.firstElementChild.textContent.trim() != 'close') {
        modal.confirm('Changes you made will be lost.').then(() => {
          tabManager.changeFocusTab(focus, comeback);
        }).catch(() => fileTab[activeTab].editor.env.editor.focus())
      } else {
        tabManager.changeFocusTab(focus, comeback);
      } 
  } else {
    closeActiveTab()
  }
}

function closeActiveTab() {
	let fid = parseInt(fileTab[activeTab].fid); 
	window.app.getComponent('file-tree').then(fileTree => {
	  fileTree.removeOpenIndicator(fid);
	});
  $('#file-title').removeChild($('.file-tab')[activeTab]);
  fileTab.splice(activeTab, 1);
}

function changeFocusTab(focus, comeback) {
  tabManager.changeFocusTab(focus, comeback);
}

function initTabFocusHandler() {

  function tabFocusHandler(e) {
    if (e.keyCode === 9) {
      document.body.classList.add('tab-focused');
      window.removeEventListener('keydown', tabFocusHandler);
      window.addEventListener('mousedown', disableTabFocus);
    }
  }

  function disableTabFocus() {
    document.body.classList.remove('tab-focused');
    window.removeEventListener('mousedown', disableTabFocus);
    window.addEventListener('keydown', tabFocusHandler);
  }

  window.addEventListener('keydown', tabFocusHandler);
}

// explorer, DOM events

(function() {
  
  function navigateHorizontal(target) {
    let last = selectedFile[selectedFile.length-1];
    let next = last[target];
    while (next) {
      if (next.classList.contains('separator')) {
        next = next[target];
      } else {
    	if (!pressedKeys.shiftKey)
        	clearSelection();
        next.click();
        break;
      }
    }
  }

  function navigateVertical(target) {
    let w = $('#file-list .separator').offsetWidth;
    let padding = 4;
    let f = selectedFile[0].offsetWidth + padding;
    let cols = Math.floor(w/f)
    let folders = $('.folder-list');
    let last = selectedFile[selectedFile.length-1];
    let no = parseInt(last.dataset.number);
    let targetNo = target == 'previousElementSibling' ? no - cols : no + cols;
    let selTarget = last;
    let next = last[target];

    while (next) {
      if (next.classList.contains('separator')) {
        next = next[target];
        if (targetNo < 1) {
          targetNo = Math.ceil(folders.length / cols) * cols + targetNo;
          if (targetNo > folders.length)
            targetNo = Math.max(folders.length % cols, targetNo - cols);
        } else {
          targetNo = targetNo % cols;
          if (targetNo === 0)
            targetNo = cols;
        }
        continue;
      }

      selTarget = next;
      if (parseInt(next.dataset.number) == targetNo)
        break;
      else 
        next = next[target];
    }

    if (!pressedKeys.shiftKey)
    	clearSelection();
    selTarget.click();
  }
  
  function selectFirstFile() {
    if ($('.folder-list').length > 0) {
      $('.folder-list')[0].click();
      return true;
    } else if ($('.file-list').length > 0) {
      $('.file-list')[0].click();
      return true;
    }
    return false;
  }
  
  function navigationHandler() {
    
    if (stateManager.isState(1))
      return

    if (!$('#btn-menu-my-files').classList.contains('active')) return;
    event.preventDefault();
    switch (event.keyCode) {
      case 37:
      case 38:
        if (selectedFile.length > 0) {
          if (event.keyCode == 37 || (event.keyCode == 38 && settings.data.explorer.view == 'list'))
            navigateHorizontal('previousElementSibling');
          else
            navigateVertical('previousElementSibling');
          navScrollUp();
        }
      break;
      case 39:
      case 40:
        if (selectedFile.length == 0) {
          if (selectFirstFile())
            navScrollUp();
        } else {
          if (event.keyCode == 39 || (event.keyCode == 40 && settings.data.explorer.view == 'list'))
            navigateHorizontal('nextElementSibling');
          else
            navigateVertical('nextElementSibling');
          navScrollDown();
        }
      break;
    }
  }

  window.navigationHandler = navigationHandler;
  
})();


// drive
function autoSync(event) {
  let isOnline = navigator.onLine ? true : false;
  if (isOnline) {
    if (fileStorage.data.rootId !== '') {
      drive.syncFromDrive();
      drive.syncToDrive();
    }
  }
}

// auth
function authReady() {
  $('body')[0].classList.toggle('is-authorized', true);
  if (fileStorage.data.rootId === '') {
    drive.readAppData();
  } else {
    drive.syncFromDrive();
    drive.syncToDrive();
  }
  let uid = gapi.auth2.getAuthInstance().currentUser.get().getId();
  support.check('firebase');
}
function authLogout() {
  fileStorage.reset();
  settings.reset();
  notif.reset();
  ui.reloadFileTree();

  $('body')[0].classList.toggle('is-authorized', false);
  support.check('firebase');
  
  activeFolder = -1;
  while (breadcrumbs.length > 1)
    breadcrumbs.splice(1,1);    
  loadBreadCrumbs();
  fileManager.list();
}

function signOut() {
  auth2.signOut();
  authLogout();
  gapi.auth2.getAuthInstance().signOut().then(function() {
    console.log('User signed out.');
  });
}

function renderSignInButton() {
  gapi.signin2.render('g-signin2', {
    'scope': 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive'+auth2.additionalScopes,
    'width': 240,
    'height': 50,
    'longtitle': true,
    'theme': 'dark',
    'onsuccess': (googleUser) => {
      auth2.onSignIn(googleUser);
      authReady();
    },
  });
}

// explorer

function toggleHomepage() {
  $('#sidebar').classList.toggle('HIDE');
  $('#in-home').classList.toggle('active');
  $('#main-editor').classList.toggle('editor-mode');
  if ($('#in-my-files').classList.contains('active'))
    $('#btn-menu-my-files').click();
}

function renameFile() {
  if (selectedFile[0].dataset.type === 'folder')
    ui.fileManager.renameFolder();
  else
    ui.fileManager.renameFile();
}

function changeExplorerView(type) {
  if (!['list', 'grid'].includes(type))
    return;

  settings.data.explorer.view = type;
  settings.save();
  $('#file-list').classList.toggle('list-view', (type == 'list'));
  for (let node of $('.Btn[data-callback="change-file-list-view"]')) {
    node.classList.toggle('active', false);
    if (node.dataset.type == type) {
      node.classList.toggle('active', true);
      $('#view-type-icon').innerHTML = $('.material-icons', node)[0].innerHTML;
    }
  }
}

function loadBreadCrumbs() {
  $('#breadcrumbs').innerHTML = '';
  let i = 0;
  for (let b of breadcrumbs) {
    let button = $('#tmp-breadcrumb').content.cloneNode(true).firstElementChild;
    button.textContent = b.title;
    if (i == breadcrumbs.length-1) {
      button.classList.add('isActive');
    } else {
      button.dataset.fid = b.folderId;
      button.addEventListener('click', openBread);
    }
    $('#breadcrumbs').appendChild(button);
    i++;
  }
  let parentNode = $('#breadcrumbs').parentNode;
  parentNode.scrollTo(parentNode.scrollWidth, 0);
}

function openBread() {
  let fid = this.dataset.fid;
  activeFolder = parseInt(fid);
  if (this.textContent == '..') {
	  fileManager.reloadBreadcrumb();
  } else {
	  let idx = odin.idxOf(fid,breadcrumbs,'folderId');
	  breadcrumbs = breadcrumbs.slice(0,idx+1);
  }
  fileManager.list();
  clearSelection();
}

function openFileConfirm(el) {
  let index = selectedFile.indexOf(el);
  if (pressedKeys.shiftKey || pressedKeys.ctrlKey) {
    fileExplorerManager.doubleClick = false;
    if (index < 0) {
      if (pressedKeys.shiftKey) {
        if (selectedFile.length === 0) {
          selectedFile.push(el);
          toggleFileHighlight(el, true);  
        } else {
          let last = selectedFile[selectedFile.length-1];
          clearSelection();
          selectedFile.push(last)

          let direction = 'previousElementSibling';
          let ele = last.nextElementSibling; 
          while (ele) {
            if (ele === el) {
              direction = 'nextElementSibling';
              break
            } else {
              ele = ele.nextElementSibling;
            }
          }

          let next = last[direction];
          while (next) {
            if (next.classList.contains('separator')) {
              next = next[direction];
            } else {
              selectedFile.push(next);
              if (next === el)
                break;
              next = next[direction];
            }
          }

          for (let sel of selectedFile)
            toggleFileHighlight(sel, true);  
        }
      } else {
        selectedFile.push(el);
        toggleFileHighlight(el, true);
      }
    } else {
      if (pressedKeys.shiftKey) {

      } else {
        selectedFile.splice(index, 1);
        toggleFileHighlight(el, false);
      }
    }
    ui.toggleFileActionButton();
    return
    
  } else {
    
    for (let el of selectedFile)
      toggleFileHighlight(el, false);
        
    if (selectedFile.length > 1) {
      selectedFile.length = 0;
      index = -1;
    }

    if (index < 0) {
      selectedFile[0] = el;
      fileExplorerManager.doubleClick = false;
      toggleFileHighlight(el, false);
    } 
  }
  
  if (!fileExplorerManager.doubleClick) {
    fileExplorerManager.lastClickEl = el;
    fileExplorerManager.doubleClick = true;
    toggleFileHighlight(fileExplorerManager.lastClickEl, true);
    setTimeout(function(){
      fileExplorerManager.doubleClick = false;
    }, 500);
  } else {
    let type = selectedFile[0].dataset.type;
    selectedFile.splice(0, 1);
    fileExplorerManager.doubleClick = false;
    if (type == 'file') {
      fileManager.open(el.getAttribute('data'))
    } else {
      let folderId = Number(el.getAttribute('data'))
      fileManager.openFolder(folderId);
    }
    toggleFileHighlight(fileExplorerManager.lastClickEl, false);
  }
  ui.toggleFileActionButton();
}

function navScrollUp() {
  let fileContainerOffsetTop = selectedFile[0].offsetTop;
  let customDefinedGap = 34;
  let scrollTop = (fileContainerOffsetTop - customDefinedGap + $('#status-bar').offsetHeight);
  if (scrollTop < $('#file-list').parentNode.scrollTop) {
    $('#file-list').parentNode.scrollTop = scrollTop;
  }
}

function navScrollDown() {
  let fileContainerOffsetTop = selectedFile[0].offsetTop;
  let padding = 16;
  let customDefinedGap = 28;
  let scrollTop = (fileContainerOffsetTop + selectedFile[0].offsetHeight + padding + $('#status-bar').offsetHeight);
  let visibleScreenHeight = $('#file-list').parentNode.scrollTop + customDefinedGap + $('#file-list').parentNode.offsetHeight;
  if (scrollTop > visibleScreenHeight)
    $('#file-list').parentNode.scrollTop += scrollTop - visibleScreenHeight;
}

function toggleFileHighlight(el, isActive) {
  if (el === undefined) return;
  el.classList.toggle('isSelected', isActive);
}

function clearSelection() {
	for (let el of selectedFile)
		toggleFileHighlight(el, false);
	selectedFile.length = 0;
	fileExplorerManager.lastClickEl = null;
  ui.toggleFileActionButton();
}

function selectAllFiles() {
	if (stateManager.isState(0)) {
    event.preventDefault();
		selectedFile = [...$('.folder-list, .file-list')];
		for (let el of selectedFile)
			toggleFileHighlight(el, true);
    ui.toggleFileActionButton();
	}
}

function previousFolder() {
  if ($('#btn-menu-my-files').classList.contains('active') && $('.breadcrumbs').length > 1) {
    event.preventDefault();
    $('.breadcrumbs')[$('.breadcrumbs').length-2].click()
  }
}

function doubleClickOnFile() {
  selectedFile[0].click();
  if (selectedFile[0])
    selectedFile[0].click();
}

function selectFileByName(key) {
  let found = false;
  let matchName = [];
  for (let el of $('.folder-list')) {
    if (el.title.toLowerCase().startsWith(key)) {
      matchName.push(el);
    }
  }

  for (let el of $('.file-list')) {
    if (el.title.toLowerCase().startsWith(key)) {
      matchName.push(el);
    }
  }

  if (matchName.length == 0) {
    if (selectedFile.length > 0) {
      toggleFileHighlight(fileExplorerManager.lastClickEl, false);
      fileExplorerManager.doubleClick = false;
      selectedFile.length = 0;
    }
  }

  if (typeof(selectedFile[0]) == 'undefined') {
    if (matchName.length > 0) {
      matchName[0].click();
      navScrollUp();
      navScrollDown();
    }
  } else {
    let selectedIndex = matchName.indexOf(selectedFile[0]);
    if (selectedIndex < 0) {
      if (matchName.length > 0) {
        matchName[0].click();
        navScrollUp();
        navScrollDown();
      }
    } else {
      if (matchName.length > 1) {
        selectedIndex = selectedIndex + 1 == matchName.length ? 0 : selectedIndex + 1;
        matchName[selectedIndex].click();
        navScrollUp();
        navScrollDown();
      }
    }
  }
}

window.addEventListener('keydown', e => {
  if (e.ctrlKey && e.keyCode == 13)
    openPreviewWindow();  
});
window.addEventListener('online', autoSync);
window.addEventListener('cut', fileClipBoard.handler);
window.addEventListener('copy', fileClipBoard.handler);
window.addEventListener('paste', fileClipBoard.handler);
window.onbeforeunload = helper.redirectWarning;