import { generateInvoice } from "./invoice_service.js";

const order = {
  id: "order-1042",
  currency: "USD",
  buyer: { name: "Ada Buyer", email: "ada@example.com" },
  seller: { name: "Northwind Crafts", address: "42 Market Street" },
  items: [{ name: "Handmade mug", quantity: 2, unitPrice: 18.5 }]
};

const pdf = await generateInvoice(order);
console.log(JSON.stringify({ orderId: order.id, invoice: pdf }));
