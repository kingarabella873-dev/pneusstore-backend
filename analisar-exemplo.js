// Analisar código PIX que você disse ser "correto"
const pixExemplo = '00020126680014BR.GOV.BCB.PIX0124silasandrade94@gmail.com0218Pagamento de 489.95204000053039865406489.905802BR5911PNEUS STORE6009SAO PAULO62210517ORD-176238124105263047846';

console.log('=== ANÁLISE DO CÓDIGO PIX DE EXEMPLO ===\n');
console.log('Código:', pixExemplo);
console.log('Tamanho:', pixExemplo.length, 'caracteres\n');

let pos = 0;
while (pos < pixExemplo.length - 4) {
  const id = pixExemplo.substring(pos, pos + 2);
  const len = parseInt(pixExemplo.substring(pos + 2, pos + 4));
  const value = pixExemplo.substring(pos + 4, pos + 4 + len);
  
  const nomes = {
    '00': 'Versão',
    '01': 'Point of Initiation',
    '26': 'Merchant Account',
    '52': 'MCC',
    '53': 'Moeda',
    '54': 'Valor',
    '58': 'País',
    '59': 'Nome',
    '60': 'Cidade',
    '62': 'Dados Adicionais'
  };
  
  const nome = nomes[id] || `Tag ${id}`;
  console.log(`${nome.padEnd(25)}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  
  pos += 4 + len;
}

const crc = pixExemplo.substring(pixExemplo.length - 4);
console.log(`CRC                      : ${crc}`);

console.log('\n❌ PROBLEMAS IDENTIFICADOS:');
console.log('1. NÃO TEM tag 01 (Point of Initiation Method) - OBRIGATÓRIA!');
console.log('2. Valor está como 489.90 (com centavos) - alguns bancos rejeitam .00/.90');
console.log('3. Nome "PNEUS STORE" pode não corresponder ao cadastro da chave');

console.log('\n⚠️  Este código provavelmente NÃO funciona no banco!');
console.log('   Foi gerado pela versão ANTIGA do sistema (sem correções).');
