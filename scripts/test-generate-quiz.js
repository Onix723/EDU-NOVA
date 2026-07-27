const fetch = global.fetch || require('node-fetch');

(async () => {
  try {
    const response = await fetch('http://localhost:8787/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'generate-quiz',
        courseTitle: 'Matemáticas básicas',
        topics: [
          {
            id: '00000000-0000-0000-0000-000000000000',
            title: 'Álgebra',
            description: 'Operaciones con expresiones',
          },
        ],
      }),
    });

    const text = await response.text();
    console.log('STATUS', response.status);
    console.log('BODY', text);
  } catch (error) {
    console.error('ERROR', error);
  }
})();
