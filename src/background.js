/**
 * 打开应用主页
 * 如果应用页面已存在，这会创建一个新的标签页打开它
 */
const openAppPage = () => {
	const url = chrome.runtime.getURL('index.html');
	chrome.tabs.create({ url });
};

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
	openAppPage();
});
