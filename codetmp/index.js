let activeWorkspace = 0;
let environment = {
  previewUrl: 'https://cpreview.web.app/',
};

componentLoader.load([
  {
    urls: [
      'views/modals.html',
      'views/templates.html',
    ],
    callback: function() {
      window.removeEventListener('message', componentLoader.messageHandler);
    }
  },
  {
  urls: [
    'js/components/ext-firebase.js',
      'assets/js/fflate.js',
      'assets/js/sha256.js',
      ],
      isConnectionRequired: true,
  },
  {
    urls: [
      'js/components/support.js',
      'js/components/helper.js',
      'js/components/extension.js',
      'js/components/preferences.js',
      'js/components/modal.js',
      'js/components/clipboard.js',
      'js/require/lsdb.js',
    ],
    callback: function() {
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data.type) {
          switch (e.data.type) {
            case 'extension':
              extension.load(e.data.name);
              break;
          }
        }
      });
    }
  },
  {
    urls: [
      'js/require/o.js',
      'js/require/keyboard.js',
      'js/require/odin.js',
      'js/components/preview-handler.js',
      'js/components/file-manager.js',
      'js/ux.js',
      'js/components/notifier.js',
      'js/core/app-data.js',
      'assets/ace/ace.js',
    ],
    callback: function() {
      // loadStorageData();
      // logWarningMessage();
      ace.config.set('basePath', 'assets/ace');
    },
  },
  {
    urls: [
      'js/dom-events.js',
      'css/file-tree.css',
      'js/components/file-tree.js',
    ],
    callback: function() {
      initUI();
    },
  },
  {
    urls: [
      'js/components/keyboard-handler.js',
      'js/components/file-reader.js',
      'js/components/template.js',
      'js/require/divless.js',
    ],
    callback: function() {
      fileReaderModule.init();
      keyboardHandler.init();
    },
  },
  {
    urls: [
      'js/require/aww.js',
      'js/components/auth2helper.js',
      'js/components/drive.js',
      'js/components/defer-feature-1.js',
      'js/components/defer-feature-2.js',
    ],
  },
  {
    urls: [
      'js/components/single-file-generator.js',
    ],
  },
  {
    urls: [
      'js/require/jszip.min.js',
    ],
    callback: function() {
      support.check('JSZip');
    },
  },
  {
    urls: [
      'js/components/git.js',
      'https://apis.google.com/js/platform.js?onload=renderSignInButton',
    ],
  },
]);