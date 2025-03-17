// document.addEventListener("DOMContentLoaded", () => {
//   document.getElementById("func1").addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       let currentTab = tabs[0];

//       // Kiểm tra xem URL có phải là trang nội bộ của trình duyệt không
//       if (
//         currentTab.url.startsWith("chrome://") ||
//         currentTab.url.startsWith("edge://")
//       ) {
//         alert("Không thể thực thi trên trang nội bộ của trình duyệt.");
//         return;
//       }

//       // Nếu hợp lệ, inject script
//       chrome.scripting.executeScript({
//         target: { tabId: currentTab.id },
//         function: activateLinkListener,
//       });

//       // Đóng popup
//       window.close();
//     });
//   });
// });

// function activateLinkListener() {
//   document.addEventListener(
//     "click",
//     (event) => {
//       let target = event.target;

//       if (target.tagName === "A") {
//         event.preventDefault();

//         let title = target.innerText.trim();
//         let link = target.href;

//         if (!title) {
//           title = target.getAttribute("title") || "Không có tiêu đề";
//         }

//         let markdownLink = `### [${title.replace("WIP:", "")}](${link})`;

//         navigator.clipboard
//           .writeText(markdownLink)
//           .then(() => {
//             //alert("Đã sao chép: " + markdownLink);
//           })
//           .catch((err) => {
//             console.error("Lỗi sao chép:", err);
//           });
//       }
//     },
//     { once: true }
//   );
// }
document.addEventListener("DOMContentLoaded", () => {
  // Existing function for Link to Markdown
  document.getElementById("func1").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let currentTab = tabs[0];

      // Kiểm tra xem URL có phải là trang nội bộ của trình duyệt không
      if (
        currentTab.url.startsWith("chrome://") ||
        currentTab.url.startsWith("edge://")
      ) {
        alert("Không thể thực thi trên trang nội bộ của trình duyệt.");
        return;
      }

      // Nếu hợp lệ, inject script
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: activateLinkListener,
      });

      // Đóng popup
      window.close();
    });
  });

  // Xử lý cho chức năng JSON Query
  const func2Button = document.getElementById("func2");
  const jsonPanel = document.getElementById("jsonPanel");
  const jsonInput = document.getElementById("jsonInput");
  const queryInput = document.getElementById("queryInput");
  const executeButton = document.getElementById("executeQuery");
  const copyButton = document.getElementById("copyResult");
  const resultDiv = document.getElementById("result");
  jsonPanel.style.display = "none";

  // Tải biểu thức truy vấn gần nhất khi mở popup
  chrome.storage.local.get("lastQuery", (data) => {
    if (data.lastQuery) {
      queryInput.value = data.lastQuery;
    }
  });

  // Toggle JSON panel khi nhấn nút func2
  func2Button.addEventListener("click", () => {
    if (jsonPanel.style.display === "block") {
      jsonPanel.style.display = "none";
    } else {
      jsonPanel.style.display = "block";
    }
  });

  // Xử lý truy vấn JSON
  executeButton.addEventListener("click", () => {
    try {
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
      } else {
        resultDiv.textContent = "Không tìm thấy giá trị cho biểu thức này";
      }
    } catch (e) {
      resultDiv.textContent = "Lỗi: " + e.message;
    }
  });

  // Xử lý sao chép kết quả
  copyButton.addEventListener("click", () => {
    navigator.clipboard
      .writeText(resultDiv.textContent)
      .then(() => {
        const originalText = copyButton.textContent;
        copyButton.textContent = "✓ Đã sao chép";
        setTimeout(() => {
          copyButton.textContent = originalText;
        }, 1500);
      })
      .catch((err) => {
        console.error("Lỗi khi sao chép: ", err);
      });
  });
});

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
