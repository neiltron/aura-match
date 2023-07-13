import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
const { ImageEmbedder, FilesetResolver } = vision;
import ids from './files.json'

let nodes = [];

const loadModels = async () => {
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    const imageEmbedder = await ImageEmbedder.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite"
            },
        }
    );

    let els = [];

    const processImage = (id) => {
        const el = document.querySelector('#canvasDiv');
        const image = new Image();
        image.src = `/photos/5k-compressed/5k-compressed/${id}`;

        els[0].style.backgroundImage = `url(/photos/5k-compressed/5k-compressed/${id})`;
        
        image.onload = async () => {
            els[0].className = 'active';

            const imageEmbedderResult = imageEmbedder.embed(image);
            const embedding = imageEmbedderResult.embeddings[0]

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

                distances.slice(0, 7).forEach((distance, i) => {
                els[i + 1].style.backgroundImage = `url(/photos/5k-compressed/5k-compressed/${distance.name})`;

                setTimeout(() => {
                    els[i + 1].className = 'active';
                }, 40 * i);
            })
            } catch (e) {
                console.log(e);
            }
        }
    };

    const container = document.querySelector('#canvasDiv');
    for (let i = 0; i < 8; i += 1) {
        const div = document.createElement('div');
        container.appendChild(div);
        els.push(div);
    }

    let imgIndex = Math.floor(Math.random() * ids.length);
    processImage(ids[imgIndex]);

    setInterval(() => {
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
    }, 6000)
};

loadModels();

document.querySelector('#que-es').addEventListener('click', () => {
    document.querySelector('dialog')['showModal']();
});

document.querySelector('#close-modal').addEventListener('click', () => {
    document.querySelector('dialog')['close']();
});