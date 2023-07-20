import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
const { ImageEmbedder, FilesetResolver } = vision;
import ids from './files.json'

let els = [];
let rotationTimeout;
let rotationActive = true;
let imgIndex;
let imageEmbedder;
let imgs = [];
let imgsLoaded = 0;
let imgsTotal = 0;

for (let i = 0; i < 8; i += 1) {
    const img = new Image();
    imgs.push(img);
}

const loadModels = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    imageEmbedder = await ImageEmbedder.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite"
            },
        }
    );

    const container = document.querySelector('#canvasDiv');
    for (let i = 0; i < 8; i += 1) {
        const div = document.createElement('div');
        container.appendChild(div);
        els.push(div);
    }

    imgIndex = Math.floor(Math.random() * ids.length);
    processImage(ids[imgIndex]);

    queueTimeout();
};

const processImage = (id) => {
    const el = document.querySelector('#canvasDiv');
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = `https://auramatch.s3.amazonaws.com/${id}`;

    els[0].style.backgroundImage = `url(https://d3jgrypb35yrid.cloudfront.net/${id})`;
    
    image.onload = async () => {
        els[0].className = 'active';

        const imageEmbedderResult = imageEmbedder.embed(image);
        const embedding = imageEmbedderResult.embeddings[0];
        imgsLoaded = 0;
        imgsTotal = 0;

        const response = await fetch('/api/text/', {
            method: 'post',
            mode: 'cors',
            body: JSON.stringify(embedding.floatEmbedding),
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
        })

        let distances;

        try {
            const resp = await response.json();
            const { distances } = resp;
            imgsTotal = 7 < distances.length ? 7 : distances.length;

            distances.slice(0, imgsTotal).forEach((distance, i) => {
                els[i + 1].style.backgroundImage = `url(https://d3jgrypb35yrid.cloudfront.net/${distance.name})`;
                
                setTimeout(() => {
                    imgs[i].src = `https://d3jgrypb35yrid.cloudfront.net/${distance.name}`;
                    imgs[i].onload = () => {        
                        els[i + 1].className = 'active';
                        imgsLoaded += 1;

                        if (imgsLoaded >= imgsTotal && rotationActive) {
                            queueTimeout();
                        }
                    }
                }, 40 * i);
            })
        } catch (e) {
            console.log(e);
        }
    }
};

const queueTimeout = () => {
    console.log('queueTimeout');
    clearTimeout(rotationTimeout);
    rotationTimeout = setTimeout(() => {
        els.forEach((el, i) => {
            setTimeout(() => {
                el.className = '';
            }, 10 * i);
        });

        setTimeout(() => {
            // imgIndex = (imgIndex + 1) % (ids.length - 1);
            imgIndex = Math.floor(Math.random() * ids.length);
            processImage(ids[imgIndex]);
        }, 250);
    }, 6000);
};

const stopTimeout = () => {
    clearTimeout(rotationTimeout);
};

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        queueTimeout();
    } else {
        stopTimeout();
    }
});

loadModels();

document.querySelector('#que-es').addEventListener('click', () => {
    rotationActive = false;

    document.querySelector('#dialog').className = 'open';
    document.body.className = 'dialog-open';
    stopTimeout();
});

document.querySelector('#okay').addEventListener('click', () => {
    rotationActive = true;

    document.querySelector('#dialog').className = '';
    document.body.className = '';
    queueTimeout();
});

document.querySelector('#close-modal').addEventListener('click', () => {
    rotationActive = true;

    document.querySelector('#dialog').className = '';
    document.body.className = '';
    queueTimeout();
});