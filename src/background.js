
// current tab data
var data = {
	url: "",
	tabId: '',
}

chrome.tabs.onActivated.addListener(async ({tabId, windowId}) => {
	chrome.tabs.get(tabId, ({status, title, url}) => {
		data.url = url;
		data.tabId = tabId;
	});
});

chrome.tabs.onUpdated.addListener(async (tabId, {status, url}) => {
	if( !url )
		return;
	// || status != "complete"
	data.url = url;
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