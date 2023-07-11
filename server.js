import express from 'express';
import multer from "multer";
import '@tensorflow/tfjs-node';
// import faceapi from '@vladmandic/face-api'
import * as canvas from 'canvas';
import fs from 'fs';
import cors from 'cors';
import similarity from 'compute-cosine-similarity';

const { Canvas, Image, ImageData } = canvas;
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Express app setup
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'))


// Multer setup
const upload = multer({ dest: 'uploads/' });

let existingDescriptors = JSON.parse(fs.readFileSync('public/embeddings.json', 'utf8'));
existingDescriptors = existingDescriptors.map((item) => {
    item.descriptor = Object.keys(item.descriptor).map((key) => item.descriptor[key]);

    return item;
});


// create an express route that returns a json with all the descriptors
app.post('/api/text', async (req, res) => {
    // get the `embedding` data from the request
    const embedding = req.body;
    const distances = [];

    // loop through existingDataset and compare the descriptor distance
    for (let existingDescriptor of existingDescriptors) {
        const dist = similarity(existingDescriptor.descriptor, embedding);

        // console.log(existingDescriptor.descriptor.length, embedding.length)

        if (dist < .9) {
            distances.push({
                name: existingDescriptor.file,
                distance: dist,
            });
        }
        console.log('Distance between ' + existingDescriptor.file + ' and upload is ' + dist);
    }
    
    // sort distances by lowest distance
    distances.sort((a, b) => {
        return b.distance - a.distance;
    });

    res.json({ msg: "Embed processed successfully", distances: distances.splice(0, 8) })
});

// Post API to receive an image file
app.post('/api/image', upload.single('image'), async (req, res) => {
    const filePath = req.file.path;

    const img1 = await canvas.loadImage(filePath);
    const detections = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
    if (!detections || detections.detection.score < .5) {
        console.log("No faces detected or low score.");
        return res.status(400).send({msg: "No faces detected or low score."});
    }

    const node = {
        descriptor: detections.descriptor.map((key) => Math.floor(key * 6) / 6),
        name: req.file.originalname,
    }

    const distances = [];

    // loop through existingDataset and compare the descriptor distance
    for (let existingDescriptor of existingDescriptors) {
        const distance = faceapi.euclideanDistance(existingDescriptor.descriptor, node.descriptor);

        if (distance < .9) {
            distances.push({
                name: existingDescriptor.name,
                distance: distance,
            });
        }
        // console.log('Distance between ' + existingDescriptor.name + ' and ' + node.name + ' is ' + distance);
    }

    
    // sort distances by lowest distance
    distances.sort((a, b) => {
        return a.distance - b.distance;
    });
    
    console.log(distances)

    res.json({ msg: "Image processed successfully", distances: distances.splice(0, 8) })
});

const port = process.env.PORT || 3005;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});