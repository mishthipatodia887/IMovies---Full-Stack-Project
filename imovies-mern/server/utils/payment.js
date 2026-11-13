/**
 * Server-side checks for the payment step (UPI / card / net banking).
 * IMPORTANT: this is a DEMO payment. Never store a full card number, expiry or CVV - only the summary this returns.
 * For real payments use a gateway (Razorpay, Stripe...) so card data never touches your server.
 */
const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank of India', 'IDFC FIRST Bank', 'Yes Bank', 'IndusInd Bank'];
const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Other UPI app'];

const luhn = (digits) => {
  let sum = 0; let dbl = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) { let x = Number(digits[i]); if (dbl) { x *= 2; if (x > 9) x -= 9; } sum += x; dbl = !dbl; }
  return sum % 10 === 0;
};
const brandOf = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : /^(60|65|81|82|508)/.test(n) ? 'RuPay' : '');

/**
 * @param {{method:'upi'|'card'|'bank', app?:string, upiId?:string, cardNumber?:string, cardName?:string, expiry?:string, cvv?:string, bank?:string}} p
 * @returns {{ok:boolean, errors:Object, summary:Object|null}}
 */
function validatePayment(p = {}, now = new Date()) {
  const errors = {};
  let summary = null;
  if (p.method === 'upi') {
    if (!UPI_APPS.includes(p.app)) errors.app = 'Choose a UPI app';
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(String(p.upiId || '').trim())) errors.upiId = 'Enter a valid UPI ID, e.g. name@okhdfcbank';
    summary = { method: 'upi', app: p.app };
  } else if (p.method === 'card') {
    const digits = String(p.cardNumber || '').replace(/\s/g, '');
    const brand = brandOf(digits);
    const exp = String(p.expiry || '').match(/^(\d\d)\/(\d\d)$/);
    if (!/^\d+$/.test(digits) || digits.length < (brand === 'Amex' ? 15 : 16) || digits.length > 19 || !luhn(digits)) errors.cardNumber = 'Enter a valid card number';
    if (String(p.cardName || '').trim().length < 2) errors.cardName = 'Enter the name on the card';
    if (!exp || Number(exp[1]) < 1 || Number(exp[1]) > 12) errors.expiry = 'Use MM/YY';
    else if (new Date(2000 + Number(exp[2]), Number(exp[1]), 1) <= now) errors.expiry = 'This card has expired';
    if (!new RegExp(`^\\d{${brand === 'Amex' ? 4 : 3}}$`).test(String(p.cvv || ''))) errors.cvv = `Enter the ${brand === 'Amex' ? 4 : 3}-digit CVV`;
    summary = { method: 'card', brand: brand || 'Card', last4: digits.slice(-4) };
  } else if (p.method === 'bank') {
    if (!BANKS.includes(p.bank)) errors.bank = 'Select your bank';
    summary = { method: 'bank', bank: p.bank };
  } else {
    errors.method = 'Choose a payment method';
  }
  const ok = Object.keys(errors).length === 0;
  return { ok, errors, summary: ok ? summary : null };
}

module.exports = { BANKS, UPI_APPS, luhn, brandOf, validatePayment };
