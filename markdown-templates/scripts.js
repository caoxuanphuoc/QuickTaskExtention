document.addEventListener('DOMContentLoaded', function () {
    // Các phần tử DOM
    const templatesContainer = document.getElementById('templates-container');
    const templateNameInput = document.getElementById('template-name');
    const templateContentTextarea = document.getElementById('template-content');
    const templateDescriptionInput = document.getElementById('template-description');
    const previewContainer = document.getElementById('preview-container');
    const newTemplateBtn = document.getElementById('new-template-btn');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const copyTemplateBtn = document.getElementById('copy-template-btn');
    const deleteTemplateBtn = document.getElementById('delete-template-btn');
    const editorTitle = document.getElementById('editor-title');

    // Biến cục bộ để theo dõi mẫu hiện tại
    let currentTemplateId = null;
    let templates = [];

    // Khởi tạo
    init();

    function init() {
        loadTemplates();
        renderTemplatesList();
        resetEditor();
        setupEventListeners();
    }

    // Tải các mẫu từ localStorage
    function loadTemplates() {
        const savedTemplates = localStorage.getItem('markdown-templates');
        templates = savedTemplates ? JSON.parse(savedTemplates) : [];
    }

    // Lưu các mẫu vào localStorage
    function saveTemplates() {
        localStorage.setItem('markdown-templates', JSON.stringify(templates));
    }

    // Hiển thị danh sách các mẫu
    function renderTemplatesList() {
        templatesContainer.innerHTML = '';

        if (templates.length === 0) {
            templatesContainer.innerHTML = '<p class="no-templates">Chưa có mẫu nào. Hãy tạo mẫu mới!</p>';
            return;
        }

        templates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.className = `template-item ${template.id === currentTemplateId ? 'active' : ''}`;
            templateItem.dataset.id = template.id;
            templateItem.innerHTML = `
                <h3>${template.name}</h3>
                <p>${template.description || 'Không có mô tả'}</p>
            `;

            templateItem.addEventListener('click', () => {
                loadTemplateToEditor(template.id);
            });

            templatesContainer.appendChild(templateItem);
        });
    }

    // Tạo ID ngẫu nhiên cho mẫu mới
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Reset trình soạn thảo
    function resetEditor() {
        currentTemplateId = null;
        templateNameInput.value = '';
        templateContentTextarea.value = '';
        templateDescriptionInput.value = '';
        previewContainer.innerHTML = '';
        editorTitle.textContent = 'Soạn thảo mẫu mới';
        deleteTemplateBtn.style.display = 'none';
    }

    // Chuyển đổi Markdown sang HTML (simple implementation)
    function markdownToHtml(markdown) {
        if (!markdown) return '';

        // Đây chỉ là một cài đặt đơn giản, trong thực tế bạn có thể sử dụng thư viện như marked.js
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
            // Lists
            .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
            // Code blocks
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            // Line breaks
            .replace(/\n/gim, '<br>');

        return html;
    }

    // Cập nhật xem trước
    function updatePreview() {
        const markdown = templateContentTextarea.value;
        const html = markdownToHtml(markdown);
        previewContainer.innerHTML = html;
    }

    // Tải mẫu vào trình soạn thảo
    function loadTemplateToEditor(templateId) {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            currentTemplateId = template.id;
            templateNameInput.value = template.name;
            templateContentTextarea.value = template.content;
            templateDescriptionInput.value = template.description || '';
            updatePreview();
            editorTitle.textContent = `Chỉnh sửa: ${template.name}`;
            deleteTemplateBtn.style.display = 'block';

            // Highlight mẫu đang được chọn
            document.querySelectorAll('.template-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === templateId);
            });
        }
    }

    // Lưu mẫu hiện tại
    function saveCurrentTemplate() {
        const name = templateNameInput.value.trim();
        const content = templateContentTextarea.value.trim();
        const description = templateDescriptionInput.value.trim();

        if (!name || !content) {
            alert('Vui lòng nhập tên và nội dung cho mẫu');
            return;
        }

        if (currentTemplateId) {
            // Cập nhật mẫu hiện có
            const index = templates.findIndex(t => t.id === currentTemplateId);
            if (index !== -1) {
                templates[index] = {
                    ...templates[index],
                    name,
                    content,
                    description,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // Tạo mẫu mới
            const newTemplate = {
                id: generateId(),
                name,
                content,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            templates.push(newTemplate);
            currentTemplateId = newTemplate.id;
        }

        saveTemplates();
        renderTemplatesList();
        editorTitle.textContent = `Chỉnh sửa: ${name}`;
        deleteTemplateBtn.style.display = 'block';
        alert('Mẫu đã được lưu thành công!');
    }

    // Xóa mẫu hiện tại
    function deleteCurrentTemplate() {
        if (!currentTemplateId) return;

        if (confirm('Bạn có chắc chắn muốn xóa mẫu này không?')) {
            templates = templates.filter(t => t.id !== currentTemplateId);
            saveTemplates();
            resetEditor();
            renderTemplatesList();
            alert('Mẫu đã được xóa thành công!');
        }
    }

    // Sao chép mẫu vào clipboard
    function copyTemplateToClipboard() {
        const content = templateContentTextarea.value;
        if (!content) {
            alert('Không có nội dung để sao chép!');
            return;
        }

        navigator.clipboard.writeText(content).then(() => {
            alert('Đã sao chép mẫu vào clipboard!');
        }).catch(err => {
            console.error('Không thể sao chép mẫu: ', err);
            alert('Không thể sao chép mẫu. Vui lòng thử lại.');
        });
    }

    // Thiết lập các sự kiện
    function setupEventListeners() {
        newTemplateBtn.addEventListener('click', resetEditor);

        saveTemplateBtn.addEventListener('click', saveCurrentTemplate);

        deleteTemplateBtn.addEventListener('click', deleteCurrentTemplate);

        copyTemplateBtn.addEventListener('click', copyTemplateToClipboard);

        templateContentTextarea.addEventListener('input', updatePreview);
    }
});
