document.addEventListener('DOMContentLoaded', () => {
    const newsForm = document.getElementById('addNewsForm');
    const newsList = document.getElementById('newsList');

    // Show/Hide news form
    window.showNewsForm = () => {
        document.getElementById('newsForm').style.display = 'block';
    };

    window.hideNewsForm = () => {
        document.getElementById('newsForm').style.display = 'none';
        newsForm.reset();
    };

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.className = `notification ${type}`;
        notification.querySelector('.notification-message').textContent = message;
        
        notification.style.display = 'block';

        // Auto hide after 5 seconds
        setTimeout(hideNotification, 5000);
    }

    function hideNotification() {
        const notification = document.getElementById('notification');
        notification.style.display = 'none';
    }

    function toggleMediaInput() {
        const mediaType = document.getElementById('mediaType').value;
        const mediaFile = document.getElementById('mediaFile');
        
        if (mediaType === 'video') {
            mediaFile.accept = 'video/*';
        } else {
            mediaFile.accept = 'image/*';
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const mediaFile = formData.get('mediaFile');
        const mediaUrl = formData.get('mediaUrl');

        if (!mediaFile && !mediaUrl) {
            showNotification('Please provide either a file or URL for the media', 'error');
            return;
        }

        try {
            // If a file is selected, upload it first
            let finalMediaUrl = mediaUrl;
            if (mediaFile.size > 0) {
                const uploadData = new FormData();
                uploadData.append('media', mediaFile);
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload media file');
                }

                const uploadResult = await uploadResponse.json();
                finalMediaUrl = uploadResult.url;
            }

            // Create the article
            const articleData = {
                title: formData.get('title'),
                content: formData.get('content'),
                category: formData.get('category'),
                mediaType: formData.get('mediaType'),
                mediaUrl: finalMediaUrl,
                keywords: formData.get('keywords').split(',').map(k => k.trim()),
                date: new Date().toISOString()
            };

            const response = await fetch('/api/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(articleData)
            });

            if (!response.ok) {
                throw new Error('Failed to create article');
            }

            showNotification('Article posted successfully!');
            hideNewsForm();
            fetchNewsList(); // Refresh the article list
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Failed to post article: ${error.message}`, 'error');
        }
    }

    // Update the form event listener
    document.getElementById('addNewsForm').addEventListener('submit', handleFormSubmit);

    // Fetch and display news list
    async function fetchNewsList() {
        try {
            const response = await fetch('/api/news');
            const news = await response.json();
            
            newsList.innerHTML = news.map(article => `
                <div class="news-item" data-id="${article._id}">
                    <div class="news-item-content">
                        <h3>${article.title}</h3>
                        <span class="category">${article.category}</span>
                        <span class="date">${new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="news-item-actions">
                        <button onclick="editNews('${article._id}')" class="edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteNews('${article._id}')" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showNotification('Error fetching news list', 'error');
        }
    }

    // Delete news article
    window.deleteNews = async (id) => {
        if (confirm('Are you sure you want to delete this article?')) {
            try {
                const response = await fetch(`/api/news/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    fetchNewsList();
                    showNotification('Article deleted successfully!', 'success');
                } else {
                    throw new Error('Failed to delete article');
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    };

    // Edit news article
    window.editNews = async (id) => {
        try {
            const response = await fetch(`/api/news/${id}`);
            const article = await response.json();

            document.getElementById('title').value = article.title;
            document.getElementById('content').value = article.content;
            document.getElementById('category').value = article.category;
            document.getElementById('imageUrl').value = article.imageUrl;
            document.getElementById('keywords').value = article.keywords.join(', ');

            showNewsForm();
            newsForm.dataset.editId = id;
        } catch (error) {
            showNotification('Error loading article', 'error');
        }
    };

    // Initial news list fetch
    fetchNewsList();
});
