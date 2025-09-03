// Data Loader Module - Handles loading and rendering of blog posts and career positions

class DataLoader {
    constructor() {
        this.blogPosts = [];
        this.careerPositions = [];
        this.initialized = false;
    }

    // Initialize data loader
    async init() {
        if (this.initialized) return;
        
        try {
            await this.loadBlogPosts();
            await this.loadCareerPositions();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize data loader:', error);
        }
    }

    // Load blog posts from JSON files
    async loadBlogPosts() {
        const blogFiles = [
            'neural-networks-mycelial-networks.json',
            'introducing-mushroom-radar.json',
            'ethical-ai-framework.json'
        ];

        try {
            const promises = blogFiles.map(file => 
                fetch(`data/blog/${file}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.warn(`Failed to load blog post: ${file}`, error);
                        return null;
                    })
            );

            const results = await Promise.all(promises);
            this.blogPosts = results
                .filter(post => post !== null)
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            
            console.log('Loaded blog posts:', this.blogPosts.length);
        } catch (error) {
            console.error('Failed to load blog posts:', error);
        }
    }

    // Load career positions from JSON files
    async loadCareerPositions() {
        // Try to load from a manifest file first, fall back to known files
        let careerFiles = [];
        
        try {
            // Try to load a manifest file that lists all available careers
            const manifestResponse = await fetch('data/careers/manifest.json');
            if (manifestResponse.ok) {
                const manifest = await manifestResponse.json();
                careerFiles = manifest.files || [];
                console.log('Loaded career files from manifest:', careerFiles);
            }
        } catch (error) {
            console.log('No manifest file found, using default file list');
        }
        
        // If no manifest, fall back to known files and try additional ones
        if (careerFiles.length === 0) {
            // Known files that definitely exist
            const knownFiles = [
                'senior-ai-research-scientist.json',
                'bioinformatics-engineer.json',
                'product-manager-ai-ethics.json'
            ];
            
            // Additional files to try (including your new one)
            const possibleFiles = [
                'senior-droppie.json',
                'senior-developer.json',
                'junior-researcher.json',
                'data-scientist.json'
            ];
            
            careerFiles = [...knownFiles, ...possibleFiles];
        }

        try {
            const promises = careerFiles.map(file => 
                fetch(`data/careers/${file}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        console.warn(`Failed to load career position: ${file}`, error);
                        return null;
                    })
            );

            const results = await Promise.all(promises);
            this.careerPositions = results
                .filter(position => position !== null)
                .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
            
            console.log('Loaded career positions:', this.careerPositions.length);
            
            // If no positions loaded, it might be due to missing files
            if (this.careerPositions.length === 0) {
                console.log('No career positions loaded - files may be missing or inaccessible');
            }
        } catch (error) {
            console.error('Failed to load career positions:', error);
        }
    }

    // Render blog posts
    renderBlogPosts(containerId = 'blog-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Blog container '${containerId}' not found`);
            return;
        }

        const blogGrid = container.querySelector('.blog-grid') || container;
        blogGrid.innerHTML = '';

        if (this.blogPosts.length === 0) {
            blogGrid.innerHTML = '<div class="loading-placeholder"><p>There are no blog posts available at the moment.</p></div>';
            
            // Hide pagination when no posts
            const pagination = container.querySelector('.blog-pagination');
            if (pagination) {
                pagination.style.display = 'none';
            }
            
            return;
        }

        // Show pagination when there are posts
        const pagination = container.querySelector('.blog-pagination');
        if (pagination) {
            pagination.style.display = 'flex';
        }

        this.blogPosts.forEach(post => {
            const postElement = this.createBlogPostElement(post);
            blogGrid.appendChild(postElement);
        });
    }

    // Render career positions
    renderCareerPositions(containerId = 'careers-container') {
        console.log('Attempting to render career positions...');
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Careers container '${containerId}' not found`);
            return;
        }

        const jobsList = container.querySelector('.jobs-list') || container;
        jobsList.innerHTML = '';

        console.log('Career positions to render:', this.careerPositions.length);
        
        if (this.careerPositions.length === 0) {
            jobsList.innerHTML = '<div class="loading-placeholder"><p>There are no current open vacancies at the moment.</p></div>';
            return;
        }

        this.careerPositions.forEach(position => {
            const positionElement = this.createCareerPositionElement(position);
            jobsList.appendChild(positionElement);
        });
        
        console.log('Career positions rendered successfully');
    }

    // Create blog post HTML element
    createBlogPostElement(post) {
        const article = document.createElement('article');
        article.className = 'blog-post';
        article.innerHTML = `
            <div class="post-meta">
                <span class="post-date">${this.formatDate(post.publishedAt)}</span>
                <span class="post-category">${post.category}</span>
            </div>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <div class="post-author">
                <span class="author-name">By ${post.author.name}</span>
                <span class="read-time">${post.readTime}</span>
            </div>
            <a href="/blog/${post.id}.html" class="read-more">Read More →</a>
        `;
        return article;
    }

    // Create career position HTML element
    createCareerPositionElement(position) {
        const jobPosting = document.createElement('div');
        jobPosting.className = 'job-posting';
        jobPosting.innerHTML = `
            <div class="job-header">
                <h3>${position.title}</h3>
                <div class="job-meta">
                    <span class="job-type">${position.employmentType}</span>
                    <span class="job-location">${position.location.type}</span>
                </div>
            </div>
            <p class="job-description">${position.description}</p>
            <div class="job-details">
                <div class="job-info">
                    <span class="department">${position.department}</span>
                    <span class="experience">${position.experienceLevel}</span>
                    ${position.location.city ? `<span class="location">${position.location.city}</span>` : ''}
                </div>
                <div class="salary-range">
                    $${this.formatSalary(position.salaryRange.min)} - $${this.formatSalary(position.salaryRange.max)}
                    ${position.salaryRange.equity ? ' + Equity' : ''}
                </div>
            </div>
            <div class="job-tags">
                ${position.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <button class="apply-btn" onclick="window.open('/careers/apply/${position.id}', '_blank')">
                Apply Now
            </button>
        `;
        return jobPosting;
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatSalary(amount) {
        return (amount / 1000).toFixed(0) + 'K';
    }

    // Get featured blog posts
    getFeaturedBlogPosts() {
        return this.blogPosts.filter(post => post.featured);
    }

    // Get featured career positions
    getFeaturedCareerPositions() {
        return this.careerPositions.filter(position => position.featured);
    }

    // Search functionality
    searchBlogPosts(query) {
        const searchTerm = query.toLowerCase();
        return this.blogPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.excerpt.toLowerCase().includes(searchTerm) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    searchCareerPositions(query) {
        const searchTerm = query.toLowerCase();
        return this.careerPositions.filter(position => 
            position.title.toLowerCase().includes(searchTerm) ||
            position.description.toLowerCase().includes(searchTerm) ||
            position.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
}

// Create global instance
window.dataLoader = new DataLoader();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing data loader...');
    await window.dataLoader.init();
    
    // Auto-render if containers exist
    if (document.getElementById('blog-container')) {
        console.log('Blog container found, rendering blog posts...');
        window.dataLoader.renderBlogPosts();
    }
    
    if (document.getElementById('careers-container')) {
        console.log('Careers container found, rendering career positions...');
        window.dataLoader.renderCareerPositions();
    }
});

// Export for module usage (if needed)
// export default DataLoader;
