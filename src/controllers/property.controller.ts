import { Request, Response } from 'express';
import { Prisma, PrismaClient, PropertyType } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Initialize Prisma Client with connection pooling
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Connection retry logic
const MAX_RETRIES = 5;
let retryCount = 0;

async function connectWithRetry() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Connection attempt ${retryCount} failed. Retrying...`);
      await new Promise(res => setTimeout(res, 2000));
      await connectWithRetry();
    } else {
      console.error('Max retries reached. Could not connect to database:', error);
      process.exit(1);
    }
  }
}

connectWithRetry();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Middleware to check database connection
export const checkDbConnection = async (_req: Request, res: Response, next: Function) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({ 
      error: 'Service unavailable',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/properties/add
 * Add new property (without images)
 */
export const addProperty = async (req: Request, res: Response) => {
  const {
    title,
    description,
    address,
    city,
    state,
    pincode,
    price,
    propertyType,
    phone,
    bedrooms,
    area,
    areaUnit,
    forType,
    userId
  } = req.body;

  // Basic validation
  if (!title || !description || !address || !city || !state || !pincode || !price || !propertyType || !userId) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['title', 'description', 'address', 'city', 'state', 'pincode', 'price', 'propertyType', 'userId']
    });
  }

  try {
    const property = await prisma.property.create({
      data: {
        title,
        description,
        address,
        city,
        state,
        pincode,
        price: parseFloat(price),
        propertyType: propertyType as PropertyType,
        phone: phone || null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        area: area ? parseFloat(area) : null,
        areaUnit: areaUnit || null,
        forType: forType || 'SALE', // Default to 'SALE'
        userId
      }
    });

    res.status(201).json({ 
      success: true,
      message: 'Property listed successfully',
      data: property 
    });
  } catch (error) {
    console.error('[ADD PROPERTY ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to add property',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/properties/search
 * Search properties with filters
 */
export const searchProperties = async (req: Request, res: Response) => {
  const {
    city,
    state,
    pincode,
    forType,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    areaUnit,
    page = '1',
    limit = '10'
  } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Create proper Prisma where input
    const whereConditions: Prisma.PropertyWhereInput = {
      ...(city && { 
        city: { 
          contains: city as string, 
          mode: 'insensitive' 
        } 
      }),
      ...(state && { 
        state: { 
          contains: state as string, 
          mode: 'insensitive' 
        } 
      }),
      ...(pincode && { pincode: { equals: pincode as string } }),
      ...(forType && { forType: { equals: forType as string } }),
      ...(propertyType && { propertyType: { equals: propertyType as PropertyType } }),
      ...(bedrooms && { bedrooms: { equals: parseInt(bedrooms as string) } }),
      ...(areaUnit && { areaUnit: { equals: areaUnit as string } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice as string) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice as string) } }),
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: whereConditions,
        include: { files: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.property.count({ where: whereConditions })
    ]);

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrevious: pageNum > 1
      }
    });
  } catch (error) {
    console.error('[SEARCH PROPERTIES ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to search properties',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/properties
 * Fetch all properties with pagination
 */
export const getAllProperties = async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query;

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        include: { files: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.property.count()
    ]);

    res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrevious: pageNum > 1
      }
    });
  } catch (error) {
    console.error('[GET PROPERTIES ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to fetch properties',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * POST /api/properties/upload-images
 * Upload property images for a specific property
 */
export const uploadImages = [
  upload.array('images', 10),
  async (req: Request, res: Response) => {
    const { propertyId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      // Verify property exists
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        // Clean up uploaded files if property not found
        files.forEach(file => {
          try {
            fs.unlinkSync(path.join('uploads', file.filename));
          } catch (err) {
            console.error('Failed to delete file:', file.filename, err);
          }
        });
        return res.status(404).json({ error: 'Property not found' });
      }

      // Create file records
      const uploadedFiles = await prisma.$transaction(
        files.map(file => 
          prisma.propertyFile.create({
            data: {
              url: `/uploads/${file.filename}`,
              propertyId,
              // Add these to your Prisma schema if needed:
              // fileType: file.mimetype,
              // fileSize: file.size
            }
          })
        )
      );

      res.status(200).json({ 
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles
      });
    } catch (error) {
      console.error('[UPLOAD FILE ERROR]', error);
      
      // Clean up uploaded files if error occurs
      if (files) {
        files.forEach(file => {
          try {
            fs.unlinkSync(path.join('uploads', file.filename));
          } catch (err) {
            console.error('Failed to delete file:', file.filename, err);
          }
        });
      }

      res.status(500).json({ 
        error: 'File upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
];

/**
 * GET /api/properties/:id
 * Get property by ID (with images)
 */
export const getPropertyById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: { 
        files: true,
        // Uncomment if you have user relation in your schema
        // user: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //     phone: true
        //   }
        // }
      },
    });

    if (!property) {
      return res.status(404).json({ 
        error: 'Property not found',
        message: `Property with ID ${id} does not exist`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Property listed successfully',
      data: property
    });
  } catch (error) {
    console.error('[GET PROPERTY BY ID]', error);
    res.status(500).json({ 
      error: 'Failed to fetch property',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Error handling middleware specific for property routes
 */
export const propertyErrorHandler = (err: Error, _req: Request, res: Response, _next: Function) => {
  console.error('Property route error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
      code: err.code
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'Something went wrong'
  });
};