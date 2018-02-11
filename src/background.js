
// current tab data
var data = {
  url: "",
  tabId: '',
  duration: 0, // video duration
}

chrome.tabs.onActivated.addListener(async ({tabId, windowId}) => {
  chrome.tabs.get(tabId, ({status, title, url}) => {
    data.url = url;
    data.tabId = tabId;
    data.duration = 0;
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, {status, url}) => {
  if( !url )
    return;
  data.url = url;
  data.duration = 0;
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  console.log(msg, sender.tab.id, data.tabId);
  if( sender.tab.id == data.tabId ) {
    switch(msg.type) {
      case 'durationchange':
        data.duration = msg.duration;
        break;
      default:
        break;
    }
  }
});

async function get(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, values => {
      if( chrome.runtime.lastError )
        return reject(chrome.runtime.lastError.message);
      return resolve(typeof keys == "string" ? values[keys] : values);
    });
  });
}

async function set(values) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(values, () => {
      if( chrome.runtime.lastError )
        return reject(chrome.runtime.lastError.message);
      return resolve();
    });
  });
}

async function remove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.remove(keys, () => {
      if( chrome.runtime.lastError )
        return reject(chrome.runtime.lastError.message);
      return resolve();
    });
  });
}