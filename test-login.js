const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Login testi başlatılıyor...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'testuser@example.com',
      password: 'TestPass123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login başarılı:', response.data);
    
  } catch (error) {
    console.log('❌ Login hatası:', error.response?.data || error.message);
  }
}

testLogin();
