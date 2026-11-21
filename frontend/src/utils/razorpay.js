const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loadingPromise = null;

/**
 * Ensures Razorpay Checkout is available on window. index.html loads it with `defer`,
 * but that tag can be slow / blocked, so pay buttons call this before `new window.Razorpay`.
 * Resolves true when ready, false if the script could not be loaded.
 */
export const loadRazorpayScript = () => {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise((resolve) => {
        const done = (ok) => {
            if (!ok) loadingPromise = null; // allow a retry on the next click
            resolve(ok && !!window.Razorpay);
        };
        let script = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
        if (!script) {
            script = document.createElement('script');
            script.src = CHECKOUT_SRC;
            script.async = true;
            document.body.appendChild(script);
        } else if (window.Razorpay) {
            done(true);
            return;
        }
        script.addEventListener('load', () => done(true), { once: true });
        script.addEventListener('error', () => done(false), { once: true });
        // Safety net so a hung request doesn't leave the button spinning forever
        setTimeout(() => done(!!window.Razorpay), 15000);
    });
    return loadingPromise;
};

/**
 * The key must belong to the same Razorpay account that created the order on the
 * backend, so prefer the key the API returns over the build-time env value.
 */
export const resolveRazorpayKey = (rzpOrder) => rzpOrder?.key || import.meta.env.VITE_RAZORPAY_KEY_ID;

/** Loads the SDK (if needed) and returns a Razorpay instance, or throws a friendly error. */
export const createRazorpayInstance = async (options) => {
    const ready = await loadRazorpayScript();
    if (!ready) {
        throw new Error('Could not load the payment gateway. Please check your internet connection and try again.');
    }
    return new window.Razorpay(options);
};
