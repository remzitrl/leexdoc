const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔐 Test kullanıcısı oluşturuluyor...');
    
    // Hash password
    const hashedPassword = await argon2.hash('TestPass123!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        passwordHash: hashedPassword,
        displayName: 'Test User',
      },
    });
    
    console.log('✅ Kullanıcı oluşturuldu:', {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });
    
    // Create user settings
    await prisma.userSetting.create({
      data: {
        userId: user.id,
        theme: 'dark',
        language: 'en',
        autoplay: true,
        defaultQuality: 'q320',
        downloadOverWifiOnly: false,
      },
    });
    
    console.log('✅ Kullanıcı ayarları oluşturuldu');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️ Kullanıcı zaten mevcut');
    } else {
      console.error('❌ Hata:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
