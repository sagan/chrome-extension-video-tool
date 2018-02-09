
// nicovideo local (fake) premium
// inspired by https://gist.github.com/piouc/735384bc067647dce94147912b60e2a0

let observer = new MutationObserver(function (mutations) {
  l:for(let i = 0; i < mutations.length; i++) {
   		for(let j = 0; j < mutations[i].addedNodes.length; j++) {
   			if( mutations[i].addedNodes[j].id == 'js-initial-watch-data' ) {
   				// Got it, Let's fuck nicovideo ass hole!
   				let d = mutations[i].addedNodes[j].dataset;
					d.apiData = d.apiData.replace('"isPremium":false', '"isPremium":true')
   				observer.disconnect();
   				break l;
   			}
   		}
   }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});
