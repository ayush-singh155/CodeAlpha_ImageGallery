// Filter button functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filterValue = this.getAttribute('data-filter');
            console.log('Filter by:', filterValue);
            
            // Add your filter logic here
            filterGalleryItems(filterValue);
        });
    });
    
    // Set "All" button as active by default
    filterBtns[0].classList.add('active');

    enableFullscreenGallery();
});

function filterGalleryItems(category) {
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    galleryItems.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.animation = 'none';
            setTimeout(() => {
                item.style.display = 'block';
                item.style.animation = 'fadeInScale 0.6s ease-out';
            }, 10);
        } else {
            item.style.display = 'none';
        }
    });
}

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

function enableFullscreenGallery() {
    const galleryImages = document.querySelectorAll('.gallery-item img');
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    overlay.innerHTML = `
        <button class="close-btn" aria-label="Close full screen image">✕</button>
        <button class="nav-btn prev" aria-label="Previous image">‹</button>
        <button class="nav-btn next" aria-label="Next image">›</button>
        <img src="" alt="Full screen image">
    `;
    document.body.appendChild(overlay);

    const overlayImage = overlay.querySelector('img');
    const closeButton = overlay.querySelector('.close-btn');

    let currentIndex = -1;
    const images = Array.from(galleryImages);
    const prevBtn = overlay.querySelector('.nav-btn.prev');
    const nextBtn = overlay.querySelector('.nav-btn.next');

    function openAt(index) {
        if (index < 0 || index >= images.length) return;
        const img = images[index];
        overlayImage.src = img.src;
        overlayImage.alt = img.alt || 'Fullscreen image';
        // Adjust fit based on category so animal images show fully
        const category = img.closest('.gallery-item')?.getAttribute('data-category');
        if (category === 'animals') {
            overlayImage.style.objectFit = 'contain';
            overlayImage.style.backgroundColor = '#111';
        } else {
            overlayImage.style.objectFit = 'cover';
            overlayImage.style.backgroundColor = 'transparent';
        }
        currentIndex = index;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeOverlay() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        overlayImage.src = '';
        currentIndex = -1;
        document.removeEventListener('keydown', handleKeydown);
    }

    function showPrev() {
        if (images.length === 0) return;
        const nextIndex = (currentIndex - 1 + images.length) % images.length;
        openAt(nextIndex);
    }

    function showNext() {
        if (images.length === 0) return;
        const nextIndex = (currentIndex + 1) % images.length;
        openAt(nextIndex);
    }

    function handleKeydown(e) {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeOverlay();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    }

    images.forEach((img, idx) => {
        img.addEventListener('click', () => openAt(idx));
    });

    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });

    closeButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            closeOverlay();
        }
    });

    document.addEventListener('keydown', handleKeydown);
}