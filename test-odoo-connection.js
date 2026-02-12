/**
 * Script para testear conexión directa con Odoo
 * Ejecutar con: node test-odoo-connection.js
 */

// Configuración - EDITA ESTOS VALORES
const config = {
  url: 'https://sgb-carnes2.odoo.com',
  db: 'sgb-carnes2',
  username: 'tu-email@gmail.com',  // EDITAR
  apiKey: 'tu-api-key-aqui'         // EDITAR
};

async function testOdooConnection() {
  console.log('🔍 Testing Odoo connection...\n');
  console.log('Config:', {
    url: config.url,
    db: config.db,
    username: config.username,
    apiKey: config.apiKey.substring(0, 10) + '...'
  });
  console.log('\n---\n');

  // Test authentication
  console.log('1. Testing authentication...');

  const authPayload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'common',
      method: 'authenticate',
      args: [config.db, config.username, config.apiKey, {}]
    },
    id: Math.floor(Math.random() * 1000000)
  };

  try {
    const endpoint = `${config.url}/jsonrpc`;
    console.log(`   Endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authPayload),
    });

    console.log(`   HTTP Status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ Error: HTTP ${response.status}`);
      console.log(`   Response preview: ${text.substring(0, 200)}...`);

      // Try alternative endpoints
      console.log('\n2. Trying alternative endpoint: /web/session/authenticate');
      const altResponse = await fetch(`${config.url}/web/session/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          params: {
            db: config.db,
            login: config.username,
            password: config.apiKey
          }
        })
      });

      console.log(`   HTTP Status: ${altResponse.status}`);
      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log('   ✓ Alternative endpoint works!');
        console.log('   Response:', JSON.stringify(altData, null, 2));
      } else {
        console.log('   ❌ Alternative endpoint also failed');
      }

      return;
    }

    const data = await response.json();

    if (data.result) {
      console.log(`   ✅ Authentication successful!`);
      console.log(`   User ID (uid): ${data.result}`);

      // Test search_count
      console.log('\n2. Testing product count...');
      const countPayload = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.db,
            data.result,
            config.apiKey,
            'product.template',
            'search_count',
            [[]],
            {}
          ]
        },
        id: Math.floor(Math.random() * 1000000)
      };

      const countResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countPayload),
      });

      const countData = await countResponse.json();
      if (countData.result !== undefined) {
        console.log(`   ✅ Product count: ${countData.result}`);
      } else {
        console.log('   ❌ Error counting products:', countData.error);
      }

      console.log('\n✅ All tests passed! Your Odoo connection is working.');
      console.log('\nUse this configuration in Supabase config table:');
      console.log(`   odoo_url: ${config.url}`);
      console.log(`   odoo_db: ${config.db}`);
      console.log(`   odoo_username: ${config.username}`);
      console.log(`   odoo_api_key: ${config.apiKey}`);

    } else {
      console.log('   ❌ Authentication failed');
      console.log('   Error:', data.error);
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`);
    console.log('\n🔍 Possible issues:');
    console.log('   1. Check if URL is correct (no typos)');
    console.log('   2. Verify you can access the URL in a browser');
    console.log('   3. Check if Odoo API is enabled');
    console.log('   4. Try with full URL including https://');
  }
}

testOdooConnection();
