const searchInput = document.getElementById('song-search');
const songItems = Array.from(document.querySelectorAll('.song-item'));
const list = document.querySelector('.song-list');
const emptyMsg = list?.querySelector('.empty');
const tipTrigger = document.querySelector('.tip-trigger');
const tipPanel = document.querySelector('.tip-panel');
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
const stripeUrl = 'https://buy.stripe.com/eVa5l11vq9nNaXu4gg';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SXnCzGwETsTZkEIOYFMIay6bz4vdFdH9euTdfZFdqxXeEzyqXIn3Zclgbh8eAOlLqBG6zfDd58ACeENMG95baog0053kUvjuf';
const CREATE_PAYMENT_INTENT_URL = '/api/create-payment-intent';
let stripe;
let tipElements;
let tipElementInitialized = false;
const requestModal = document.querySelector('[data-request-modal]');
const requestTitle = document.querySelector('.request-song-title');
const requestCancel = document.querySelector('.request-cancel');
const requestSend = document.querySelector('.request-send');
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
    tipPanel.classList.toggle('open');
    if (tipPanel.classList.contains('open')) {
        initTipStripe();
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

tipTrigger?.addEventListener('click', toggleTipPanel);
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
}

function closeRequestModal() {
    requestModal?.classList.remove('open');
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
    // Placeholder: integrate your request submission here.
    closeRequestModal();
    alert('Request sent!');
});

window.addEventListener('DOMContentLoaded', () => {
    songArrows.forEach(arrow => {
        const item = arrow.closest('.song-item');
        const title = item?.querySelector('.song-title')?.textContent.trim();
        const artist = item?.querySelector('.song-artist')?.textContent.trim();
        arrow.addEventListener('click', () => openRequestModal(title, artist));
    });
});

// Stripe tip integration (frontend only; requires backend for PaymentIntent)
async function initTipStripe() {
    if (tipElementInitialized) return;
    if (!tipElementMount || !tipForm) return;
    if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => initTipStripe();
        document.head.appendChild(script);
        return;
    }
    if (STRIPE_PUBLISHABLE_KEY.includes('replace')) {
        tipStatus && (tipStatus.textContent = 'Add your Stripe publishable key to enable tipping.');
        return;
    }
    try {
        stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
        const clientSecret = await createPaymentIntent(getAmountCents());
        if (!clientSecret) {
            tipStatus && (tipStatus.textContent = 'Unable to start tip payment.');
            return;
        }
        tipElements = stripe.elements({ clientSecret });
        const paymentElement = tipElements.create('payment');
        paymentElement.mount(tipElementMount);
        tipElementInitialized = true;
        tipStatus && (tipStatus.textContent = '');
    } catch (err) {
        tipStatus && (tipStatus.textContent = 'Error loading Stripe. Check console.');
        // eslint-disable-next-line no-console
        console.error(err);
    }
}

function getAmountCents() {
    const val = parseFloat(tipAmountInput?.value || '5');
    const amount = Math.max(1, Math.round(val * 100));
    return amount;
}

async function createPaymentIntent(amount) {
    try {
        const res = await fetch(CREATE_PAYMENT_INTENT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.clientSecret;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return null;
    }
}

tipForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!stripe || !tipElements) {
        tipStatus && (tipStatus.textContent = 'Stripe not ready.');
        return;
    }
    tipSubmit && (tipSubmit.disabled = true);
    tipStatus && (tipStatus.textContent = 'Processing...');
    const clientSecret = await createPaymentIntent(getAmountCents());
    if (!clientSecret) {
        tipStatus && (tipStatus.textContent = 'Could not create payment.');
        tipSubmit && (tipSubmit.disabled = false);
        return;
    }
    const elements = stripe.elements({ clientSecret });
    const paymentElement = elements.create('payment');
    paymentElement.mount(tipElementMount);
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href,
        },
    });
    if (error) {
        tipStatus && (tipStatus.textContent = error.message || 'Payment failed.');
        tipSubmit && (tipSubmit.disabled = false);
    }
});
