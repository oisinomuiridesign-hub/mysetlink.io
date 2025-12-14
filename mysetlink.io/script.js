const searchInput = document.getElementById('song-search');
const songItems = Array.from(document.querySelectorAll('.song-item'));
const list = document.querySelector('.song-list');
const emptyMsg = list?.querySelector('.empty');
const songsContainer = document.querySelector('.songs');
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
const songArrows = Array.from(document.querySelectorAll('.song-arrow'));
const scanButton = document.getElementById('scan-random');
const userDropdown = document.getElementById('user-dropdown');
const userToggle = document.getElementById('user-search-toggle');

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
        reviewTriggers.forEach(btn => btn.classList.add('dim'));
        tipTriggers.forEach(btn => btn.classList.remove('dim'));
        tipTriggers.forEach(btn => btn.classList.add('open'));
        reviewTriggers.forEach(btn => btn.classList.remove('open'));
    } else {
        tipPanel.classList.remove('open');
        reviewTriggers.forEach(btn => btn.classList.remove('dim'));
        tipTriggers.forEach(btn => btn.classList.remove('open'));
    }
}

function openTipPanel() {
    if (!tipPanel) return;
    tipPanel.classList.add('open');
    reviewPanel?.classList.remove('open');
    reviewTriggers.forEach(btn => btn.classList.add('dim'));
    tipTriggers.forEach(btn => btn.classList.remove('dim'));
    tipTriggers.forEach(btn => btn.classList.add('open'));
    reviewTriggers.forEach(btn => btn.classList.remove('open'));
}

function toggleReviewPanel() {
    if (!reviewPanel) return;
    const willOpen = !reviewPanel.classList.contains('open');
    if (willOpen) {
        reviewPanel.classList.add('open');
        tipPanel?.classList.remove('open');
        tipTriggers.forEach(btn => btn.classList.add('dim'));
        reviewTriggers.forEach(btn => btn.classList.remove('dim'));
        reviewTriggers.forEach(btn => btn.classList.add('open'));
        tipTriggers.forEach(btn => btn.classList.remove('open'));
    } else {
        reviewPanel.classList.remove('open');
        tipTriggers.forEach(btn => btn.classList.remove('dim'));
        reviewTriggers.forEach(btn => btn.classList.remove('open'));
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

let openRequestItem = null;

function buildInlineRequest(item, title, artist) {
    const existing = item.querySelector('.song-request-panel');
    if (existing) return existing;
    const panel = document.createElement('div');
    panel.className = 'song-request-panel';
    const textarea = document.createElement('textarea');
    textarea.className = 'request-message';
    textarea.placeholder = `Requesting ${title || 'this song'}\nAdd a message to your request?`;
    textarea.rows = 3;
    textarea.maxLength = 50;
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'song-send';
    send.append('Send request');
    const arrowIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowIcon.setAttribute('class', 'btn-arrow');
    arrowIcon.setAttribute('viewBox', '0 0 24 24');
    const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowPath.setAttribute('d', defaultArrowPath);
    arrowPath.setAttribute('fill', '#D8B200');
    arrowIcon.appendChild(arrowPath);
    send.appendChild(arrowIcon);
    panel.addEventListener('click', (ev) => ev.stopPropagation());
    panel.addEventListener('keydown', (ev) => ev.stopPropagation());
    send.addEventListener('click', () => {
        setArrowIcon(item, tickPath, '#D8B200');
        send.disabled = true;
        send.classList.add('sent');
        send.textContent = 'Request sent';
        setTimeout(() => {
            collapseInlineRequest(item, false);
            openTipPanel();
        }, 700);
    });
    panel.append(textarea, send);
    panel.style.maxHeight = '0px';
    requestAnimationFrame(() => {
        panel.classList.add('visible');
        panel.style.maxHeight = panel.scrollHeight + 'px';
    });
    return panel;
}

function collapseInlineRequest(item, revertIcon = true) {
    if (!item) return;
    const panel = item.querySelector('.song-request-panel');
    if (panel) {
        panel.classList.add('closing');
        panel.style.maxHeight = '0px';
        setTimeout(() => {
            panel.remove();
        }, 260);
    }
    if (revertIcon) setArrowIcon(item, defaultArrowPath, '#FFCC66');
    item.classList.remove('expanded');
    if (openRequestItem === item) openRequestItem = null;
}

function toggleInlineRequest(item) {
    const title = item.querySelector('.song-title')?.textContent.trim();
    const artist = item.querySelector('.song-artist')?.textContent.trim();
    if (openRequestItem && openRequestItem !== item) {
        collapseInlineRequest(openRequestItem);
    }
    const alreadyOpen = item.classList.contains('expanded');
    if (alreadyOpen) {
        collapseInlineRequest(item);
        return;
    }
    const panel = buildInlineRequest(item, title, artist);
    item.append(panel);
    setArrowIcon(item, closeXPath, '#D8B200');
    item.classList.add('expanded');
    openRequestItem = item;
}

const defaultArrowPath = 'M21.426 11.095L4.42601 3.09504C4.25482 3.0145 4.0643 2.98416 3.87657 3.00756C3.68883 3.03095 3.51158 3.10713 3.36541 3.22723C3.21923 3.34733 3.11012 3.50644 3.05076 3.68607C2.99139 3.8657 2.98419 4.05849 3.03001 4.24205L4.24201 9.09104L12 12L4.24201 14.909L3.03001 19.758C2.98333 19.9417 2.98992 20.1349 3.04902 20.315C3.10811 20.4951 3.21726 20.6546 3.3637 20.7749C3.51014 20.8953 3.68782 20.9714 3.87594 20.9944C4.06406 21.0175 4.25486 20.9865 4.42601 20.905L21.426 12.905C21.5978 12.8243 21.7431 12.6963 21.8448 12.536C21.9466 12.3758 22.0006 12.1899 22.0006 12C22.0006 11.8102 21.9466 11.6243 21.8448 11.464C21.7431 11.3038 21.5978 11.1758 21.426 11.095Z';
const closeXPath = 'M6 6 L18 18 M18 6 L6 18';
const tickPath = 'M6 13 L10 17 L18 7';

function setArrowIcon(item, pathData, fillColor) {
    const arrowIcon = item.querySelector('.song-arrow svg path');
    if (arrowIcon) {
        arrowIcon.setAttribute('d', pathData);
        if (pathData === defaultArrowPath) {
            arrowIcon.setAttribute('fill', fillColor || '#FFCC66');
            arrowIcon.removeAttribute('stroke');
            arrowIcon.removeAttribute('stroke-width');
            arrowIcon.removeAttribute('stroke-linecap');
            arrowIcon.removeAttribute('stroke-linejoin');
        } else {
            arrowIcon.setAttribute('fill', 'none');
            arrowIcon.setAttribute('stroke', fillColor || '#D8B200');
            arrowIcon.setAttribute('stroke-width', '2.6');
            arrowIcon.setAttribute('stroke-linecap', 'round');
            arrowIcon.setAttribute('stroke-linejoin', 'round');
        }
    }
}

songArrows.forEach(arrow => {
    const item = arrow.closest('.song-item');
    arrow.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item) toggleInlineRequest(item);
    });
    arrow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            if (item) toggleInlineRequest(item);
        }
    });
});

songItems.forEach(item => {
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', (e) => {
        const target = e.target;
        if (target instanceof Element && (target.closest('.song-arrow') || target.closest('.song-request-panel'))) return;
        toggleInlineRequest(item);
    });
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleInlineRequest(item);
        }
    });
});

// Stripe Elements checkout flow removed in favor of sliding to open Stripe link.
const songsTitle = document.querySelector('.songs-title');

// Random user "Scan" CTA on landing
if (scanButton) {
    const userUrls = ['oisin/mysetlink.html', 'emma/mysetlink.html', 'liam/mysetlink.html', 'sofia/mysetlink.html'];
    scanButton.addEventListener('click', () => {
        const pick = userUrls[Math.floor(Math.random() * userUrls.length)];
        window.location.href = pick;
    });
}

// Nav user dropdown
if (userToggle && userDropdown) {
    const hideDropdown = () => {
        userDropdown.classList.remove('open');
        userToggle.classList.remove('open');
        setTimeout(() => userDropdown.setAttribute('hidden', 'hidden'), 180);
    };

    userToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = userDropdown.hasAttribute('hidden');
        if (isHidden) {
            userDropdown.removeAttribute('hidden');
            requestAnimationFrame(() => {
                userDropdown.classList.add('open');
                userToggle.classList.add('open');
            });
        } else {
            hideDropdown();
        }
    });

    userDropdown.querySelectorAll('.user-item').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const url = btn.getAttribute('data-url');
            hideDropdown();
            if (url) window.location.href = url;
        });
    });

    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target instanceof Element && (userDropdown.contains(target) || userToggle.contains(target))) return;
        if (!userDropdown.hasAttribute('hidden')) hideDropdown();
    });
}
