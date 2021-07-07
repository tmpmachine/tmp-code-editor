registerComponent('file-tree', new FileTreeComponent());

function FileTreeComponent() {

  this.appendFolder = function(file) {
    let parentNode = $(`.folder-name[data-fid="${file.parentId}"]`)[0];
    if (parentNode) {
      parentNode = parentNode.nextElementSibling;
      let node = $('#tmp-file-tree-directory').content.cloneNode(true);
      let span = $('.folder-name', node)[0];
      span.textContent = file.name
      span.dataset.fid = file.fid
      span.dataset.title = file.name
      // span.addEventListener('click', this.openDirectoryTree);
      $('li', node)[0].classList.add('folder-root');
      $('li', node)[0].classList.add('closed');
      this.insertToSubtree(file.name, node, parentNode);
    }
  }

  this.appendFile = function(file) {
    let parentNode = $(`.folder-name[data-fid="${file.parentId}"]`)[0];
    if (parentNode && parentNode.nextElementSibling.classList.contains('isLoaded')) {
      parentNode = parentNode.nextElementSibling;
      let node = $('#tmp-file-tree-file').content.cloneNode(true);
      let span = $('.file-name', node)[0];
      span.textContent = file.name
      span.dataset.title = file.name
      span.dataset.fid = file.fid
      span.dataset.parent = file.parentId
      // span.addEventListener('dblclick', fileManager.openFileByElementFidDataset);
      this.insertFileToSubtree(file.name, node, parentNode);
    }
  }

  this.insertToSubtree = function(fileName, node, parentNode, type='folder') {
    if (!parentNode.classList.contains('isLoaded')) {
      return false;
    }

    parentNode.append(node)
    let x2 = parentNode.children;
    let b = [];
    let offsetIndex = 0;
    if (type == 'folder') {
      for (let i=0; i<x2.length;i++) {
        if (x2[i].classList.contains('folder-root'))
          b.push(x2[i]);
      } 
    } else {
      for (let i=0; i<x2.length;i++) {
        if (x2[i].classList.contains('folder-root'))
          offsetIndex++;
        else
          b.push(x2[i]);
      }
    }
    b.sort((a,b) => a.firstElementChild.textContent.toLowerCase() < b.firstElementChild.textContent.toLowerCase() ? -1 : 1)
    for (let i=0; i<b.length;i++) {
      if (b[i].firstElementChild.textContent == fileName) {
        if (x2[i+offsetIndex].firstElementChild.textContent != fileName) {
          parentNode.insertBefore(b[i], x2[i+offsetIndex]);
        }
        break;
      }
    }
    return true;
  }

  this.insertFileToSubtree = function(fileName, node, parentNode) {
    return this.insertToSubtree(fileName, node, parentNode, 'file');
  }

  this.removeFolder = function(file) {
    let span = $(`.folder-name[data-fid="${file.fid}"]`)[0];
    if (!span)
      return
    let li = span.parentNode;
    li.remove();
  }

  this.removeFile = function(file) {
    let span = $(`.file-name[data-fid="${file.fid}"]`)[0];
    if (!span)
      return
    let li = span.parentNode;
    li.remove();
  }

  this.renameItem = function(file, type) {
    let span = $(`.${type}-name[data-fid="${file.fid}"]`)[0];
    if (!span)
      return
    span.textContent = file.name;
    if (type == 'file')
      this.insertFileToSubtree(file.name, span.parentNode, span.parentNode.parentNode);
    else
      this.insertToSubtree(file.name, span.parentNode, span.parentNode.parentNode);
  }

  this.moveItemFrom = function(type, fid, targetParentId) {
    let span = $(`.${type}-name[data-fid="${fid}"]`)[0];
    let targetSpan = $(`.folder-name[data-fid="${targetParentId}"]`)[0];
    if (!span || !targetSpan)
      return;
    let li = span.parentNode;
    let isAppended = false;
    if (type == 'file') {
      span.dataset.parent = targetParentId;
      isAppended = this.insertFileToSubtree(span.textContent, li, targetSpan.nextElementSibling);
    } else {
      isAppended = this.insertToSubtree(span.textContent, li, targetSpan.nextElementSibling);
    }
    // sub tree have not opened/loaded yet
    if (!isAppended)
      li.remove();
  }

  this.openDirectoryTree = function(target, isForceOpen = false) {
    let isOpened;
    if (isForceOpen)
      isOpened = target.parentNode.classList.toggle('open', true);
    else
      isOpened = target.parentNode.classList.toggle('open');
    let isLoaded = target.nextElementSibling.classList.contains('isLoaded');
    if (isOpened && !isLoaded) {
      listTree(target.dataset.fid, target.parentNode)
    }
  }

  this.openFileByElementFidDataset = function(target) {
    fileManager.open(target.dataset.fid)
  }

  this.highlightTree = function(fid) {
    removeTreeFocus();
    let node = $(`.file-name[data-fid="${fid}"]`)[0];
    if (node) {
      revealTreeDirectory(node, fid);
      node.classList.add('--focus', '--opened');
      node.setAttribute('tabindex', 0);
      node.focus();
      node.removeAttribute('tabindex');
    } else {
      this.loadAndRevealTreeDirectory(fid);
    }
  }

  function removeTreeFocus() {
    let node = $(`.file-name.--focus`);
    if (node.length > 0)
      node[0].classList.toggle('--focus', false);
  }

  this.removeOpenIndicator = function(fid) {
    let node = $(`.file-name[data-fid="${fid}"]`)[0];
    if (node) {
      node.classList.remove('--opened');
    }
  }

  function revealTreeDirectory(node, fid) {
    let isRoot = node.parentNode.parentNode.classList.contains('file-tree');
    let temp  = [];
    while (!isRoot) {
      node = node.parentNode.parentNode.previousElementSibling;
      let dirTree = node.parentNode;
      temp.push(dirTree);
      isRoot = node.parentNode.parentNode.classList.contains('file-tree');
    }
    for (var i = temp.length - 1; i >= 0; i--) {
      temp[i].classList.toggle('open', true);
    }
  }

  this.loadAndRevealTreeDirectory = function(fid) {
    if (parseInt(fid) < 0)
      return;

    let file = fileManager.get({fid, type: 'files'});
    let temp = [];
    let flaggedNode;

    while (true) {
      let node = $(`.folder-name[data-fid="${file.parentId}"]`)[0];
      if (node) {
        temp.push(file.parentId);
        flaggedNode = node;
        break;
      } else {
        if (file.parentId == -1)
          break;
        file = fileManager.get({fid: file.parentId, type: 'folders'})
        temp.push(file.fid);
      }
    }

    let isForceOpen = true
    for (var i = temp.length - 1; i >= 0; i--) {
      let span = $(`.folder-name[data-fid="${temp[i]}"]`)[0];
      let li = span.parentNode;   
      this.openDirectoryTree(span, isForceOpen);
    }

    revealPathToRoot(flaggedNode);

    let node = $(`.file-name[data-fid="${fid}"]`)[0];
    if (node) {
      node.classList.toggle('--focus', true);
      node.setAttribute('tabindex', 0);
      node.focus();
      node.removeAttribute('tabindex');
    }
  }

  function revealPathToRoot(span) {
    let subtree = span.parentNode.parentNode.parentNode;
    let isRoot = (subtree.firstElementChild.dataset.fid == '-1');
    let temp  = [];
    while (!isRoot) {
      temp.push(subtree);
      subtree = subtree.parentNode.parentNode;
      isRoot = (subtree.firstElementChild.dataset.fid == '-1');
    }
    for (var i = temp.length - 1; i >= 0; i--) {
      temp[i].classList.toggle('open', true);
    }
  }

  this.reload = function () {
    $('#file-tree > li > ul').innerHTML = '';
    listTree();
  }

  function listTree(fid = null, parentNode = null) {

    let fm = fileManager;
    let folders = (fid === null) ? fm.getListFolder(-1) : fm.getListFolder(parseInt(fid));
    let files = (fid === null) ? fm.getListFiles(-1) : fm.getListFiles(parseInt(fid));
    if (fid == null) {
      parentNode = $('#file-tree .folder-name[data-fid="-1"]').nextElementSibling;
    } else {
      parentNode = $('ul',parentNode)[0];
      parentNode.classList.toggle('isLoaded', true);
    }

    for (var i = 0; i < folders.length; i++) {
      let node = $('#tmp-file-tree-directory').content.cloneNode(true);
      let span = $('.folder-name', node)[0];
      span.textContent = folders[i].name
      span.dataset.fid = folders[i].fid
      span.dataset.title = folders[i].name
      $('li', node)[0].classList.add('folder-root');
      $('li', node)[0].classList.add('closed');
      parentNode.append(node)
    }

    for (var i = 0; i < files.length; i++) {
      let node = $('#tmp-file-tree-file').content.cloneNode(true);
      let span = $('.file-name', node)[0];
      span.textContent = files[i].name
      span.dataset.title = files[i].name
      span.dataset.fid = files[i].fid
      span.dataset.parent = files[i].parentId
      parentNode.append(node)
    }

  };

  this.attachListener = function() {
    document.getElementById('file-tree').addEventListener("contextmenu", e => {
      let isDirectory = true;
      if (e.target.classList.contains('folder-name')) {
        e.preventDefault();
        updateTreeBreadcrumbs(e.target.dataset.fid, e.target, isDirectory)
      } else if (e.target.classList.contains('file-name')) {
        isDirectory = false;
        e.preventDefault();
        updateTreeBreadcrumbs(e.target.dataset.parent, e.target, isDirectory)
      }
    });

    document.getElementById('file-tree').addEventListener("click", e => {
      let elClass = e.target.classList;
      if (elClass.contains('folder-name')) {
        if (e.target.dataset.fid == '-1')
          return
        getComponent('file-tree').openDirectoryTree(e.target);
      } else if (['file-name','--opened'].every(cls => elClass.contains(cls))) {
        getComponent('file-tree').openFileByElementFidDataset(e.target);
      }
    });

    document.getElementById('file-tree').addEventListener("dblclick", e => {
      if (e.target.classList.contains('file-name')) {
        getComponent('file-tree').openFileByElementFidDataset(e.target);
      }
    });
  }

  function updateTreeBreadcrumbs(fid, node, isDirectory = true) {

    if (!$('#in-my-files').classList.contains('active'))
      $('#btn-menu-my-files').click();
    if (activeFolder == fid)
      return

    breadcrumbs.splice(1);
    let isRoot = node.parentNode.parentNode.classList.contains('file-tree');
    while (!isRoot) {
      if (isDirectory) {
        if (node.dataset.fid != '-1')
          breadcrumbs.splice(1, 0, {folderId:node.dataset.fid, title: node.textContent})
      } else {
        isDirectory = true;
      }
      node = node.parentNode.parentNode.previousElementSibling;
      isRoot = node.parentNode.parentNode.classList.contains('file-tree');
      if (isRoot) {
        if (node.dataset.fid != '-1')
          breadcrumbs.splice(1, 0, {folderId:node.dataset.fid, title: node.textContent})
      } 
    }

    loadBreadCrumbs();
    
    if (breadcrumbs.length > 1)
      breadcrumbs.pop();
    fileManager.openFolder(fid);

  }

  // end of component
}


getComponentAsPromise('file-tree').then(ft => {
  ft.reload();
  ft.attachListener();
  if (settings.data.explorer.tree) {
    document.body.classList.toggle('--tree-explorer', true);
  }
  $('.tree-explorer')[0].classList.toggle('d-none', false);
  $('.tree-explorer-btn-expand')[0].classList.toggle('d-none', false);
});