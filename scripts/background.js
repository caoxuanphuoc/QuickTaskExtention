chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "activateListener") {
    let tab = sender.tab;

    // Kiểm tra xem trang hiện tại có hợp lệ không
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
      console.warn("Không thể chạy script trên trang nội bộ.");
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: activateLinkListener,
    });
  }
});
