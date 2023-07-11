import fs from 'fs';

// import all files from the photos directory and loop through them
async function start() {
    let index = 0;
    let images = [];

    fs.readdir('public/photos/5k-compressed/5k-compressed', (err, files) => {
        for (let file of files) {
            // console.log(file);
            images.push(file);
            index += 1;

            console.log(index, file);
        }

        fs.writeFileSync('files.json', JSON.stringify(images));
    });
}

start();