import * as faceapi from 'face-api.js';

export async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
}

export async function getFaceDescriptor(imageBuffer) {
    const img = await faceapi.bufferToImage(imageBuffer);
    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (!detections) {
        throw new Error('No face detected');
    }
    return detections.descriptor;
}
