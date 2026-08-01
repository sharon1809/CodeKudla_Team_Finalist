import express from 'express';
import Drug from '../models/Drug.js';
import drugService from '../services/DrugService.js';

const router = express.Router();

// Get all drugs
router.get('/', async (req, res) => {
  try {
    const drugs = await Drug.find();
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drug by name
router.get('/:name', async (req, res) => {
  try {
    const drug = await drugService.getOrCreateDrug(req.params.name);
    res.json(drug);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Create or update drug
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const drug = await drugService.getOrCreateDrug(name);
    res.json(drug);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
