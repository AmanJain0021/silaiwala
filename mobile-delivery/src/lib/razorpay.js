/*
 * Drop-in for the web's `new window.Razorpay(options)` using the native SDK (react-native-razorpay).
 *   const rzp = new Razorpay(options); rzp.on('payment.failed', cb); rzp.open();
 * options.handler(response) receives { razorpay_payment_id, razorpay_order_id, razorpay_signature }.
 * A user cancel is reported through 'payment.failed' (web: closing the modal did nothing).
 */
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from './config';

export default class Razorpay {
  constructor(options) {
    this.options = options || {};
    this.listeners = {};
  }

  on(event, cb) {
    this.listeners[event] = cb;
  }

  async open() {
    const { handler, modal, ...rest } = this.options;
    const opts = { ...rest, key: rest.key || RAZORPAY_KEY_ID, amount: String(rest.amount) };
    try {
      const data = await RazorpayCheckout.open(opts);
      await handler?.(data);
    } catch (err) {
      const description = err?.description || err?.error?.description || 'Payment cancelled';
      let parsed = description;
      try { parsed = JSON.parse(description)?.error?.description || description; } catch (_) { /* plain text */ }
      if (modal?.ondismiss && /cancel/i.test(String(parsed))) modal.ondismiss();
      this.listeners['payment.failed']?.({ error: { code: err?.code, description: parsed } });
    }
  }
}
