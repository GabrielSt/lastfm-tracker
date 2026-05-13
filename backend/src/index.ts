import express from 'express';
import cors from 'cors';
import configRouter from './routes/config';
import dataRouter from './routes/data';
import syncRouter from './routes/sync';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/config', configRouter);
app.use('/data', dataRouter);
app.use('/sync', syncRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`\n🎵 Last.fm Tracker Backend rodando em http://localhost:${PORT}\n`);
});
