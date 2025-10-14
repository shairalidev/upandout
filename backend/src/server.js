import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({ message: 'UP&OUT Backend is running at Port ${PORT}'})
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));