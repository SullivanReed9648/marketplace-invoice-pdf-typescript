import assert from "node:assert/strict";
import { invoiceHtml, orderSchema } from "../src/invoice_service.js";

const order = orderSchema.parse({
  id: "order-test",
  currency: "USD",
  buyer: { name: "Buyer", email: "buyer@example.com" },
  seller: { name: "Seller", address: "1 Main Street" },
  items: [{ name: "Notebook", quantity: 3, unitPrice: 4.25 }]
});
const html = invoiceHtml(order);
assert.match(html, /Invoice order-test/);
assert.match(html, /Total: 12\.75 USD/);
console.log("invoice decision test passed");
