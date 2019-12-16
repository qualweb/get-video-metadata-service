import express from 'express';
import compression from 'compression';
import cors from 'cors';
import * as bodyParser from 'body-parser';

import probe from 'node-ffprobe';
import ffmpeg from 'fluent-ffmpeg';

const app: express.Application = express();

app.use(compression());
app.use(cors());
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));

function getVolume(streamUrl: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg(streamUrl)
        .withAudioFilter('volumedetect')
        .addOption('-f', 'null')
        //.addOption('-t', '10') // duration
        .noVideo()
        .on('error', function() {
          resolve({ audioTrack: false, meanVolume: null, maxVolume: null });
        })
        .on('end', function(stdout, stderr){
        
          // if the stream is not available
          if(stderr.match(/Server returned 404 Not Found/)){
            resolve({ audioTrack: false, meanVolume: null, maxVolume: null });
          }
          
          // find the mean_volume and max_volume in the output
          const meanVolumeRegex = stderr.match(/mean_volume:\s(-?[0-9]\d*(\.\d+)?)/);
          const maxVolumeRegex = stderr.match(/max_volume:\s(-?[0-9]\d*(\.\d+)?)/);

          // return the mean and max volume
          if(meanVolumeRegex && maxVolumeRegex){
            const meanVolume = parseFloat(meanVolumeRegex[1]);
            const maxVolume = parseFloat(maxVolumeRegex[1]);
            resolve({ audioTrack: true, meanVolume, maxVolume });
          } else {
            resolve({ audioTrack: false, meanVolume: null, maxVolume: null });
          }
      })
      .saveToFile('/dev/null');
    } catch (err) {
      resolve({ audioTrack: false, meanVolume: null, maxVolume: null });
    }
  });
}

app.get('/video/:video', async (req: express.Request, res: express.Response) => {
  const video = decodeURIComponent(req.params.video);
  console.log('Probing ' + video + '...');

  try {
    const metadata = await probe(video);
    const audio = await getVolume(video);
    res.send({ metadata, audio });
  } catch (err) {
    res.send(err);
  }
});

app.listen(5000, () => {
  console.log('Video service is online');
});