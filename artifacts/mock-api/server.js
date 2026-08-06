import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

let serviceId = 1;
let transactionId = 1;

const services = [
  { id: serviceId++, name: 'Basic Wash', description: 'Exterior wash', price: 5.0, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Premium Wash', description: 'Exterior + interior', price: 12.5, isActive: true, createdAt: new Date().toISOString() },
];

const transactions = [
  { id: transactionId++, receiptNumber: '1001', serviceId: 1, serviceName: 'Basic Wash', servicePrice: 5.0, customerName: 'Alice', vehiclePlate: 'ABC-123', vehicleType: 'Sedan', amountPaid: 5.0, paymentMethod: 'Cash', notes: null, createdAt: new Date().toISOString() },
  { id: transactionId++, receiptNumber: '1002', serviceId: 2, serviceName: 'Premium Wash', servicePrice: 12.5, customerName: 'Bob', vehiclePlate: 'XYZ-789', vehicleType: 'SUV', amountPaid: 12.5, paymentMethod: 'Card', notes: null, createdAt: new Date().toISOString() },
];

app.get('/api/services', (_req, res) => {
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const { name, description = '', price, isActive = true } = req.body || {};
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price required' });
  }
  const newService = { id: serviceId++, name, description, price: Number(price), isActive, createdAt: new Date().toISOString() };
  services.push(newService);
  res.status(201).json(newService);
});

app.get('/api/reports/summary', (_req, res) => {
  const todayRevenue = transactions.reduce((s, t) => s + (t.amountPaid || 0), 0);
  const recentTransactions = transactions.slice(-5).reverse();
  const topServices = services.map(s => ({ serviceId: s.id, serviceName: s.name, totalRevenue: transactions.filter(t => t.serviceId === s.id).reduce((a,b)=>a+(b.amountPaid||0),0), transactionCount: transactions.filter(t => t.serviceId === s.id).length }));
  res.json({
    todayRevenue,
    todayTransactions: transactions.length,
    weekRevenue: todayRevenue,
    weekTransactions: transactions.length,
    monthRevenue: todayRevenue,
    monthTransactions: transactions.length,
    recentTransactions,
    topServices,
  });
});

app.get('/api/transactions', (req, res) => {
  const date = req.query.date;
  if (date) {
    // naive filter by date prefix
    const filtered = transactions.filter(t => t.createdAt.startsWith(date));
    return res.json(filtered);
  }
  res.json(transactions);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});
