document.addEventListener('DOMContentLoaded', () => {
    // Get article ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (articleId) {
        loadArticle(articleId);
    } else {
        window.location.href = '/';
    }
});

async function loadArticle(articleId) {
    try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (!response.ok) throw new Error('Article not found');
        
        const article = await response.json();
        displayArticle(article);
    } catch (error) {
        console.error('Error loading article:', error);
        window.location.href = '/';
    }
}

function displayArticle(article) {
    const articleElement = document.querySelector('.full-article');
    const formattedDate = new Date(article.date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    articleElement.innerHTML = `
        ${article.mediaType === 'video' 
            ? `<video src="${article.mediaUrl}" controls></video>`
            : `<img src="${article.mediaUrl}" alt="${article.title}">`
        }
        <div class="article-content">
            <div class="article-header">
                <h1 class="article-title">${article.title}</h1>
                <div class="article-meta">
                    <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                    <span class="article-category">${article.category}</span>
                </div>
            </div>
            <div class="article-body">
                ${article.content}
            </div>
        </div>
    `;

    // Update page title
    document.title = `${article.title} - Campus Chronicles`;
}
