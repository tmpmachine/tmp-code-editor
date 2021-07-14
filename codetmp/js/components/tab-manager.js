const tabManager = new TabManagerComponent();

function TabManagerComponent() {

  this.lastOpenTabIndex = 0;

  this.focusTab = function(fid, isRevealFileTree = true) {
    let idx = odin.idxOf(String(fid), fileTab, 'fid');
    
    for (let tab of $('.file-tab')) {
      tab.classList.toggle('isActive', false);
    }
    
    ui.highlightTree(fid, isRevealFileTree);

    $('.file-tab')[idx].classList.toggle('isActive', true);
    
    compressTab(idx);
    activeTab = idx;
    $('#editor-wrapper').innerHTML = '';
    $('#editor-wrapper').append(fileTab[idx].editor)
    
    fileTab[idx].editor.env.editor.focus();
    fileTab[idx].editor.env.editor.session.setUseWrapMode(settings.data.editor.wordWrapEnabled);
    fileTab[idx].editor.env.editor.setFontSize(editorManager.fontSize);
    activeFile = (String(fid)[0] == '-') ? null : fileTab[activeTab].file;
    setEditorMode(fileTab[activeTab].name);  
  };

  function compressTab(idx) {
    for (let tab of $('.file-tab'))
      tab.style.display = 'inline-block';

    $('#more-tab').style.display = ($('.file-tab').length > 1 && getTabWidth() >= $('#file-title').offsetWidth - 48) ? 'inline-block' : 'none';
    let maxOpenTab = Math.floor(($('#file-title').offsetWidth - 48) / $('.file-tab')[idx].offsetWidth);

    if ($('.file-tab').length > maxOpenTab) {
      let lastOpenedTabIndex = Math.max(idx, $('.file-tab').length - 1);
      let firstOpenedTabIndex = Math.max(lastOpenedTabIndex - (maxOpenTab - 1), 0);
      
      if (idx >= tabManager.lastOpenTabIndex && idx <= tabManager.lastOpenTabIndex + maxOpenTab - 1) {
        firstOpenedTabIndex = tabManager.lastOpenTabIndex;
        lastOpenedTabIndex = firstOpenedTabIndex + maxOpenTab - 1;
      }
      
      while (idx < firstOpenedTabIndex) {
        lastOpenedTabIndex--;
        firstOpenedTabIndex--;
      }
      
      for (let i=0; i<$('.file-tab').length; i++) {
        if (i < firstOpenedTabIndex || i > lastOpenedTabIndex)
          $('.file-tab')[i].style.display = 'none';
        else
          $('.file-tab')[i].style.display = 'inline-block';
      }
      
      tabManager.lastOpenTabIndex = firstOpenedTabIndex;
    }
  }

  this.changeFocusTab = function(focus, comeback) {
    closeActiveTab()
    if (fileTab.length == 0) {
      newTab()
      activeFile = null;
    } else {
      if (comeback === undefined) {
        let isRevealFileTree = false;
        if (activeTab == 0)
          tabManager.focusTab(fileTab[0].fid, isRevealFileTree);
        else
          tabManager.focusTab(fileTab[activeTab-1].fid, isRevealFileTree);
      }
    }
  };

}