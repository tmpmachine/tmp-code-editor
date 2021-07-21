"use strict";
(function() {
  // TODO: remove local query selector after updating all components that use
  let $ = function(selector, node=document) { return node.querySelectorAll(selector) };

  window.app.registerComponent('file-tree', FileTreeComponent());

  function FileTreeComponent() {

    const SELF = {
      workspaceId: -1, // folder FID
    };

    SELF.appendFolder = function(file) {
      let nodes = $(`.folder-name[data-fid="${file.parentId}"]`);
      if (nodes.length > 0) {
        for (let parentNode of nodes) {
          if (parentNode) {
            parentNode = parentNode.nextElementSibling;
            let node = $('#tmp-file-tree-directory')[0].content.cloneNode(true);
            let span = $('.folder-name', node)[0];
            span.textContent = file.name
            span.dataset.fid = file.fid
            span.dataset.title = file.name
            // span.addEventListener('click', SELF.openDirectoryTree);
            $('li', node)[0].classList.add('folder-root');
            $('li', node)[0].classList.add('closed');
            SELF.insertToSubtree(file.name, node, parentNode);
          }
        }
      }
    }

    SELF.appendFile = function(file) {
      let nodes = $(`.folder-name[data-fid="${file.parentId}"]`);
      if (nodes.length > 0) {
        for (let parentNode of nodes) {
          if (parentNode.nextElementSibling.classList.contains('isLoaded')) {
            parentNode = parentNode.nextElementSibling;
            let node = $('#tmp-file-tree-file')[0].content.cloneNode(true);
            let span = $('.file-name', node)[0];
            span.textContent = file.name
            span.dataset.title = file.name
            span.dataset.fid = file.fid
            span.dataset.parent = file.parentId
            // span.addEventListener('dblclick', fileManager.openFileByElementFidDataset);
            SELF.insertFileToSubtree(file.name, node, parentNode);
          }
        }
      }
    }

    SELF.insertToSubtree = function(fileName, node, parentNode, type='folder') {
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

    SELF.insertFileToSubtree = function(fileName, node, parentNode) {
      return SELF.insertToSubtree(fileName, node, parentNode, 'file');
    }

    SELF.removeFolder = function(file) {
      let nodes = $(`.folder-name[data-fid="${file.fid}"]`);
      if (nodes.length == 0)
        return
      for (let span of nodes) {
        let li = span.parentNode;
        li.remove();
      }
    }

    SELF.removeFile = function(file) {
      let nodes = $(`.file-name[data-fid="${file.fid}"]`);
      if (nodes.length == 0)
        return
      for (let span of nodes) {
        let li = span.parentNode;
        li.remove();
      }
    }

    SELF.renameItem = function(file, type) {
      let nodes = $(`.${type}-name[data-fid="${file.fid}"]`);
      if (nodes.length == 0)
        return
      for (let span of nodes) {
        span.textContent = file.name;
        if (type == 'file')
          SELF.insertFileToSubtree(file.name, span.parentNode, span.parentNode.parentNode);
        else
          SELF.insertToSubtree(file.name, span.parentNode, span.parentNode.parentNode);
      }
    }

    SELF.moveItemFrom = function(type, data, targetParentId) {
      let spans = $(`.${type}-name[data-fid="${data.fid}"]`);
      let targetSpans = $(`.folder-name[data-fid="${targetParentId}"]`);
      if (targetSpans.length > 0) {
        if (spans.length > 0) {
          for (let span of spans) {
            let li = span.parentNode;
            li.remove();
          }
        }
        let file = {
          fid: data.fid,
          name: data.name,
          parentId: targetParentId,
        };
        if (type == 'file')
          SELF.appendFile(file);
        else 
          SELF.appendFolder(file);
      } else {
        if (spans.length > 0) {
          for (let span of spans) {
            let li = span.parentNode;
            li.remove();
          }
        }
      }
    }

    SELF.openDirectoryTree = function(target, isForceOpen = false) {
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

    SELF.openFileByElementFidDataset = function(target) {
      fileManager.open(target.dataset.fid)
    }

    SELF.highlightTree = function(fid, isRevealFileTree = true) {
      removeTreeFocus();
      let nodes = $(`.file-name[data-fid="${fid}"]`);
      if (nodes.length > 0) {
        for (let node of nodes) {
          revealTreeDirectory(node, fid);
          node.classList.add('--focus', '--opened');
          if (isRevealFileTree) {
            node.setAttribute('tabindex', 0);
            node.focus();
            node.removeAttribute('tabindex');
          }
        }
      } else {
        SELF.loadAndRevealTreeDirectory(fid);
      }
    }

    function removeTreeFocus() {
      let nodes = $(`.file-name.--focus`);
      if (nodes.length > 0) {
        for (let node of nodes) 
          node.classList.toggle('--focus', false);
      }
    }

    SELF.removeOpenIndicator = function(fid) {
      let nodes = $(`.file-name[data-fid="${fid}"]`);
      if (nodes.length > 0) {
        for (let node of nodes) 
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

    SELF.loadAndRevealTreeDirectory = function(fid) {
      if (parseInt(fid) < 0)
        return;

      let file = fileManager.get({fid, type: 'files'});
      let temp = [];
      let flaggedNode;

      while (true) {
        let node = $(`.file-tree[data-fid="${SELF.workspaceId}"] .folder-name[data-fid="${file.parentId}"]`)[0];
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
        let span = $(`.file-tree[data-fid="${SELF.workspaceId}"] .folder-name[data-fid="${temp[i]}"]`)[0];
        let li = span.parentNode;   
        SELF.openDirectoryTree(span, isForceOpen);
      }

      revealPathToRoot(flaggedNode);

      let node = $(`.file-tree[data-fid="${SELF.workspaceId}"] .file-name[data-fid="${fid}"]`)[0];
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

    SELF.reload = function () {
      $(`.file-tree[data-fid="${SELF.workspaceId}"] > li > ul`)[0].innerHTML = '';
      listTree();
    }

    SELF.reloadWorkspace = function (workspaceId) {
      let currentWorkspaceId = workspaceId;
      SELF.workspaceId = workspaceId;
      listTree();
      SELF.workspaceId = currentWorkspaceId;
    }

    function listTree(fid = null, parentNode = null) {

      let fm = fileManager;
      let folders = (fid === null) ? fm.getListFolder(SELF.workspaceId) : fm.getListFolder(parseInt(fid));
      let files = (fid === null) ? fm.getListFiles(SELF.workspaceId) : fm.getListFiles(parseInt(fid));
      if (fid == null) {
        parentNode = $(`.file-tree[data-fid="${SELF.workspaceId}"] .folder-name[data-fid="${SELF.workspaceId}"]`)[0].nextElementSibling;
      } else {
        parentNode = $('ul',parentNode)[0];
        parentNode.classList.toggle('isLoaded', true);
      }

      for (var i = 0; i < folders.length; i++) {
        let node = $('#tmp-file-tree-directory')[0].content.cloneNode(true);
        let span = $('.folder-name', node)[0];
        span.textContent = folders[i].name
        span.dataset.fid = folders[i].fid
        span.dataset.title = folders[i].name
        $('li', node)[0].classList.add('folder-root');
        $('li', node)[0].classList.add('closed');
        parentNode.append(node)
      }

      for (var i = 0; i < files.length; i++) {
        let node = $('#tmp-file-tree-file')[0].content.cloneNode(true);
        let span = $('.file-name', node)[0];
        span.textContent = files[i].name
        span.dataset.title = files[i].name
        span.dataset.fid = files[i].fid
        span.dataset.parent = files[i].parentId
        parentNode.append(node)
      }

    };

    SELF.attachListener = function() {
      $('#file-tree')[0].addEventListener('contextmenu', e => {
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

      $('#file-tree')[0].addEventListener("click", e => {
        let elClass = e.target.classList;
        if (elClass.contains('folder-name')) {
          if (e.target.dataset.fid == '-1')
            return
          SELF.openDirectoryTree(e.target);
        } else if (['file-name','--opened'].every(cls => elClass.contains(cls))) {
          SELF.openFileByElementFidDataset(e.target);
        }
      });

      $('#file-tree')[0].addEventListener("dblclick", e => {
        if (e.target.classList.contains('file-name')) {
          SELF.openFileByElementFidDataset(e.target);
        }
      });

      $('#tree-workspace')[0].addEventListener("click", e => {
        if (e.target.parentNode === $('#tree-workspace')[0]) {
          let folderId = e.target.dataset.fid;
          SELF.changeWorkspace(folderId);
        }
      });

      $('#tree-workspace')[0].addEventListener("dblclick", e => {
        if (e.target.parentNode === $('#tree-workspace')[0]) {
          let folderId = e.target.dataset.fid;
          let parentId = e.target.dataset.parentId;
          // SELF.changeWorkspace(folderId);
          // if (breadcrumbs.length > 1)
            // breadcrumbs.length e(0);
          // L(parentId)
          let rootTitle = (parentId == -1 || parentId === undefined) ? 'My Files' : '..';
          breadcrumbs.length = 0;
          breadcrumbs.push({folderId:parentId, title: rootTitle})
          fileManager.openFolder(folderId);
        }
      });

      $('#tree-workspace')[0].addEventListener("contextmenu", e => {
        e.preventDefault();
        if (e.target.parentNode === $('#tree-workspace')[0]) {
          if (parseInt(e.target.dataset.fid) == -1)
            return;

          modal.confirm(`Removing workspace <b><u>${e.target.textContent}</u></b> from tree explorer. Continue?`, false).then(() => {
            e.target.remove();
            $(`.file-tree[data-fid="${e.target.dataset.fid}"]`)[0].remove();
            
            if (SELF.workspaceId == parseInt(e.target.dataset.fid)) {
              SELF.changeWorkspace(-1);
            }
          });
        }
      });
    }

    function updateTreeBreadcrumbs(fid, node, isDirectory = true) {

      if (!$('#in-my-files')[0].classList.contains('active'))
        $('#btn-menu-my-files')[0].click();
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

    SELF.changeWorkspace = function(folderId) {
      SELF.workspaceId = folderId;
      for (let node of $('#file-tree')[0].children) {
        let isHide = (node.dataset.fid != folderId);
        node.classList.toggle('d-none', isHide);
      }
      if ($('#tree-workspace .--active').length > 0)
        $('#tree-workspace .--active')[0].classList.remove('--active');
      $(`#tree-workspace [data-fid="${folderId}"]`)[0].classList.add('--active');
    };

    SELF.createWorkspace = function(folderId) {
      if (parseInt(folderId) == -1)
        return;
      let folder = fileManager.get({fid: folderId, type: 'folders'});
      let node = document.createElement('div');
      node.dataset.fid = folderId;
      node.dataset.parentId = folder.parentId;
      node.classList.add('no-select');
      node.textContent = folder.name;
      $('#tree-workspace')[0].append(node);

      let treeNode = $('template[data-name="tree-node"]')[0].content.cloneNode(true);
      $('.file-tree-list', treeNode)[0].dataset.fid = folderId;
      $('.folder-name', treeNode)[0].dataset.fid = folderId;
      $('.folder-name', treeNode)[0].textContent = folder.name;
      $('#file-tree')[0].append(treeNode);
      SELF.reloadWorkspace(folderId);
    };

    return SELF;
  }


  window.app.getComponent('file-tree').then(ft => {
    ft.reload();
    ft.attachListener();
    if (settings.data.explorer.tree) {
      document.body.classList.toggle('--tree-explorer', true);
    }
    $('.tree-explorer')[0].classList.toggle('d-none', false);
    $('.tree-explorer-btn-expand')[0].classList.toggle('d-none', false);
  });

})();