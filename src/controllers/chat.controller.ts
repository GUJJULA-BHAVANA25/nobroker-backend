import { Request, Response } from 'express';
import { PrismaClient, Property } from '@prisma/client';

const prisma = new PrismaClient();

interface PropertyFilter {
  forType?: string;
  city?: string;
  maxPrice?: number;
  propertyType?: string;
}

interface PropertyResult {
  id: string;
  title: string;
}

const extractInfo = (message: string): PropertyFilter => {
  const msg = message.toLowerCase();
  const filters: PropertyFilter = {};

  if (msg.includes('rent')) filters.forType = 'RENT';
  if (msg.includes('buy') || msg.includes('sale') || msg.includes('sell')) filters.forType = 'SALE';

  const cityMatch = msg.match(/in ([a-zA-Z]+)/);
  if (cityMatch) filters.city = cityMatch[1];

  const priceMatch = msg.match(/under (\d{4,7})/);
  if (priceMatch) filters.maxPrice = parseFloat(priceMatch[1]);

  const houseTypeMatch = msg.match(/house|villa|apartment|studio|plot/);
  if (houseTypeMatch) filters.propertyType = houseTypeMatch[0].toUpperCase();

  return filters;
};

const getRandomResponse = (responses: string[]): string => {
  return responses[Math.floor(Math.random() * responses.length)];
};

export const chatWithBot = async (req: Request, res: Response) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase().trim();

  await prisma.chat.create({ data: { sender: 'user', message } });

  let response = '';
  let properties: Property[] = [];

  // Handle greetings and basic questions
  if (/^(hi|hello|hey)\b/.test(lowerMessage)) {
    response = getRandomResponse([
      "Hello there! 👋 I'm PropertyBot. How can I help you with properties today?",
      "Hi! 😊 Ready to find your dream property? What are you looking for?",
      "Hey! 🏡 I specialize in property searches. Try asking about 'houses for rent' or 'apartments for sale'"
    ]);
  } else if (lowerMessage.includes('how are you')) {
    response = "I'm just a bot, but I'm great at finding properties! What can I search for you?";
  } else if (lowerMessage.includes('what can you do')) {
    response = "I can help you find properties by:\n- Location (city)\n- Price range\n- Property type\n- Number of bedrooms\n\nTry: 'Show 2BHK apartments in Mumbai under 1Cr'";
  } else {
    // Property search logic
    const filters = extractInfo(message);

    try {
      properties = await prisma.property.findMany({
        where: {
          ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
          ...(filters.forType && { forType: filters.forType }),
          ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
          ...(filters.propertyType && { propertyType: filters.propertyType as any }), // Type assertion needed for enum
        },
        take: 5,
      });

      if (properties.length === 0) {
        response = "No properties found. Try different criteria like:\n'3BHK flats in Bangalore under 50k'\n'or 'Villas for sale in Goa'";
      } else {
        response = `I found ${properties.length} properties:\n\n`;
        response += properties.map(
          (p) => `🏠 ${p.title} (${p.propertyType})\n📍 ${p.city} | ₹${p.price.toLocaleString()}\n🛏️ ${p.bedrooms || 'N/A'} BHK | 📏 ${p.area || 'N/A'} ${p.areaUnit || ''}\n`
        ).join('\n');
      }
    } catch (err) {
      console.error('[CHAT BOT PROPERTY ERROR]', err);
      response = 'Sorry, I encountered an error while searching. Please try again with different criteria.';
    }
  }

  await prisma.chat.create({ data: { sender: 'bot', message: response } });
  
  const propertyResults: PropertyResult[] = properties.map(p => ({
    id: p.id,
    title: p.title
  }));

  res.json({ 
    response,
    properties: propertyResults
  });
};