let deferFeature1 = {

  // explorer
  lockFile: function () {
    if ($('#btn-menu-my-files').classList.contains('active')) {
      if (selectedFile.length === 1 && selectedFile[0].dataset.type == 'file') {
        let fid = selectedFile[0].dataset.fid;
        if (locked !== fid) {
          locked = parseInt(fid);
          aww.pop('Preview file locked');
        } else {
          locked = -1;
          aww.pop('Preview file unlocked');
        }
      }
    } else {
      let fid = fileTab[activeTab].fid;
      let notFile = false;
      if (typeof(fid) == 'string') {
        locked = -1;
        notFile = true;
      } else
        locked = (locked == fid) ? -1 : fid;
      
      if (locked == fid || notFile) {
        aww.pop('Preview file locked');
        $('.file-tab')[activeTab].lastElementChild.style.background = 'orange';
        clearTimeout(lockFile.wait);
        lockFile.wait = setTimeout(() => {
          $('.file-tab')[activeTab].lastElementChild.style.background = '#FFEB3B';
        }, 200)
      } else {
        aww.pop('Preview file unlocked');
        $('.file-tab')[activeTab].lastElementChild.style.background = 'inherit';
        clearTimeout(lockFile.wait);
        lockFile.wait = setTimeout(() => {
          $('.file-tab')[activeTab].lastElementChild.style.background = '#FFEB3B';
        }, 200)
      }
    }
  },

  toggleFileInfo: function() {
    if (!stateManager.isState(0))
      toggleModal('file-info');
  },

  openFileDirectory: function() {
    if (!activeFile || $('#btn-menu-my-files').classList.contains('active')) return
    breadcrumbs.splice(1);
    let stack = [];
    let parentId = activeFile.parentId;
    while (parentId != -1) {
      folder = fileManager.get({fid: parentId, type: 'folders'});
      breadcrumbs.splice(1, 0, {folderId:folder.fid, title: folder.name})
      parentId = folder.parentId
    }
    loadBreadCrumbs();
    $('#btn-menu-my-files').click();
    
    if (breadcrumbs.length > 1)
      breadcrumbs.pop();
    fileManager.openFolder(activeFile.parentId);
  },

  // editor
  copyUploadBody: function() {
    let textarea = document.createElement('textarea');
    textarea.style.height = '0';
    document.body.append(textarea);
    previewHTML(true);
    textarea.value = uploadBody;
    textarea.select();
    document.execCommand('copy');
    aww.pop('Copied to clipboard');
    document.body.removeChild(textarea)
    fileTab[activeTab].editor.env.editor.focus()
  },

  toggleWrapMode: function() {
    settings.data.wrapMode = !settings.data.wrapMode;
    settings.save();
    focusTab(fileTab[activeTab].fid);
  },

  handlePasteRow: function() {
    if (editorManager.isPasteRow) {
      let editor = fileTab[activeTab].editor.env.editor;
      let selection = editor.getSelectionRange();
      let row = selection.start.row
      let col = selection.start.column
      editor.clearSelection();
      editor.moveCursorTo(row, 0);
      setTimeout(function() {
        editor.moveCursorTo(row+1, col);
      }, 1);
    }
  },

  toggleTemplate: function() {
    event.preventDefault();
      $('#btn-menu-template').click();
  }

};