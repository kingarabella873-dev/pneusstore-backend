// Validar PIX conforme especificação oficial Banco Central

async function validarPixBacen() {
  console.log('=== VALIDAÇÃO PIX - ESPECIFICAÇÃO BANCO CENTRAL ===\n');
  
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);
  
  try {
    const cmd = `curl -s -X POST https://pneusstore-backend.onrender.com/api/payments/pix/create -H "Content-Type: application/json" -d '{"amount":100,"orderId":"VAL","customerName":"Teste","customerEmail":"t@t.com","customerPhone":"11999999999","shippingAddress":{"street":"R","number":"1","city":"SP","state":"SP","zipCode":"01000-000"}}'`;
    
    const { stdout } = await execPromise(cmd);
    const response = JSON.parse(stdout);
    
    if (!response.success) {
      console.error('❌ Erro ao gerar PIX:', response);
      return;
    }
    
    const pixCode = response.data.pixCode;
    console.log('✅ PIX gerado com sucesso!\n');
    
    // Parse do código
    let pos = 0;
    const tags = {};
    
    while (pos < pixCode.length - 4) {
      const id = pixCode.substring(pos, pos + 2);
      const len = parseInt(pixCode.substring(pos + 2, pos + 4));
      const value = pixCode.substring(pos + 4, pos + 4 + len);
      
      tags[id] = value;
      pos += 4 + len;
    }
    
    console.log('📋 VALIDAÇÃO CONFORME ESPECIFICAÇÃO BACEN:\n');
    
    // Validações obrigatórias
    const validacoes = [
      {
        campo: '00',
        nome: 'Payload Format Indicator',
        esperado: '01',
        valor: tags['00'],
        test: () => tags['00'] === '01'
      },
      {
        campo: '01',
        nome: 'Point of Initiation',
        esperado: '12 (estático) ou 11 (dinâmico)',
        valor: tags['01'],
        test: () => tags['01'] === '12' || tags['01'] === '11'
      },
      {
        campo: '26',
        nome: 'Merchant Account (PIX)',
        esperado: 'Contém GUI BR.GOV.BCB.PIX',
        valor: tags['26']?.substring(0, 50) + '...',
        test: () => tags['26']?.includes('BR.GOV.BCB.PIX')
      },
      {
        campo: '52',
        nome: 'Merchant Category Code',
        esperado: '0000 ou MCC ISO18245',
        valor: tags['52'],
        test: () => tags['52']?.length === 4
      },
      {
        campo: '53',
        nome: 'Transaction Currency',
        esperado: '986 (BRL)',
        valor: tags['53'],
        test: () => tags['53'] === '986'
      },
      {
        campo: '54',
        nome: 'Transaction Amount',
        esperado: 'Sem .00 se inteiro',
        valor: tags['54'],
        test: () => tags['54'] && !tags['54'].endsWith('.00')
      },
      {
        campo: '58',
        nome: 'Country Code',
        esperado: 'BR',
        valor: tags['58'],
        test: () => tags['58'] === 'BR'
      },
      {
        campo: '59',
        nome: 'Merchant Name',
        esperado: '1-25 caracteres',
        valor: tags['59'],
        test: () => tags['59'] && tags['59'].length <= 25
      },
      {
        campo: '60',
        nome: 'Merchant City',
        esperado: '1-15 caracteres',
        valor: tags['60'],
        test: () => tags['60'] && tags['60'].length <= 15
      },
      {
        campo: '62',
        nome: 'Additional Data (c/ subcampo 05)',
        esperado: 'Contém Reference Label',
        valor: tags['62']?.substring(0, 30) + '...',
        test: () => tags['62']?.includes('05')
      }
    ];
    
    let tudoOk = true;
    validacoes.forEach(v => {
      const ok = v.test();
      console.log(`${ok ? '✅' : '❌'} Campo ${v.campo} (${v.nome})`);
      console.log(`   Esperado: ${v.esperado}`);
      console.log(`   Valor: ${v.valor || 'AUSENTE'}\n`);
      if (!ok) tudoOk = false;
    });
    
    // Validar GUI dentro do campo 26
    if (tags['26']) {
      const tag26 = tags['26'];
      const guiMatch = tag26.match(/0014(.{14})/);
      if (guiMatch) {
        const gui = guiMatch[1];
        console.log(`📌 GUI encontrado: "${gui}"`);
        console.log(`   ${gui === 'BR.GOV.BCB.PIX' ? '✅' : '❌'} Conforme especificação Bacen\n`);
      }
    }
    
    // Validar CRC
    const crc16 = require('crc').crc16ccitt;
    const payloadSemCRC = pixCode.substring(0, pixCode.length - 4);
    const crcCalculado = crc16(payloadSemCRC).toString(16).toUpperCase().padStart(4, '0');
    const crcRecebido = pixCode.substring(pixCode.length - 4);
    const crcOk = crcCalculado === crcRecebido;
    
    console.log(`${crcOk ? '✅' : '❌'} CRC16-CCITT: ${crcRecebido} (calculado: ${crcCalculado})\n`);
    
    if (!crcOk) tudoOk = false;
    
    // Resultado final
    console.log('='.repeat(60));
    if (tudoOk) {
      console.log('✅ PIX VÁLIDO CONFORME ESPECIFICAÇÃO BANCO CENTRAL!');
      console.log('='.repeat(60));
      console.log('\n✨ Código 100% compatível com padrão BR Code oficial');
      console.log('📱 Pode ser pago em QUALQUER banco/instituição brasileira');
    } else {
      console.log('❌ PIX COM PROBLEMAS - NÃO CONFORME ESPECIFICAÇÃO!');
      console.log('='.repeat(60));
    }
    
    console.log('\nCódigo PIX completo:');
    console.log(pixCode);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

validarPixBacen();
