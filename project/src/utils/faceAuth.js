import * as faceapi from 'face-api.js'

export const loadModels = async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
}

export const getFaceDescriptor = async (videoEl) => {
    const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()
    return detection ? detection.descriptor : null
}

export const saveDescriptor = (email, descriptor) => {
    localStorage.setItem(`face_${email}`, JSON.stringify(Array.from(descriptor)))
}

export const loadDescriptor = (email) => {
    const stored = localStorage.getItem(`face_${email}`)
    return stored ? new Float32Array(JSON.parse(stored)) : null
}

export const matchFace = (d1, d2) => {
    return faceapi.euclideanDistance(d1, d2) < 0.5
}