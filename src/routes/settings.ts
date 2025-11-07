import express from 'express';
import * as settingsController from '../controllers/settingsController';
import { protect, authorize } from '../middlewares/auth';

const router = express.Router();

// Rotas públicas
router.get('/public', settingsController.getPublicSettings);

// Rotas protegidas (apenas admin)
router.get('/', protect, authorize('admin'), settingsController.getSettings);
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

export default router;
