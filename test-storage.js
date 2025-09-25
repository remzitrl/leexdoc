const { LocalDiskStorage } = require('./src/lib/storage/local-disk-storage.ts');

console.log('Testing LocalDiskStorage...');

const storage = new LocalDiskStorage('/storage');

storage.putObject('test.txt', Buffer.from('test content'), { contentType: 'text/plain' })
  .then(result => {
    console.log('Success:', result);
    return storage.getSignedUrl('test.txt');
  })
  .then(url => {
    console.log('Signed URL:', url);
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
