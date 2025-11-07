// Debug detalhado do PIX Code

const pixGerado = '00020101021126650014BR.GOV.BCB.PIX0124silasandrade94@gmail.com0215Pagamento de 15520400005303986540515.005802BR5911PNEUS STORE6009SAO PAULO62210517ORD-17623881188316304685E';

console.log('=== DEBUG PIX CODE ===\n');
console.log('Código completo:', pixGerado);
console.log('Tamanho:', pixGerado.length, 'caracteres\n');

function parseTags(pix) {
  const tags = [];
  let pos = 0;
  
  while (pos < pix.length - 4) {
    const id = pix.substring(pos, pos + 2);
    const len = parseInt(pix.substring(pos + 2, pos + 4));
    const value = pix.substring(pos + 4, pos + 4 + len);
    
    tags.push({ id, len, value, pos });
    
    console.log(`Pos ${pos.toString().padStart(3)}: Tag ${id} Len ${len.toString().padStart(2)} = "${value}"`);
    
    pos += 4 + len;
  }
  
  const crc = pix.substring(pix.length - 4);
  console.log(`Pos ${pos.toString().padStart(3)}: Tag 63 Len 04 = "${crc}" (CRC)\n`);
  
  return tags;
}

const tags = parseTags(pixGerado);

// Validar CRC
const crc16 = require('crc').crc16ccitt;
const payloadSemCRC = pixGerado.substring(0, pixGerado.length - 4);
const crcCalculado = crc16(payloadSemCRC).toString(16).toUpperCase().padStart(4, '0');
const crcRecebido = pixGerado.substring(pixGerado.length - 4);

console.log('=== VALIDAÇÃO CRC ===');
console.log('CRC Calculado:', crcCalculado);
console.log('CRC Recebido: ', crcRecebido);
console.log('CRC Válido:   ', crcCalculado === crcRecebido ? '✅ SIM' : '❌ NÃO\n');

// Buscar tag 54 (valor)
const tag54 = tags.find(t => t.id === '54');
if (tag54) {
  console.log('=== TAG 54 (VALOR) ===');
  console.log('Conteúdo:', tag54.value);
  console.log('Tamanho declarado:', tag54.len);
  console.log('Tamanho real:', tag54.value.length);
  
  // Verificar formato
  const valorNum = parseFloat(tag54.value);
  console.log('Valor numérico:', valorNum);
  console.log('Formato válido:', /^\d+\.\d{2}$/.test(tag54.value) ? '✅' : '❌');
  
  // Verificar se tem .00
  if (tag54.value.endsWith('.00')) {
    console.log('⚠️  PROBLEMA: Valor termina com .00 - alguns bancos rejeitam isso!');
    console.log('   Deveria ser:', tag54.value.replace(/\.00$/, ''));
  }
}

console.log('\n=== TAGS ESPERADAS ===');
const esperadas = {
  '00': 'Versão (01)',
  '01': 'Point of Initiation (11=dinâmico, 12=estático)',
  '26': 'Merchant Account Info',
  '52': 'Merchant Category Code',
  '53': 'Currency (986=BRL)',
  '54': 'Transaction Amount',
  '58': 'Country Code (BR)',
  '59': 'Merchant Name',
  '60': 'Merchant City',
  '62': 'Additional Data',
  '63': 'CRC'
};

const tagsPresentes = tags.map(t => t.id);
console.log('Tags presentes:', tagsPresentes.join(', '));

Object.keys(esperadas).forEach(id => {
  const presente = tagsPresentes.includes(id);
  console.log(`Tag ${id}: ${presente ? '✅' : '❌'} ${esperadas[id]}`);
});
