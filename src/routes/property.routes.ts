import express from 'express';
import { addProperty, getAllProperties, uploadImages} from '../controllers/property.controller';
import { searchProperties } from '../controllers/property.controller';
import { PrismaClient } from '@prisma/client';
import { getPropertyById } from '../controllers/property.controller';


const router = express.Router();
const prisma = new PrismaClient();

router.post('/add', addProperty);
router.get('/all', getAllProperties);
router.post('/upload-images', uploadImages);
router.get('/search', searchProperties);
router.get('/:id', getPropertyById); 
// router.get('/:id', async (req, res) => {
//     const { id } = req.params;
  
//     try {
//       const property = await prisma.property.findUnique({
//         where: { id },
//         include: { files: true },
//       });
  
//       if (!property) return res.status(404).json({ error: 'Property not found' });
  
//       res.json(property);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: 'Error fetching property' });
//     }
//   });
  


export default router;
