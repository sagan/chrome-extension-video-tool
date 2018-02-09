
let video;
// config data (global / page specific)
let self, options;

(async () => {
  self = await get(location.href) || {};
  options = await get('options') || {};

  window.addEventListener('play', async ({target}) => {
    if( target.tagName != 'VIDEO' )
      return;
    self = await get(location.href) || {}; // refresh self in case url changed with no page reload
    // console.log('play');
    video && video.removeEventListener('timeupdate', timeupdateHandle);
    video = target.addEventListener('timeupdate', timeupdateHandle) || target;
  }, true);

  window.addEventListener('pause', async ({target}) => {
    if( target.tagName != 'VIDEO' )
      return;
    // console.log("pause", target, target.currentTime, target.duration, video, self);
    if( video == target ) {
      document.title = document.title.replace(/^[\d:]+\s*/, '');
    }
  }, true);

  window.addEventListener('durationchange', async ({target}) => {
    // console.log("duration change", target, target.duration);
    if( video == target ) {
      chrome.runtime.sendMessage({type: "durationchange", duration: target.duration}, Function.prototype);
    }
  }, true);

  chrome.runtime.onMessage.addListener(message => {
    // console.log('message', message);
    switch(message.type) {
      case 'update':
        if( message.self )
          self = message.self;
        if( message.options ) {
          if( video && !video.paused && options.showCurrentTime && !message.options.showCurrentTime ) {
            document.title = document.title.replace(/^[\d:]+\s*/, '');
          }
          options = message.options;
        }
        break;
      default:
        ;
    }
  });
})();

async function timeupdateHandle(e) {
  // console.log('time change', video.currentTime, video.duration);
  if( options.showCurrentTime ) {
    document.title = time(video.currentTime) + ' ' + document.title.replace(/^[\d:]+\s*/, '');
  }

  if( self.l && (video.currentTime + 0.5 >= video.duration) ) {
    video.currentTime = self.s || 0;
    video.play();
  }
}

// seconds to h:mm:ss
function time(seconds) {
  let h,m,s,r;
  h = Math.floor(seconds / 3600);
  r = seconds % 3600;
  m = Math.floor(r / 60);
  s = Math.floor(r % 60);

  return `${h > 0 ? (h + ':') : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}


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
