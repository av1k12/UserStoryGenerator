// Using built-in fetch in Node.js

async function testAPI() {
  try {
    console.log('Testing API...');
    
    const response = await fetch('https://safescript-cj0orfgd7-avaneesh-kondas-projects.vercel.app/api/generate-story', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: 'As a customer, I want to reset my password so I can access my account',
        teamConfig: {
          teamName: 'Test Team',
          mission: 'Test Mission',
          projectDescription: 'Test Project',
          userStoryTemplate: 'As a [role], I want to [feature/functionality] so that [benefit/value]',
          teamRoles: 'Customer, Admin'
        }
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI(); 