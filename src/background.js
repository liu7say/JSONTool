const openAppPage = () => {
  const url = chrome.runtime.getURL('index.html')
  chrome.tabs.create({ url })
}

chrome.action.onClicked.addListener(() => {
  openAppPage()
})


