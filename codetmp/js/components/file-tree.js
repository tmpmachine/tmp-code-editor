function removeTreeFocus() {
  let node = $(`.file-name.--focus`);
  if (node.length > 0)
    node[0].classList.toggle('--focus', false);
}

function  highlightTree(fid) {
  removeTreeFocus();
  let node = $(`.file-name[data-fid="${fid}"]`);
  if (node.length > 0) {
    revealTreeDirectory(node[0], fid)
    node[0].classList.toggle('--focus', true);
    node[0].setAttribute('tabindex', 0);
    node[0].focus();
    node[0].removeAttribute('tabindex');
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

// function fileTree(elementId = 'file-tree') {
//   NodeList.prototype.has = function(selector) {
//     return Array.from(this).filter(e => e.querySelector(selector));
//   };

//   var element = document.getElementById(elementId);
//   element.classList.add('file-list');
//   var liElementsInideUl = element.querySelectorAll('li');
//   liElementsInideUl.has('ul').forEach(li => {
//     li.classList.add('folder-root');
//     li.classList.add('closed');
//     var spanFolderElementsInsideLi = li.querySelectorAll('span.folder-name');
//     spanFolderElementsInsideLi.forEach(span => {
//       if (span.parentNode.nodeName === 'LI') {
//         span.onclick = function(e) {
//           let isOpened = span.parentNode.classList.toggle('open');
//           let isLoaded = span.parentNode.classList.contains('isLoaded');
//           if (isOpened && !isLoaded) {
//             fileManager.listTree(span.dataset.fid, span.parentNode)
//           }
//         };
//       }
//     });
//   });
// }

function updateTreeBreadcrumbs(fid, node, isDirectory = true) {

  if (activeFolder == fid)
    return
  breadcrumbs.splice(1);
  let isRoot = node.parentNode.parentNode.classList.contains('file-tree');
  while (!isRoot) {
    if (isDirectory) {
      breadcrumbs.splice(1, 0, {folderId:node.dataset.fid, title: node.textContent})
    } else {
      isDirectory = true;
    }
    node = node.parentNode.parentNode.previousElementSibling;
    isRoot = node.parentNode.parentNode.classList.contains('file-tree');
    if (isRoot) {
      breadcrumbs.splice(1, 0, {folderId:node.dataset.fid, title: node.textContent})
    } 
  }

  loadBreadCrumbs();
  
  if (breadcrumbs.length > 1)
    breadcrumbs.pop();
  fileManager.openFolder(fid);

  if (!$('#in-my-files').classList.contains('active'))
    $('#btn-menu-my-files').click();
}


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