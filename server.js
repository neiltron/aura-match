import express from 'express';
import fs from 'fs';
import path, { dirname } from 'path';
import cors from 'cors';
import similarity from 'compute-cosine-similarity';
import pkg from 'node-gzip';
const { ungzip } = pkg;

const PORT = 3005;

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('./dist'));

let existingDescriptors = [];
ungzip(fs.readFileSync('data/embeddings.json.gz')).then((data) => {
	existingDescriptors = JSON.parse(data);
	console.log(existingDescriptors.length);

	existingDescriptors = existingDescriptors.map((item) => {
		item.descriptor = Object.keys(item.descriptor).map((key) => item.descriptor[key]);

		return item;
	});
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

app.use('*', async (req, res) => {

	const template = fs.readFileSync(
		'./dist/index.html',
		'utf-8'
	);

	res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
});

app.listen(PORT, () => {
	console.log(`Listening on http://localhost:${PORT}`);
});