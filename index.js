import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import entrepriseRoutes from './routes/entrepriseRoutes.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/entreprises', entrepriseRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
