const searchInput = document.getElementById('song-search');
const songItems = Array.from(document.querySelectorAll('.song-item'));
const list = document.querySelector('.song-list');
const emptyMsg = list?.querySelector('.empty');
const tipTriggers = Array.from(document.querySelectorAll('.tip-trigger'));
const tipPanel = document.querySelector('.tip-panel');
const reviewTriggers = Array.from(document.querySelectorAll('.review-trigger'));
const reviewPanel = document.querySelector('.review-panel');
const tipForm = document.querySelector('#tip-form');
const tipAmountInput = document.querySelector('#tip-amount');
const tipSubmit = document.querySelector('#tip-submit');
const tipStatus = document.querySelector('#tip-status');
const tipElementMount = document.querySelector('#tip-element');
const modal = document.querySelector('[data-modal]');
const closeModalBtn = document.querySelector('.modal-close');
const slider = document.querySelector('.slider');
const thumb = document.querySelector('[data-thumb]');
const sliderHint = document.querySelector('.slider-hint');
const stripeUrl = 'https://buy.stripe.com/7sY8wPfAY67R9XB5icgfu00';
// Stripe Elements not used for sliding flow; kept for future server integration.
const requestModal = document.querySelector('[data-request-modal]');
const requestTitle = document.querySelector('.request-song-title');
const requestCancel = document.querySelector('.request-cancel');
const requestSend = document.querySelector('.request-send');
const requestSheet = document.querySelector('.request-sheet');
const requestGrabber = document.querySelector('.request-grabber');
const songArrows = Array.from(document.querySelectorAll('.song-arrow'));

function filterSongs() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;
    songItems.forEach(item => {
        const text = item.dataset.text || '';
        const isMatch = text.includes(query);
        item.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) visibleCount += 1;
    });
    if (!emptyMsg) return;
    if (visibleCount === 0) {
        emptyMsg.style.display = 'block';
        list?.classList.add('no-results');
    } else {
        emptyMsg.style.display = 'none';
        list?.classList.remove('no-results');
    }
}

searchInput?.addEventListener('input', filterSongs);

function toggleTipPanel() {
    if (!tipPanel) return;
    const willOpen = !tipPanel.classList.contains('open');
    if (willOpen) {
        tipPanel.classList.add('open');
        reviewPanel?.classList.remove('open');
        tipPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        tipPanel.classList.remove('open');
    }
}

function openTipPanel() {
    if (!tipPanel) return;
    tipPanel.classList.add('open');
    reviewPanel?.classList.remove('open');
}

function toggleReviewPanel() {
    if (!reviewPanel) return;
    const willOpen = !reviewPanel.classList.contains('open');
    if (willOpen) {
        reviewPanel.classList.add('open');
        tipPanel?.classList.remove('open');
        reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        reviewPanel.classList.remove('open');
    }
}

function openModal() {
    modal?.classList.add('open');
}

function closeModal() {
    modal?.classList.remove('open');
    resetSlider();
}

function resetSlider() {
    if (!thumb) return;
    thumb.style.transform = 'translateX(0)';
    slider?.classList.remove('confirmed');
    if (sliderHint) sliderHint.style.opacity = '1';
}

function confirmTip() {
    slider?.classList.add('confirmed');
    if (sliderHint) sliderHint.style.opacity = '0';
    window.open(stripeUrl, '_blank', 'noopener,noreferrer');
    setTimeout(closeModal, 300);
}

function handleDrag() {
    if (!slider || !thumb) return;
    const track = slider.querySelector('.slider-track');
    let dragging = false;
    let startX = 0;
    let maxX = 0;

    const onPointerDown = (e) => {
        dragging = true;
        startX = e.clientX || (e.touches && e.touches[0].clientX);
        const rect = track.getBoundingClientRect();
        maxX = rect.width - thumb.offsetWidth - 8;
        sliderHint && (sliderHint.style.opacity = '1');
        e.preventDefault();
    };

    const onPointerMove = (e) => {
        if (!dragging) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const delta = clientX - startX;
        const clamped = Math.max(0, Math.min(delta, maxX));
        thumb.style.transform = `translateX(${clamped}px)`;
        if (sliderHint) {
            const ratio = maxX === 0 ? 0 : clamped / maxX;
            sliderHint.style.opacity = `${Math.max(0, 1 - ratio * 1.4)}`;
        }
        if (clamped >= maxX) {
            dragging = false;
            confirmTip();
        }
    };

    const onPointerUp = () => {
        if (!dragging) return;
        dragging = false;
        thumb.style.transform = 'translateX(0)';
        if (sliderHint) sliderHint.style.opacity = '1';
    };

    thumb.addEventListener('mousedown', onPointerDown);
    thumb.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
}

tipTriggers.forEach(btn => btn.addEventListener('click', toggleTipPanel));
reviewTriggers.forEach(btn => btn.addEventListener('click', toggleReviewPanel));
closeModalBtn?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});
slider?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        confirmTip();
    }
});
handleDrag();

function openRequestModal(title, artist) {
    if (requestTitle) {
        requestTitle.textContent = title || 'this song';
    }
    const artistEl = document.querySelector('.request-song-artist');
    if (artistEl) {
        artistEl.textContent = artist || 'Artist';
    }
    requestModal?.classList.add('open');
    if (requestSheet) requestSheet.style.transform = '';
}

function closeRequestModal() {
    requestModal?.classList.remove('open');
    if (requestSheet) requestSheet.style.transform = '';
}

songArrows.forEach(arrow => {
    const item = arrow.closest('.song-item');
    const title = item?.querySelector('.song-title')?.textContent.trim();
    const artist = item?.querySelector('.song-artist')?.textContent.trim();
    arrow.addEventListener('click', (e) => {
        e.stopPropagation();
        openRequestModal(title, artist);
    });
    arrow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            openRequestModal(title, artist);
        }
    });
});

songItems.forEach(item => {
    const title = item.querySelector('.song-title')?.textContent.trim();
    const artist = item.querySelector('.song-artist')?.textContent.trim();
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', (e) => {
        const target = e.target;
        if (target instanceof Element && target.closest('.song-arrow')) return;
        openRequestModal(title, artist);
    });
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openRequestModal(title, artist);
        }
    });
});

requestCancel?.addEventListener('click', closeRequestModal);
requestModal?.addEventListener('click', (e) => {
    if (e.target === requestModal) closeRequestModal();
});
requestSend?.addEventListener('click', () => {
    // Placeholder: integrate your request submission here if needed.
    closeRequestModal();
    openTipPanel();
});

window.addEventListener('DOMContentLoaded', () => {
    songArrows.forEach(arrow => {
        const item = arrow.closest('.song-item');
        const title = item?.querySelector('.song-title')?.textContent.trim();
        const artist = item?.querySelector('.song-artist')?.textContent.trim();
        arrow.addEventListener('click', () => openRequestModal(title, artist));
    });
});

// Drag-to-close for request sheet
if (requestGrabber && requestSheet && requestModal) {
    let dragging = false;
    let startY = 0;
    let currentY = 0;
    const threshold = 100;

    const onStart = (clientY) => {
        dragging = true;
        startY = clientY;
        currentY = 0;
        requestSheet.classList.add('dragging');
    };

    const onMove = (clientY) => {
        if (!dragging) return;
        currentY = Math.max(0, clientY - startY);
        requestSheet.style.transform = `translateY(${currentY}px)`;
    };

    const onEnd = () => {
        if (!dragging) return;
        dragging = false;
        requestSheet.classList.remove('dragging');
        if (currentY > threshold) {
            closeRequestModal();
        } else {
            requestSheet.style.transform = 'translateY(0)';
        }
    };

    requestGrabber.addEventListener('mousedown', (e) => onStart(e.clientY));
    requestGrabber.addEventListener('touchstart', (e) => onStart(e.touches[0].clientY), { passive: true });
    window.addEventListener('mousemove', (e) => onMove(e.clientY));
    window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY), { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
}

// Stripe Elements checkout flow removed in favor of sliding to open Stripe link.
