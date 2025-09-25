const axios = require('axios');

async function testUpload() {
  try {
    console.log('📤 Upload testi başlatılıyor...');
    
    // Mock file data
    const fileData = Buffer.from('fake audio data for testing');
    const formData = new FormData();
    formData.append('file', new Blob([fileData], { type: 'audio/mpeg' }), 'test.mp3');
    
    const response = await axios.post('http://localhost:3000/api/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer fake-token' // Mock auth
      }
    });
    
    console.log('✅ Upload başarılı:', response.data);
    
  } catch (error) {
    console.log('❌ Upload hatası (beklenen):', error.response?.data || error.message);
  }
}

testUpload();
