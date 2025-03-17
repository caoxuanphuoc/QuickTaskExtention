document.addEventListener("DOMContentLoaded", () => {
  // Menu item cho tính năng Markdown Templates
  const markdownTemplatesMenuItem = document.getElementById('markdown-templates');
  if (markdownTemplatesMenuItem) {
    markdownTemplatesMenuItem.addEventListener('click', function () {
      // Mở tab mới với trang quản lý mẫu Markdown
      chrome.tabs.create({
        url: 'markdown-templates/index.html'
      });
    });
  }

  // Accordion functionality
  document.getElementById('linkToMdHeader').addEventListener('click', function () {
    toggleSection('linkToMdContent', this);
  });

  document.getElementById('jsonQueryHeader').addEventListener('click', function () {
    toggleSection('jsonQueryContent', this);
  });

  // Clear button functionality
  document.getElementById('clearResult').addEventListener('click', function () {
    document.getElementById('result').textContent = 'Kết quả sẽ hiển thị ở đây';
    document.getElementById('jsonInput').value = '';
    showToast('Đã xóa kết quả');
  });

  // Existing function for Link to Markdown
  document.getElementById("func1").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let currentTab = tabs[0];

      // Kiểm tra xem URL có phải là trang nội bộ của trình duyệt không
      if (
        currentTab.url.startsWith("chrome://") ||
        currentTab.url.startsWith("edge://")
      ) {
        showToast("Không thể thực thi trên trang nội bộ của trình duyệt.");
        return;
      }

      // Nếu hợp lệ, inject script
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: activateLinkListener,
      });

      // Hiển thị thông báo thành công
      showToast("Đã kích hoạt! Hãy nhấp vào một liên kết trên trang.");

      // Đóng popup
      setTimeout(() => window.close(), 1500);
    });
  });

  // Xử lý cho chức năng JSON Query
  const executeButton = document.getElementById("executeQuery");
  const copyButton = document.getElementById("copyResult");
  const jsonInput = document.getElementById("jsonInput");
  const queryInput = document.getElementById("queryInput");
  const resultDiv = document.getElementById("result");

  // Loại bỏ dòng gây lỗi liên quan đến jsonPanel không tồn tại
  // const jsonPanel = document.getElementById("jsonPanel"); 
  // jsonPanel.style.display = "none";

  // Tải biểu thức truy vấn gần nhất khi mở popup
  chrome.storage.local.get("lastQuery", (data) => {
    if (data.lastQuery) {
      queryInput.value = data.lastQuery;
    }
  });

  // Xử lý truy vấn JSON
  executeButton.addEventListener("click", () => {
    try {
      if (!jsonInput.value.trim()) {
        showToast("Vui lòng nhập dữ liệu JSON", 2000);
        return;
      }

      const jsonData = JSON.parse(jsonInput.value);
      const query = queryInput.value.trim();
      const result = evaluateJsonPath(jsonData, query);

      if (result !== undefined) {
        if (typeof result === "object") {
          resultDiv.textContent = JSON.stringify(result, null, 2);
        } else {
          resultDiv.textContent = result;
        }

        // Lưu biểu thức gần nhất vào storage
        if (query) {
          chrome.storage.local.set({ lastQuery: query });
        }

        showToast("Truy vấn thành công!", 1000);
      } else {
        resultDiv.textContent = "Không tìm thấy giá trị cho biểu thức này";
        showToast("Không tìm thấy kết quả", 2000);
      }
    } catch (e) {
      resultDiv.textContent = "Lỗi: " + e.message;
      showToast("Lỗi xử lý JSON", 2000);
    }
  });

  // Xử lý sao chép kết quả
  copyButton.addEventListener("click", () => {
    if (resultDiv.textContent === "Kết quả sẽ hiển thị ở đây") {
      showToast("Không có dữ liệu để sao chép", 2000);
      return;
    }

    navigator.clipboard
      .writeText(resultDiv.textContent)
      .then(() => {
        showToast("Đã sao chép kết quả vào clipboard", 1500);
      })
      .catch((err) => {
        console.error("Lỗi khi sao chép: ", err);
        showToast("Lỗi khi sao chép", 2000);
      });
  });
});

// Helper Functions
function toggleSection(id, header) {
  const content = document.getElementById(id);
  const icon = header.querySelector('.tool-toggle i');

  content.classList.toggle('active');

  if (content.classList.contains('active')) {
    icon.className = 'fas fa-chevron-up';
  } else {
    icon.className = 'fas fa-chevron-down';
  }
}

// Toast notification
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(function () {
    toast.classList.remove('show');
  }, duration);
}

// Function to evaluate JSON path expressions
function evaluateJsonPath(obj, path) {
  // Handle empty path
  if (!path) return obj;

  // Split the path by dots and handle array indexing
  const parts = [];
  let currentPart = "";
  let inBrackets = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === "." && !inBrackets) {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = "";
      }
    } else if (char === "[") {
      inBrackets = true;
      if (currentPart) {
        parts.push(currentPart);
        currentPart = "";
      }
    } else if (char === "]") {
      inBrackets = false;
      if (currentPart) {
        parts.push(currentPart);
        currentPart = "";
      }
    } else {
      currentPart += char;
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  // Navigate through the object
  let result = obj;
  for (const part of parts) {
    if (result === null || result === undefined) {
      return undefined;
    }

    // Check if part is a number (array index)
    if (!isNaN(part) && part.trim() !== "") {
      result = result[parseInt(part, 10)];
    } else {
      result = result[part];
    }
  }

  return result;
}

function activateLinkListener() {
  document.addEventListener(
    "click",
    (event) => {
      let target = event.target;

      if (target.tagName === "A") {
        event.preventDefault();

        let title = target.innerText.trim();
        let link = target.href;

        if (!title) {
          title = target.getAttribute("title") || "Không có tiêu đề";
        }

        let markdownLink = `### [${title.replace("WIP:", "")}](${link})`;

        navigator.clipboard
          .writeText(markdownLink)
          .then(() => {
            //alert("Đã sao chép: " + markdownLink);
          })
          .catch((err) => {
            console.error("Lỗi sao chép:", err);
          });
      }
    },
    { once: true }
  );
}
