import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Allow base64 image payloads up to 10MB for product & receipt photos
app.use(express.json({ limit: '10mb' }));

// Simple in-memory rate limiter for AI endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRequests = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/ai/scan-product
app.post('/api/ai/scan-product', async (req, res) => {
  try {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(clientIp, 20, 60_000)) {
      res.status(429).json({
        error: 'धेरै अनुरोधहरू पठाइयो। कृपया एक मिनेट पछि फेरि प्रयास गर्नुहोस्। (Rate limit exceeded. Please try again in a minute.)',
      });
      return;
    }

    const { imageBase64, mimeType, hintText } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({
        error: 'कृपया सामानको फोटो अपलोड गर्नुहोस्। (Please provide a valid product image.)',
      });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const safeMimeType = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

    const ai = getGenAIClient();
    const prompt = `You are an expert product & market price analyst for Nepal ("Kati Paryo?").
Analyze the attached product image ${hintText ? `(User hint: "${String(hintText).slice(0, 120)}")` : ''}.
Identify the product name (in English and Nepali), brand, model, category, and approximate product type.
Estimate the typical retail market price range in Nepalese Rupees (NPR / Rs.) in Nepal based on known Nepal market ranges.
IMPORTANT:
- Never claim the price is guaranteed real-time data; provide a realistic Estimated Nepal Market Price range (minPriceNpr, avgPriceNpr, maxPriceNpr).
- Choose categorySlug strictly from:
  "mobile-electronics", "laptop-computer", "tv-appliances", "grocery", "clothing", "cosmetics", "furniture", "construction-materials", "motorcycle-auto-parts", "kitchen-products", "home-products", "other".
- If the image does not show a recognizable product, set identified to false and confidence below 30.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: safeMimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            identified: { type: Type.BOOLEAN },
            productName: { type: Type.STRING },
            productNameNe: { type: Type.STRING },
            brand: { type: Type.STRING },
            model: { type: Type.STRING },
            categorySlug: { type: Type.STRING },
            categoryName: { type: Type.STRING },
            approximateType: { type: Type.STRING },
            minPriceNpr: { type: Type.NUMBER },
            avgPriceNpr: { type: Type.NUMBER },
            maxPriceNpr: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            verificationNoteNe: { type: Type.STRING },
            verificationNoteEn: { type: Type.STRING },
          },
          required: [
            'identified',
            'productName',
            'productNameNe',
            'brand',
            'model',
            'categorySlug',
            'categoryName',
            'approximateType',
            'minPriceNpr',
            'avgPriceNpr',
            'maxPriceNpr',
            'confidence',
            'verificationNoteNe',
            'verificationNoteEn',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({
        error: 'यो सामान पहिचान गर्न सकिएन। कृपया नाम वा brand manually छान्नुहोस्।',
      });
      return;
    }

    const parsed = JSON.parse(text.trim());
    res.json(parsed);
  } catch (error) {
    console.error('AI Product Scan Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'माफ गर्नुहोस्, फोटो स्क्यान गर्दा समस्या आयो। फेरि प्रयास गर्नुहोस्।',
    });
  }
});

// POST /api/ai/scan-bill
app.post('/api/ai/scan-bill', async (req, res) => {
  try {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(clientIp, 20, 60_000)) {
      res.status(429).json({
        error: 'धेरै अनुरोधहरू पठाइयो। कृपया एक मिनेट पछि फेरि प्रयास गर्नुहोस्।',
      });
      return;
    }

    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({
        error: 'कृपया बिल वा रसिदको फोटो अपलोड गर्नुहोस्।',
      });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const safeMimeType = typeof mimeType === 'string' && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

    const ai = getGenAIClient();
    const prompt = `You are an expert OCR and Nepal retail receipt/bill extractor for the "Kati Paryo?" app.
Extract all purchased items, quantities, individual unit prices in NPR, line totals, overall bill total, date, shop name (if visible), and likely Nepal district/city (default to "Kathmandu" if not visible).
If no clear items are visible, return an empty items array and confidence below 30.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: safeMimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shopName: { type: Type.STRING },
            billDate: { type: Type.STRING },
            district: { type: Type.STRING },
            totalAmount: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  quantity: { type: Type.INTEGER },
                  unitPrice: { type: Type.NUMBER },
                  lineTotal: { type: Type.NUMBER },
                  categorySlug: { type: Type.STRING },
                },
                required: ['productName', 'quantity', 'unitPrice', 'lineTotal', 'categorySlug'],
              },
            },
          },
          required: ['shopName', 'billDate', 'district', 'totalAmount', 'confidence', 'items'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      res.status(500).json({
        error: 'बिलबाट विवरण निकाल्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।',
      });
      return;
    }

    const parsed = JSON.parse(text.trim());
    res.json(parsed);
  } catch (error) {
    console.error('AI Bill Scan Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'माफ गर्नुहोस्, बिल स्क्यान गर्दा समस्या आयो। फेरि प्रयास गर्नुहोस्।',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kati Paryo? server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
