
let checkboxShowCurrentTime = document.querySelector("#checkboxShowCurrentTime");
let checkboxLoop = document.querySelector("#checkboxLoop");
let labelUrl = document.querySelector("#url");
let {data,get,set,remove} = chrome.extension.getBackgroundPage();

let self, options, looplist;

(async () => {
	self = await get(data.url) || {};
	options = await get("options") || {};
	looplist = await get("looplist") || [];

	labelUrl.innerHTML = data.url;
	checkboxShowCurrentTime.checked = !!options.showCurrentTime;
	checkboxLoop.checked = !!self.l;

	let protocol = (new URL(data.url)).protocol;
	if( !['http:', 'https:'].includes(protocol) ) {
		checkboxLoop.disabled = true;
		return;
	}

	checkboxShowCurrentTime.addEventListener('click', async e => {
		options.showCurrentTime = e.currentTarget.checked;
		await set({options});
		chrome.tabs.sendMessage(data.tabId, {type: "update", options}, Function.prototype);
	});

	checkboxLoop.addEventListener('click', updateSelfInfo);
})();

/*
storage: video page url as key
{
	l, // loop: 1|0
	s, // loop start seconds, default to 0
	e, // loop end seconds, default to video end
}

*/

async function updateSelfInfo() {
	let i;
	let loop = checkboxLoop.checked;

	if( loop ) {
		self.l = 1;
		i = looplist.indexOf(data.url);
		if( !~i ) {
			if( looplist.length > 500 ) {
				await remove(looplist.splice(0, 100));
			}
			looplist.push(data.url);
		}
		await set({looplist, [data.url]: self});
	} else {
		self.l = 0;
		await remove(data.url);
		i = looplist.indexOf(data.url);
		if( ~i ) {
			looplist.splice(i,1);
			await set({looplist});
		}
	}
	chrome.tabs.sendMessage(data.tabId, {type: "update", self}, Function.prototype);
}
