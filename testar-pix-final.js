// Teste completo do PIX corrigido
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function testarPix() {
  console.log('=== TESTE PIX CORRIGIDO ===\n');
  
  // Gerar PIX
  const cmd = `curl -s -X POST http://localhost:5001/api/payments/pix/create -H "Content-Type: application/json" -d '{"amount":100,"orderId":"TESTE-FINAL","customerName":"Cliente Teste","customerEmail":"cliente@teste.com","customerPhone":"11999999999","shippingAddress":{"street":"Rua Teste","number":"123","city":"São Paulo","state":"SP","zipCode":"01000-000"}}'`;
  
  const { stdout } = await execPromise(cmd);
  const response = JSON.parse(stdout);
  
  if (!response.success) {
    console.error('❌ Erro ao gerar PIX:', response);
    return;
  }
  
  const pixCode = response.data.pixCode;
  console.log('✅ PIX gerado com sucesso!\n');
  console.log('Código PIX:', pixCode);
  console.log('Tamanho:', pixCode.length, 'caracteres\n');
  
  // Parse do código
  console.log('=== ESTRUTURA DO CÓDIGO ===\n');
  
  let pos = 0;
  const tags = {};
  
  while (pos < pixCode.length - 4) {
    const id = pixCode.substring(pos, pos + 2);
    const len = parseInt(pixCode.substring(pos + 2, pos + 4));
    const value = pixCode.substring(pos + 4, pos + 4 + len);
    
    tags[id] = value;
    
    const nomes = {
      '00': 'Versão',
      '01': 'Point of Initiation',
      '26': 'Merchant Account',
      '52': 'MCC',
      '53': 'Moeda',
      '54': 'Valor',
      '58': 'País',
      '59': 'Nome Comerciante',
      '60': 'Cidade',
      '62': 'Dados Adicionais',
      '63': 'CRC'
    };
    
    const nome = nomes[id] || 'Desconhecido';
    const valorExibir = value.length > 40 ? value.substring(0, 40) + '...' : value;
    
    console.log(`Tag ${id} (${nome.padEnd(20)}): ${valorExibir}`);
    
    pos += 4 + len;
  }
  
  const crc = pixCode.substring(pixCode.length - 4);
  console.log(`Tag 63 (CRC                 ): ${crc}`);
  
  // Validações
  console.log('\n=== VALIDAÇÕES ===\n');
  
  const checks = [
    { test: () => tags['00'] === '01', msg: 'Versão 01' },
    { test: () => tags['01'] === '11', msg: 'Point of Initiation (11 = Dinâmico)' },
    { test: () => tags['26']?.includes('BR.GOV.BCB.PIX'), msg: 'Merchant Account válido' },
    { test: () => tags['52'] === '0000', msg: 'MCC presente' },
    { test: () => tags['53'] === '986', msg: 'Moeda BRL (986)' },
    { test: () => tags['54'] && !tags['54'].endsWith('.00'), msg: 'Valor SEM .00' },
    { test: () => tags['54'] && /^\d+(\.\d{1,2})?$/.test(tags['54']), msg: 'Formato de valor válido' },
    { test: () => tags['58'] === 'BR', msg: 'País BR' },
    { test: () => tags['59']?.length > 0, msg: 'Nome do comerciante presente' },
    { test: () => tags['60']?.length > 0, msg: 'Cidade presente' },
    { test: () => tags['62']?.length > 0, msg: 'Dados adicionais presentes' },
  ];
  
  let todosOk = true;
  checks.forEach(check => {
    const ok = check.test();
    console.log(`${ok ? '✅' : '❌'} ${check.msg}`);
    if (!ok) todosOk = false;
  });
  
  // Validar CRC
  const crc16 = require('crc').crc16ccitt;
  const payloadSemCRC = pixCode.substring(0, pixCode.length - 4);
  const crcCalculado = crc16(payloadSemCRC).toString(16).toUpperCase().padStart(4, '0');
  const crcValido = crcCalculado === crc;
  
  console.log(`${crcValido ? '✅' : '❌'} CRC válido (${crc})`);
  
  if (!crcValido) {
    console.log(`   Esperado: ${crcCalculado}`);
    console.log(`   Recebido: ${crc}`);
    todosOk = false;
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  if (todosOk && crcValido) {
    console.log('✅ CÓDIGO PIX VÁLIDO E PRONTO PARA USO!');
    console.log('='.repeat(50));
    console.log('\n📱 Você pode escanear este QR Code no app do banco.');
    console.log('\n⚠️  Se ainda der erro "não válido", o problema é:');
    console.log('   - Nome "PNEUS STORE" não está cadastrado na chave');
    console.log('   - Verifique o nome exato em silasandrade94@gmail.com');
  } else {
    console.log('❌ CÓDIGO PIX TEM PROBLEMAS!');
    console.log('='.repeat(50));
  }
  
  console.log('\nValor a ser pago: R$', tags['54']);
  console.log('Nome: ', tags['59']);
  console.log('Cidade:', tags['60']);
}

testarPix().catch(console.error);
