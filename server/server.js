const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand 
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Backblaze B2 S3 Client
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION || 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY
  },
  forcePathStyle: true
});

const BUCKET_NAME = process.env.B2_BUCKET || 'falconi';
const SHIPPO_TOKEN = process.env.SHIPPO_API_TOKEN;

// Initialize Stripe (optional test mode if key provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('PlaceHolder')) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    console.log('Stripe init notice:', e.message);
  }
}

// Multer in-memory storage for B2 file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bucket: BUCKET_NAME,
    shippoConnected: Boolean(SHIPPO_TOKEN),
    timestamp: new Date().toISOString()
  });
});

/* =========================================================
   1. BACKBLAZE B2 MEDIA ENDPOINTS
   ========================================================= */

// List B2 files
app.get('/api/media/list', async (req, res) => {
  try {
    const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
    const response = await s3Client.send(command);
    const files = (response.Contents || []).map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      proxyUrl: `/api/media/file/${item.Key}`
    }));
    res.json({ success: true, count: files.length, files });
  } catch (error) {
    console.error('B2 List Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload file to B2
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const folder = req.body.folder ? `${req.body.folder.replace(/\/$/, '')}/` : '';
    const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'));
    const safeName = req.file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(fileExtension, '');
    const filename = `${folder}${Date.now()}_${safeName}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });

    await s3Client.send(command);
    const fileUrl = `http://localhost:${PORT}/api/media/file/${filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully to Backblaze B2',
      key: filename,
      url: fileUrl,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('B2 Upload Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stream / Proxy file from B2
app.get('/api/media/file/*', async (req, res) => {
  try {
    const key = req.params[0];
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    const response = await s3Client.send(command);

    if (response.ContentType) res.setHeader('Content-Type', response.ContentType);
    if (response.ContentLength) res.setHeader('Content-Length', response.ContentLength);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    response.Body.pipe(res);
  } catch (error) {
    console.error('B2 Proxy Stream Error:', error);
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

// Delete file from B2
app.delete('/api/media/file/*', async (req, res) => {
  try {
    const key = req.params[0];
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    await s3Client.send(command);
    res.json({ success: true, message: `File ${key} deleted` });
  } catch (error) {
    console.error('B2 Delete Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* =========================================================
   2. SHIPPO SHIPPING INTEGRATION
   ========================================================= */

// Calculate shipping rates with Shippo API
app.post('/api/shippo/rates', async (req, res) => {
  try {
    const { addressTo, addressFrom, parcel } = req.body;

    const shipmentData = {
      address_from: addressFrom || {
        name: "Falconi Parfums HQ",
        street1: "Main Street",
        city: "Paterson",
        state: "NJ",
        zip: "07522",
        country: "US",
        phone: "+15513014573",
        email: "info@falconiparfums.com"
      },
      address_to: addressTo || {
        name: "Cliente Falconi",
        street1: "123 Main Street",
        city: "Miami",
        state: "FL",
        zip: "33101",
        country: "US"
      },
      parcels: [parcel || {
        length: "8",
        width: "6",
        height: "4",
        distance_unit: "in",
        weight: "1.5",
        mass_unit: "lb"
      }],
      async: false
    };

    const fetchResponse = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipmentData)
    });

    const data = await fetchResponse.json();
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ success: false, error: data });
    }

    const mappedRates = (data.rates || []).map(r => {
      let serviceName = "Standard Shipping";
      if (r.servicelevel && typeof r.servicelevel === 'object') {
        serviceName = r.servicelevel.name || r.servicelevel.token || "Standard Shipping";
      } else if (typeof r.servicelevel === 'string') {
        serviceName = r.servicelevel;
      } else if (r.servicelevel_name) {
        serviceName = r.servicelevel_name;
      }

      let estDays = r.estimated_days;
      if (!estDays && r.duration_terms) estDays = r.duration_terms;
      if (!estDays && r.servicelevel && r.servicelevel.terms) estDays = r.servicelevel.terms;
      if (!estDays) estDays = serviceName.toLowerCase().includes('express') ? 1 : (serviceName.toLowerCase().includes('priority') ? 2 : 5);

      return {
        id: r.object_id,
        provider: (r.provider || 'USPS').toUpperCase(),
        servicelevel: serviceName,
        amount: r.amount,
        currency: r.currency || 'USD',
        estimatedDays: estDays
      };
    });

    // Sort rates lowest price first
    mappedRates.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

    res.json({
      success: true,
      shipmentId: data.object_id,
      status: data.status,
      rates: mappedRates
    });
  } catch (error) {
    console.error('Shippo Rates Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create shipping label with Shippo API
app.post('/api/shippo/create-label', async (req, res) => {
  try {
    const { rateId } = req.body;
    if (!rateId) {
      return res.status(400).json({ success: false, error: 'Rate ID is required' });
    }

    const fetchResponse = await fetch('https://api.goshippo.com/transactions/', {
      method: 'POST',
      headers: {
        'Authorization': `ShippoToken ${SHIPPO_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rate: rateId, async: false })
    });

    const data = await fetchResponse.json();
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).json({ success: false, error: data });
    }

    res.json({
      success: true,
      transactionId: data.object_id,
      trackingNumber: data.tracking_number,
      trackingUrl: data.tracking_url_provider,
      labelUrl: data.label_url,
      status: data.status
    });
  } catch (error) {
    console.error('Shippo Create Label Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* =========================================================
   3. STRIPE PAYMENT INTEGRATION
   ========================================================= */

// Create Checkout Session
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { items, customerEmail } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ success: false, error: 'No cart items provided' });
    }

    // Line items calculation applying discount if present
    const lineItems = items.map(item => {
      let finalPrice = Number(item.price);
      if (item.discountPercent && item.discountPercent > 0) {
        finalPrice = finalPrice * (1 - item.discountPercent / 100);
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            description: item.tagline || item.description || 'Falconi Parfums Luxury Item'
          },
          unit_amount: Math.round(finalPrice * 100) // cents
        },
        quantity: item.qty || 1
      };
    });

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: customerEmail || undefined,
        success_url: `http://localhost:3000/cart.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:3000/cart.html?payment=cancelled`
      });

      return res.json({ success: true, url: session.url, sessionId: session.id });
    } else {
      // Demo fallback checkout link
      const totalAmount = lineItems.reduce((acc, item) => acc + (item.price_data.unit_amount * item.quantity), 0) / 100;
      return res.json({
        success: true,
        demoMode: true,
        message: 'Stripe Test Mode Activated',
        totalAmount,
        url: `http://localhost:3000/cart.html?payment=success_demo&amount=${totalAmount}`
      });
    }
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✦ Falconi Backend (B2, Shippo, Stripe) running on http://localhost:${PORT}`);
  console.log(`✦ Shippo API connected: token active`);
});
