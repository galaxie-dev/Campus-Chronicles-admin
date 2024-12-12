document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Filter and search functionality
    const sortSelect = document.getElementById('sortSelect');
    const categorySelect = document.getElementById('categorySelect');
    const searchInput = document.getElementById('searchInput');

    // Debounce function for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Fetch and display news
    async function fetchNews(params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await fetch(`/api/news?${queryParams}`);
            const news = await response.json();
            displayNews(news);
            updateSlider(news.slice(0, 5)); // Show latest 5 news in slider
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    }

    // Display news in the main container
    function displayNews(news) {
        const container = document.getElementById('newsContainer');
        container.innerHTML = news.map(article => createNewsCard(article)).join('');
    }

    function createNewsCard(article) {
        const formattedDate = new Date(article.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <article class="news-card" data-aos="fade-up">
                <div class="news-image">
                    <img src="${article.imageUrl}" alt="${article.title}">
                </div>
                <div class="news-content">
                    <span class="category">${article.category}</span>
                    <h3>${article.title}</h3>
                    <div class="news-meta">
                        <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                    </div>
                    <p>${article.content.substring(0, 150)}...</p>
                    <a href="/article.html?id=${article._id}" class="read-more">Read More</a>
                </div>
            </article>
        `;
    }

    // Update slider content
    function updateSlider(news) {
        const sliderContent = document.querySelector('.slider__content');
        sliderContent.innerHTML = news.map(article => `
            <div class="slider__item">
                <img class="slider__image" src="${article.imageUrl}" alt="${article.title}">
                <div class="slider__info">
                    <h2>${article.title}</h2>
                </div>
            </div>
        `).join('');
    }

    // Event listeners for filters
    sortSelect.addEventListener('change', () => {
        fetchNews({
            sort: sortSelect.value,
            category: categorySelect.value,
            keyword: searchInput.value
        });
    });

    categorySelect.addEventListener('change', () => {
        fetchNews({
            sort: sortSelect.value,
            category: categorySelect.value,
            keyword: searchInput.value
        });
    });

    searchInput.addEventListener('input', debounce(() => {
        fetchNews({
            sort: sortSelect.value,
            category: categorySelect.value,
            keyword: searchInput.value
        });
    }, 300));

    // Show full article modal
    window.showFullArticle = async (id) => {
        try {
            const response = await fetch(`/api/news/${id}`);
            const article = await response.json();
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>${article.title}</h2>
                    <img src="${article.imageUrl}" alt="${article.title}">
                    <p>${article.content}</p>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.querySelector('.close').onclick = () => modal.remove();
        } catch (error) {
            console.error('Error fetching article:', error);
        }
    };

    // Initial news fetch
    fetchNews();
});
