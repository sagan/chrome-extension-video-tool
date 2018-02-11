
let checkboxShowCurrentTime = document.querySelector("#checkboxShowCurrentTime");
let checkboxLoop = document.querySelector("#checkboxLoop");
let labelUrl = document.querySelector("#url");
let info = document.querySelector("#info");
let duration = document.querySelector("#duration");
let slideMultiRange = document.querySelector('.multi-range');
let slideLoopStart = document.querySelector("#slideLoopStart");
let slideLoopEnd = document.querySelector("#slideLoopEnd");
let valueLoopStart = document.querySelector("#valueLoopStart");
let valueLoopEnd = document.querySelector("#valueLoopEnd");
let {data,get,set,remove} = chrome.extension.getBackgroundPage();

let self, options, looplist;

(async () => {
  try {
    let protocol = (new URL(data.url)).protocol;
    if( !['http:', 'https:'].includes(protocol) ) {
      return;
    }
  } catch(e) {
    return;
  }

  self = await get(data.url) || {};
  options = await get("options") || {};
  looplist = await get("looplist") || [];

  await new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(data.tabId, {type: "query"}, info => {
      if( !info )
        return reject();
      data.duration = info.duration || 0;
      resolve();
    });
  });

  [checkboxLoop,slideLoopStart,slideLoopEnd,valueLoopStart,valueLoopEnd]
    .forEach(i => {i.disabled = false;i.readOnly = false});

  labelUrl.innerHTML = data.url;
  checkboxShowCurrentTime.checked = !!options.showCurrentTime;
  checkboxLoop.checked = !!self.l;
  valueLoopStart.value = time(self.s);
  valueLoopEnd.value = time(self.e);
  slideLoopStart.value = self.s && data.duration ? Math.floor(self.s * 100 / data.duration) : 0;
  slideLoopEnd.value = self.e && data.duration ? Math.floor(self.e * 100 / data.duration) : 100;
  duration.innerHTML = time(data.duration);

  checkboxShowCurrentTime.addEventListener('click', async e => {
    options.showCurrentTime = e.currentTarget.checked;
    await set({options});
    chrome.tabs.sendMessage(data.tabId, {type: "update", options}, Function.prototype);
  });
  slideLoopStart.addEventListener('change', updateRangeInfo);
  slideLoopEnd.addEventListener('change', updateRangeInfo);
  slideLoopStart.addEventListener('input', e => slideMultiRange.dataset.lbound=e.target.value);
  slideLoopEnd.addEventListener('input', e => slideMultiRange.dataset.lbound=e.target.value);
  checkboxLoop.addEventListener('click', updateLoopToggle);
  valueLoopStart.addEventListener('change', updateRangeValue);
  valueLoopEnd.addEventListener('change', updateRangeValue);

})();

/*
storage: video page url as key
{
  l, // loop: 1|0
  s, // loop start seconds, default to 0
  e, // loop end seconds, default to video end
}

*/

async function updateRangeValue(e) {
  if( e.target == valueLoopStart ) {
    self.s = seconds(e.target.value);
    slideLoopStart.value = self.s && data.duration ? Math.floor(self.s * 100 / data.duration) : 0;
  } else {
    self.e = seconds(e.target.value);
    slideLoopEnd.value = self.e && data.duration ? Math.floor(self.e * 100 / data.duration) : 100;
  }
  await updateSelfInfo();
}

async function updateRangeInfo(e) {
  let slideLoopStartValue = slideLoopStart.value;
  let slideLoopEndValue = slideLoopEnd.value;
  if( data.duration ) {
    if( e.target == slideLoopStart ) {
      self.s = slideLoopStartValue * Math.floor(data.duration) / 100;
      valueLoopStart.value = time(self.s);
    } else {
      if( slideLoopEndValue == 100 ) {
        self.e = 0;
      } else {
        self.e = slideLoopEndValue * Math.floor(data.duration) / 100;
      }
      valueLoopEnd.value = time(self.e);
    }
    await updateSelfInfo();
  }
  // info.innerHTML = `${slideLoopStartValue} - ${slideLoopEndValue}`;
}

async function updateLoopToggle(e) {
  self.l = checkboxLoop.checked;
  await updateSelfInfo();
}

async function updateSelfInfo() {
  let i;
  if( self.l || self.s || self.e ) {
    i = looplist.indexOf(data.url);
    if( !~i ) {
      if( looplist.length > 500 ) {
        await remove(looplist.splice(0, 100));
      }
      looplist.push(data.url);
    }
    await set({looplist, [data.url]: self});
  } else {
    await remove(data.url);
    i = looplist.indexOf(data.url);
    if( ~i ) {
      looplist.splice(i,1);
      await set({looplist});
    }
  }
  chrome.tabs.sendMessage(data.tabId, {type: "update", self}, Function.prototype);
}

// seconds to h:mm:ss
function time(seconds) {
  if( !seconds )
    return '00:00';
  let h,m,s,r;
  h = Math.floor(seconds / 3600);
  r = seconds % 3600;
  m = Math.floor(r / 60);
  s = Math.floor(r % 60);

  return `${h > 0 ? (h + ':') : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}


function seconds(time) {
  if( !time )
    return 0;
  time = time.trim().toLowerCase();
  if( time == 'end' )
    return 0;
  time = time.split(/:\s*/).map(parseFloat);
  return ( time.length == 3 ? (time[0] * 3600 + time[1] * 60 + time[2]) : (time[0] * 60 + time[1]) ) || 0;
}