import * as faceapi from 'face-api.js';
import { loadModels, getFaceDescriptor } from '../../utils/faceUtils';
import { getUsersFromDatabase } from '../../utils/databaseUtils'; // Assume this function fetches users from your database

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { faceDescriptor } = req.body;

    if (!faceDescriptor) {
        return res.status(400).json({ message: 'Face descriptor is required' });
    }

    await loadModels();

    const user = await findUserByFaceDescriptor(faceDescriptor);

    if (user) {
        return res.status(200).json({ message: 'Sign-in successful', user });
    } else {
        return res.status(401).json({ message: 'Face not recognized' });
    }
}

async function findUserByFaceDescriptor(faceDescriptor) {
    const users = await getUsersFromDatabase(); // Fetch users from your database

    for (const user of users) {
        const storedDescriptor = new Float32Array(user.faceDescriptor);
        const distance = faceapi.euclideanDistance(faceDescriptor, storedDescriptor);
        if (distance < 0.6) { // Adjust the threshold as needed
            return user;
        }
    }

    return null;
}
