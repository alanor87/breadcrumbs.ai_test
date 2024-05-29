const refs = {
    input: document.querySelector('#fileInput'),
    output :document.querySelector('.output'),
    progress: document.querySelector('#progress'),
    result: document.querySelector('#result'),
}
const reader = new FileReader();

const worker = new Worker('worker.js');
worker.onmessage = (e)=> {
    const {type, data} = e.data;
    switch (type) {
        case 'progress' : {
            refs.progress.innerText += data.toLowerCase() + ' ...' + '\n';
            refs.progress.scrollTop = refs.progress.scrollHeight;
            break;
        }
        case 'result' : {
            refs.result.innerText = 'The points indexes in the original list are : ' + data;
            refs.progress.style = '';
            break;
        }
        case 'error' : {
            refs.progress.innerText = 'Error : ' + data;
            refs.progress.style = '';
            break;
        }
    }
}


refs.input.addEventListener('change', (e) => {
    reader.readAsText(e.target.files[0]);
    reader.addEventListener("load", onFileLoad);
    refs.progress.style = 'background-image: url("tetrahedron-transparent.gif");'
})

function onFileLoad() {
    worker.postMessage(reader.result);
}
