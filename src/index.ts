import express from 'express';
import compression from 'compression';
import cors from 'cors';
import * as bodyParser from 'body-parser';

import probe from 'node-ffprobe';

const app: express.Application = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

app.get('/video/:video', async (req: express.Request, res: express.Response) => {
  const video = decodeURIComponent(req.params.video);
  console.log('Probing ' + video + '...');

  try {
    const data = await probe(video);
    res.send(data);
  } catch (err) {
    res.send(err);
  }
});

app.listen(5000, () => {
  console.log('Video service is online');
});