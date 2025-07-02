import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const analyzeEmotion = async (audioFile) => {
  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    const response = await axios.post(`${API_URL}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.emotion;
  } catch (error) {
    console.error('Error analyzing emotion:', error);
    throw error;
  }
};
