import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

let serviceId = 1;
let transactionId = 1;
let loyaltyId = 1;

const services = [
  { id: serviceId++, name: 'Exterior Wash', description: 'Exterior wash', price: 50, priceSuv: 70, priceTruck: 100, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Interior Wash', description: 'Interior wash', price: 60, priceSuv: 80, priceTruck: 110, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Full Wash', description: 'Inside & outside wash', price: 80, priceSuv: 100, priceTruck: 150, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Engine Wash', description: 'Engine bay degrease and clean', price: 70, priceSuv: 80, priceTruck: 160, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Polishing with 1-2 Years Paint Protection', description: 'Machine polish with 1-2 years paint protection', price: 1500, priceSuv: 2000, priceTruck: 2500, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Full Valet & Steaming', description: 'Full valet and steam clean', price: 800, priceSuv: 1200, priceTruck: 1500, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Seat Cover Installation', description: 'Seat cover fitting', price: 50, priceSuv: 60, priceTruck: 80, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Dashboard Polish', description: 'Dashboard dressing and polish', price: 150, priceSuv: 150, priceTruck: 200, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Rim Cleaning', description: 'Rim deep cleaning', price: 300, priceSuv: 300, priceTruck: 400, isActive: true, createdAt: new Date().toISOString() },
  { id: serviceId++, name: 'Roof Lining Cleaning', description: 'Roof lining wash and clean', price: 80, priceSuv: 100, priceTruck: 200, isActive: true, createdAt: new Date().toISOString() },
];

const transactions = [
  { id: transactionId++, receiptNumber: '1001', serviceId: 1, serviceName: 'Exterior Wash', servicePrice: 50, customerName: 'Alice', customerPhone: null, vehiclePlate: 'ABC-123', vehicleType: 'Sedan', amountPaid: 50, paymentMethod: 'Cash', notes: null, createdAt: new Date().toISOString() },
  { id: transactionId++, receiptNumber: '1002', serviceId: 2, serviceName: 'Interior Wash', servicePrice: 60, customerName: 'Bob', customerPhone: '260971111111', vehiclePlate: 'XYZ-789', vehicleType: 'SUV', amountPaid: 80, paymentMethod: 'Card', notes: null, createdAt: new Date().toISOString() },
];

// phone -> loyalty record (mirrors the real API's free-wash competition)
const loyalty = new Map();

const FREE_WASH_THRESHOLD = 4;
const toRecord = (l) => ({ ...l, updatedAt: new Date().toISOString() });
const normalise = (phone) => {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  return /^\d{7,15}$/.test(digits) ? digits : null;
};

app.get('/api/services', (_req, res) => {
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const { name, description = '', price, priceSuv = null, priceTruck = null, isActive = true } = req.body || {};
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price required' });
  }
  const newService = {
    id: serviceId++, name, description,
    price: Number(price),
    priceSuv: priceSuv != null ? Number(priceSuv) : null,
    priceTruck: priceTruck != null ? Number(priceTruck) : null,
    isActive, createdAt: new Date().toISOString(),
  };
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
    const filtered = transactions.filter(t => t.createdAt.startsWith(date));
    return res.json(filtered);
  }
  res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
  const body = req.body || {};
  const { serviceId, customerName, customerPhone, sendSms = false, redeemFreeWash = false, vehiclePlate, vehicleType = 'Car', amountPaid, paymentMethod = 'Cash', notes = null } = body;

  const service = services.find(s => s.id === Number(serviceId));
  if (!service) return res.status(400).json({ error: 'Service not found' });

  const recipient = normalise(customerPhone);
  if (redeemFreeWash && !recipient) {
    return res.status(400).json({ error: 'A customer phone number is required to redeem a free wash' });
  }

  const loyaltyEarned = () => ({
    washCount: 0,
    freeWashesAvailable: 0,
    freeWashEarned: false,
    freeWashSmsStatus: 'not_requested',
    redeemedFreeWash: false,
  });

  let loyaltyResult = loyaltyEarned();

  if (recipient) {
    loyaltyResult = loyaltyEarned();
    let record = loyalty.get(recipient);
    const redeemed = Boolean(redeemFreeWash);

    if (redeemed) {
      if (!record || record.freeWashesAvailable < 1) {
        return res.status(400).json({ error: 'This customer does not have a free wash available' });
      }
      record.freeWashesAvailable -= 1;
      record.freeWashesRedeemed += 1;
      loyaltyResult = {
        washCount: record.washCount,
        freeWashesAvailable: record.freeWashesAvailable,
        freeWashEarned: false,
        freeWashSmsStatus: 'not_requested',
        redeemedFreeWash: true,
      };
    } else {
      const washCount = (record?.washCount ?? 0) + 1;
      const freeWashesAvailable = record?.freeWashesAvailable ?? 0;
      const freeWashesEarned = record?.freeWashesEarned ?? 0;
      const freeWashesRedeemed = record?.freeWashesRedeemed ?? 0;
      const won = washCount >= FREE_WASH_THRESHOLD;

      loyalty.set(recipient, {
        id: record?.id ?? loyaltyId++,
        phone: recipient,
        customerName,
        washCount: won ? 0 : washCount,
        freeWashesAvailable: won ? freeWashesAvailable + 1 : freeWashesAvailable,
        freeWashesEarned: won ? freeWashesEarned + 1 : freeWashesEarned,
        freeWashesRedeemed,
      });

      loyaltyResult = {
        washCount: won ? 0 : washCount,
        freeWashesAvailable: won ? freeWashesAvailable + 1 : freeWashesAvailable,
        freeWashEarned: won,
        freeWashSmsStatus: won ? 'sent' : 'not_requested',
        redeemedFreeWash: false,
      };
    }
  }

  const finalNotes = redeemed
    ? notes ? `${notes}\nFree wash (loyalty reward)` : 'Free wash (loyalty reward)'
    : notes;

  const tx = {
    id: transactionId++,
    receiptNumber: String(1000 + transactionId),
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    customerName: customerName ?? '',
    customerPhone: recipient,
    vehiclePlate: String(vehiclePlate || '').toUpperCase(),
    vehicleType,
    amountPaid: redeemed ? 0 : Number(amountPaid),
    paymentMethod,
    notes: finalNotes,
    createdAt: new Date().toISOString(),
  };
  transactions.push(tx);

  const smsStatus = sendSms ? 'sent' : 'not_requested';
  res.status(201).json({ ...tx, smsStatus, loyalty: loyaltyResult });
});

app.get('/api/loyalty', (_req, res) => {
  const rows = Array.from(loyalty.values()).sort((a, b) => b.freeWashesEarned - a.freeWashesEarned || b.washCount - a.washCount);
  res.json(rows.map(toRecord));
});

app.get('/api/loyalty/:customerId', (req, res) => {
  const phone = normalise(req.params.customerId);
  if (!phone) return res.status(400).json({ error: 'Invalid phone number' });
  const record = loyalty.get(phone);
  if (!record) return res.status(404).json({ error: 'No loyalty record found for this customer' });
  res.json(toRecord(record));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});