// load component file and add as object key
let components = {};

let componentLoader = (function() {

  let iframeResolver = [];

  function loadComponents(components, index) {
    if (index >= 0 && components[index].callback) {
      components[index].callback();
    }
    index++;
    if (index < components.length) {
      loadExternalFiles(components[index].urls, components[index].isConnectionRequired).then(() => {
        loadComponents(components, index);
      });
    }
  }
  
  function requireExternalFiles(url) {
    return new Promise((resolve, reject) => {
      if (url.includes('.html')) {
        let el = document.createElement('iframe');
        el.setAttribute('name', 'preload-'+url);
        $('#limbo').append(el);
        window.open(url, 'preload-'+url);
        iframeResolver.push(resolve);
      } else {
        let el;
        if (url.includes('.css')) {
          el = document.createElement('link');
          el.setAttribute('href', url);
          el.setAttribute('rel', 'stylesheet');
        } else {
          el = document.createElement('script');
          el.setAttribute('src', url);
        }
        el.onload = () => resolve(url);
        el.onerror = () => reject(url);
        document.head.appendChild(el);
      } 
    });
  };

  function loadExternalFiles(URLs, isConnectionRequired = false) {
    return new Promise(resolve => {
      let bundleURL = [];
      for (let URL of URLs)
        bundleURL.push(requireExternalFiles(URL));
      Promise.all(bundleURL).then(() => {
        resolve();
      }).catch(error => {
        console.log(error);
        console.log('Could not load one or more required file(s).');
        if (isConnectionRequired)
          resolve();
      });
    });
  }
  
  function load(components) {
    let loadIndex = -1;
    loadComponents(components, loadIndex);
  }

  function messageHandler(e) {
    let div = document.createElement('div');
    div.innerHTML = e.data.content;
    
    let fragment = document.createDocumentFragment();
    for (let node of $('.Export', div)) {
      node.classList.toggle('Export', false);
      fragment.appendChild(node);
    }

    document.body.append(fragment);
    let resolver = iframeResolver.pop();
    resolver();
  }
  
  window.addEventListener('message', messageHandler);
  
  return { 
    load,
    messageHandler,
  };
  
})();

function getComponent(name) {
  if (typeof(components[name]) != 'undefined') {
    return components[name];
  }
  return null;
}

function getComponentAsPromise(name) {
  return new Promise((resolve, reject) => {
    if (typeof(components[name]) != 'undefined')
      resolve(components[name]);
    reject(name);
  })
}

function registerComponent(name, componentObj) {
  if (typeof(components[name]) != 'undefined') {
    console.log(`Failed to register component ${name}. Component already exists.`);
  } else {
    components[name] = componentObj;    
  }
}