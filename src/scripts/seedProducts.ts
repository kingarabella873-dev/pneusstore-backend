import mongoose from 'mongoose';
import Product from '../models/Product';
import { config } from '../config/config';

const pneusCarroPasseio = [
  // Goodyear
  { name: 'Pneu Goodyear Efficientgrip Performance', brand: 'Goodyear', modelName: 'Efficientgrip Performance', size: '195/65 R15', price: 289.90, stock: 45, description: 'Pneu com foco em economia de combustível e aderência em pista molhada', images: ['https://cdn.images.goodyear.com.br/efficientgrip-performance.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Goodyear Eagle F1 Asymmetric 5', brand: 'Goodyear', modelName: 'Eagle F1 Asymmetric 5', size: '205/55 R16', price: 549.90, stock: 30, description: 'Alto desempenho com excelente frenagem', images: ['https://cdn.images.goodyear.com.br/eagle-f1.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Goodyear Assurance', brand: 'Goodyear', modelName: 'Assurance', size: '185/60 R15', price: 259.90, stock: 50, description: 'Conforto e durabilidade para uso urbano', images: ['https://cdn.images.goodyear.com.br/assurance.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Goodyear Direction Sport', brand: 'Goodyear', modelName: 'Direction Sport', size: '195/55 R15', price: 269.90, stock: 40, description: 'Ótimo custo-benefício para esportivos', images: ['https://cdn.images.goodyear.com.br/direction-sport.jpg'], season: 'all-season', pattern: 'Direcional' },
  { name: 'Pneu Goodyear EfficientGrip SUV', brand: 'Goodyear', modelName: 'EfficientGrip SUV', size: '225/65 R17', price: 589.90, stock: 25, description: 'Desenvolvido para SUVs com economia', images: ['https://cdn.images.goodyear.com.br/efficientgrip-suv.jpg'], season: 'all-season', pattern: 'Simétrico' },
  
  // Pirelli
  { name: 'Pneu Pirelli P7 Cinturato', brand: 'Pirelli', modelName: 'P7 Cinturato', size: '205/55 R16', price: 459.90, stock: 35, description: 'Baixo ruído e excelente aderência', images: ['https://cdn.images.pirelli.com/p7-cinturato.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Pirelli P4 Cinturato', brand: 'Pirelli', modelName: 'P4 Cinturato', size: '185/65 R15', price: 299.90, stock: 48, description: 'Durabilidade e conforto excepcional', images: ['https://cdn.images.pirelli.com/p4-cinturato.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Pirelli P Zero', brand: 'Pirelli', modelName: 'P Zero', size: '225/45 R17', price: 799.90, stock: 20, description: 'Performance máxima para carros esportivos', images: ['https://cdn.images.pirelli.com/p-zero.jpg'], season: 'verão', pattern: 'Assimétrico' },
  { name: 'Pneu Pirelli Scorpion Verde', brand: 'Pirelli', modelName: 'Scorpion Verde', size: '215/60 R17', price: 549.90, stock: 28, description: 'Ecológico para SUVs e Crossovers', images: ['https://cdn.images.pirelli.com/scorpion-verde.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Pirelli Formula Evo', brand: 'Pirelli', modelName: 'Formula Evo', size: '175/70 R14', price: 249.90, stock: 55, description: 'Custo-benefício ideal para compactos', images: ['https://cdn.images.pirelli.com/formula-evo.jpg'], season: 'all-season', pattern: 'Simétrico' },
  
  // Michelin
  { name: 'Pneu Michelin Primacy 4', brand: 'Michelin', modelName: 'Primacy 4', size: '205/55 R16', price: 589.90, stock: 32, description: 'Segurança do primeiro ao último quilômetro', images: ['https://cdn.images.michelin.com/primacy-4.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Michelin Energy XM2+', brand: 'Michelin', modelName: 'Energy XM2+', size: '185/65 R15', price: 329.90, stock: 45, description: 'Economia e durabilidade estendida', images: ['https://cdn.images.michelin.com/energy-xm2.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Michelin Pilot Sport 4', brand: 'Michelin', modelName: 'Pilot Sport 4', size: '225/45 R17', price: 899.90, stock: 18, description: 'Performance superior em pista', images: ['https://cdn.images.michelin.com/pilot-sport-4.jpg'], season: 'verão', pattern: 'Assimétrico' },
  { name: 'Pneu Michelin Latitude Sport 3', brand: 'Michelin', modelName: 'Latitude Sport 3', size: '235/55 R19', price: 879.90, stock: 22, description: 'Esportividade para SUVs premium', images: ['https://cdn.images.michelin.com/latitude-sport-3.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Michelin Agilis', brand: 'Michelin', modelName: 'Agilis', size: '195/70 R15', price: 459.90, stock: 38, description: 'Robustez para vans e utilitários', images: ['https://cdn.images.michelin.com/agilis.jpg'], season: 'all-season', pattern: 'Simétrico' },
  
  // Continental
  { name: 'Pneu Continental PowerContact 2', brand: 'Continental', modelName: 'PowerContact 2', size: '195/55 R15', price: 319.90, stock: 42, description: 'Aderência superior e economia', images: ['https://cdn.images.continental.com/powercontact-2.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Continental PremiumContact 6', brand: 'Continental', modelName: 'PremiumContact 6', size: '205/55 R16', price: 529.90, stock: 30, description: 'Conforto e segurança premium', images: ['https://cdn.images.continental.com/premiumcontact-6.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Continental ExtremeContact Sport', brand: 'Continental', modelName: 'ExtremeContact Sport', size: '225/45 R17', price: 749.90, stock: 25, description: 'Performance extrema para esportivos', images: ['https://cdn.images.continental.com/extremecontact.jpg'], season: 'verão', pattern: 'Assimétrico' },
  { name: 'Pneu Continental CrossContact AT', brand: 'Continental', modelName: 'CrossContact AT', size: '225/65 R17', price: 679.90, stock: 28, description: 'All-terrain para aventuras', images: ['https://cdn.images.continental.com/crosscontact-at.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Continental ContiEcoContact 5', brand: 'Continental', modelName: 'ContiEcoContact 5', size: '185/60 R15', price: 349.90, stock: 40, description: 'Eficiência energética máxima', images: ['https://cdn.images.continental.com/ecocontact-5.jpg'], season: 'all-season', pattern: 'Simétrico' },
  
  // Bridgestone
  { name: 'Pneu Bridgestone Turanza T005', brand: 'Bridgestone', modelName: 'Turanza T005', size: '205/55 R16', price: 519.90, stock: 35, description: 'Conforto silencioso e seguro', images: ['https://cdn.images.bridgestone.com/turanza-t005.jpg'], season: 'all-season', pattern: 'Assimétrico' },
  { name: 'Pneu Bridgestone Ecopia EP150', brand: 'Bridgestone', modelName: 'Ecopia EP150', size: '185/65 R15', price: 309.90, stock: 48, description: 'Economia de combustível comprovada', images: ['https://cdn.images.bridgestone.com/ecopia-ep150.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Bridgestone Potenza S007A', brand: 'Bridgestone', modelName: 'Potenza S007A', size: '225/45 R17', price: 849.90, stock: 20, description: 'Alta performance para superesportivos', images: ['https://cdn.images.bridgestone.com/potenza-s007a.jpg'], season: 'verão', pattern: 'Assimétrico' },
  { name: 'Pneu Bridgestone Dueler H/T 684', brand: 'Bridgestone', modelName: 'Dueler H/T 684', size: '215/65 R16', price: 489.90, stock: 32, description: 'Versatilidade para SUVs', images: ['https://cdn.images.bridgestone.com/dueler-ht-684.jpg'], season: 'all-season', pattern: 'Simétrico' },
  { name: 'Pneu Bridgestone Turanza ER300', brand: 'Bridgestone', modelName: 'Turanza ER300', size: '195/60 R15', price: 379.90, stock: 38, description: 'Equilíbrio perfeito para sedãs', images: ['https://cdn.images.bridgestone.com/turanza-er300.jpg'], season: 'all-season', pattern: 'Assimétrico' },
];

const pneusCaminhao = [
  // Bridgestone Caminhão
  { name: 'Pneu Bridgestone R192', brand: 'Bridgestone', modelName: 'R192', size: '295/80 R22.5', price: 1899.90, stock: 15, description: 'Alta quilometragem para eixo direcional', images: ['https://cdn.images.bridgestone.com/r192.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Bridgestone R297', brand: 'Bridgestone', modelName: 'R297', size: '11 R22.5', price: 1749.90, stock: 18, description: 'Resistência para eixo de tração', images: ['https://cdn.images.bridgestone.com/r297.jpg'], season: 'all-season', pattern: 'Blocado' },
  { name: 'Pneu Bridgestone R268', brand: 'Bridgestone', modelName: 'R268', size: '275/80 R22.5', price: 1699.90, stock: 20, description: 'Economia para longas distâncias', images: ['https://cdn.images.bridgestone.com/r268.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Bridgestone M840', brand: 'Bridgestone', modelName: 'M840', size: '315/80 R22.5', price: 2199.90, stock: 12, description: 'Tração em terrenos difíceis', images: ['https://cdn.images.bridgestone.com/m840.jpg'], season: 'all-season', pattern: 'Misto' },
  { name: 'Pneu Bridgestone R227', brand: 'Bridgestone', modelName: 'R227', size: '295/80 R22.5', price: 1849.90, stock: 16, description: 'Versatilidade para reboque', images: ['https://cdn.images.bridgestone.com/r227.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  
  // Goodyear Caminhão
  { name: 'Pneu Goodyear KMAX S', brand: 'Goodyear', modelName: 'KMAX S', size: '295/80 R22.5', price: 1829.90, stock: 17, description: 'Máxima quilometragem direcional', images: ['https://cdn.images.goodyear.com.br/kmax-s.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Goodyear KMAX D', brand: 'Goodyear', modelName: 'KMAX D', size: '11 R22.5', price: 1779.90, stock: 19, description: 'Durabilidade para eixo de tração', images: ['https://cdn.images.goodyear.com.br/kmax-d.jpg'], season: 'all-season', pattern: 'Blocado' },
  { name: 'Pneu Goodyear KMAX T', brand: 'Goodyear', modelName: 'KMAX T', size: '275/80 R22.5', price: 1649.90, stock: 22, description: 'Eficiência para reboques', images: ['https://cdn.images.goodyear.com.br/kmax-t.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Goodyear ULTRA GRIP MAX D', brand: 'Goodyear', modelName: 'ULTRA GRIP MAX D', size: '315/80 R22.5', price: 2149.90, stock: 10, description: 'Tração máxima em condições severas', images: ['https://cdn.images.goodyear.com.br/ultragrip-max-d.jpg'], season: 'inverno', pattern: 'Blocado' },
  { name: 'Pneu Goodyear G399 FUEL MAX', brand: 'Goodyear', modelName: 'G399 FUEL MAX', size: '295/80 R22.5', price: 1959.90, stock: 14, description: 'Economia de combustível garantida', images: ['https://cdn.images.goodyear.com.br/g399-fuel-max.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  
  // Michelin Caminhão
  { name: 'Pneu Michelin X Multi Energy Z', brand: 'Michelin', modelName: 'X Multi Energy Z', size: '295/80 R22.5', price: 2099.90, stock: 13, description: 'Eficiência energética superior', images: ['https://cdn.images.michelin.com/x-multi-energy-z.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Michelin X Multi D', brand: 'Michelin', modelName: 'X Multi D', size: '11 R22.5', price: 1899.90, stock: 16, description: 'Versatilidade para múltiplas aplicações', images: ['https://cdn.images.michelin.com/x-multi-d.jpg'], season: 'all-season', pattern: 'Blocado' },
  { name: 'Pneu Michelin X Line Energy Z', brand: 'Michelin', modelName: 'X Line Energy Z', size: '275/80 R22.5', price: 1849.90, stock: 18, description: 'Baixa resistência ao rolamento', images: ['https://cdn.images.michelin.com/x-line-energy-z.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Michelin XZY3', brand: 'Michelin', modelName: 'XZY3', size: '315/80 R22.5', price: 2299.90, stock: 11, description: 'Robustez para trabalho pesado', images: ['https://cdn.images.michelin.com/xzy3.jpg'], season: 'all-season', pattern: 'Misto' },
  { name: 'Pneu Michelin X Multi T', brand: 'Michelin', modelName: 'X Multi T', size: '295/80 R22.5', price: 1949.90, stock: 15, description: 'Otimizado para reboques', images: ['https://cdn.images.michelin.com/x-multi-t.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  
  // Pirelli Caminhão
  { name: 'Pneu Pirelli FR85', brand: 'Pirelli', modelName: 'FR85', size: '295/80 R22.5', price: 1799.90, stock: 17, description: 'Alta performance direcional', images: ['https://cdn.images.pirelli.com/fr85.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Pirelli FG88', brand: 'Pirelli', modelName: 'FG88', size: '11 R22.5', price: 1749.90, stock: 19, description: 'Tração confiável', images: ['https://cdn.images.pirelli.com/fg88.jpg'], season: 'all-season', pattern: 'Blocado' },
  { name: 'Pneu Pirelli FR25', brand: 'Pirelli', modelName: 'FR25', size: '275/80 R22.5', price: 1699.90, stock: 21, description: 'Economia para operações urbanas', images: ['https://cdn.images.pirelli.com/fr25.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Pirelli FG01', brand: 'Pirelli', modelName: 'FG01', size: '315/80 R22.5', price: 2099.90, stock: 13, description: 'Força para off-road', images: ['https://cdn.images.pirelli.com/fg01.jpg'], season: 'all-season', pattern: 'Misto' },
  { name: 'Pneu Pirelli ST55', brand: 'Pirelli', modelName: 'ST55', size: '295/80 R22.5', price: 1899.90, stock: 16, description: 'Durabilidade para reboques', images: ['https://cdn.images.pirelli.com/st55.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  
  // Continental Caminhão
  { name: 'Pneu Continental HSR2', brand: 'Continental', modelName: 'HSR2', size: '295/80 R22.5', price: 1949.90, stock: 15, description: 'Quilometragem recorde', images: ['https://cdn.images.continental.com/hsr2.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Continental HDR2', brand: 'Continental', modelName: 'HDR2', size: '11 R22.5', price: 1849.90, stock: 17, description: 'Resistência para tração', images: ['https://cdn.images.continental.com/hdr2.jpg'], season: 'all-season', pattern: 'Blocado' },
  { name: 'Pneu Continental HTR2', brand: 'Continental', modelName: 'HTR2', size: '275/80 R22.5', price: 1799.90, stock: 20, description: 'Eficiência para reboques', images: ['https://cdn.images.continental.com/htr2.jpg'], season: 'all-season', pattern: 'Longitudinal' },
  { name: 'Pneu Continental HDC1', brand: 'Continental', modelName: 'HDC1', size: '315/80 R22.5', price: 2249.90, stock: 12, description: 'Performance em obras', images: ['https://cdn.images.continental.com/hdc1.jpg'], season: 'all-season', pattern: 'Misto' },
  { name: 'Pneu Continental HSC1', brand: 'Continental', modelName: 'HSC1', size: '295/80 R22.5', price: 2049.90, stock: 14, description: 'Segurança em rodovias', images: ['https://cdn.images.continental.com/hsc1.jpg'], season: 'all-season', pattern: 'Longitudinal' },
];

async function seedProducts() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('Conectado!');

    console.log('Limpando produtos existentes...');
    await Product.deleteMany({});
    console.log('Produtos removidos!');

    console.log('\nInserindo pneus de carro/passeio...');
    for (const pneuData of pneusCarroPasseio) {
      const sizeMatch = pneuData.size.match(/(\d+)\/(\d+)\s*R(\d+)/i);
      const width = sizeMatch ? sizeMatch[1] : '195';
      const profile = sizeMatch ? sizeMatch[2] : '65';
      const diameter = sizeMatch ? sizeMatch[3] : '15';

      const pneu = new Product({
        name: pneuData.name,
        description: pneuData.description,
        brand: pneuData.brand,
        modelName: pneuData.modelName,
        size: pneuData.size,
        category: 'carro',
        price: pneuData.price,
        originalPrice: pneuData.price * 1.15,
        stock: pneuData.stock,
        images: pneuData.images,
        specifications: {
          width: width,
          profile: profile,
          diameter: diameter,
          loadIndex: '91',
          speedRating: 'H',
          season: pneuData.season,
          pattern: pneuData.pattern,
        },
        features: [
          'Aderência superior',
          'Durabilidade estendida',
          'Baixo ruído de rodagem',
          'Economia de combustível'
        ],
        compatibility: [],
        isActive: true,
        isFeatured: Math.random() > 0.7,
        rating: Number((4 + Math.random()).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 200) + 50,
        tags: ['novo', 'mais-vendido'],
      });

      await pneu.save();
      console.log(`✓ ${pneu.name}`);
    }

    console.log('\nInserindo pneus de caminhão...');
    for (const pneuData of pneusCaminhao) {
      const sizeMatch = pneuData.size.match(/(\d+)(?:\/(\d+))?\s*R(\d+\.?\d*)/i);
      const width = sizeMatch ? sizeMatch[1] : '295';
      const profile = sizeMatch && sizeMatch[2] ? sizeMatch[2] : '80';
      const diameter = sizeMatch ? sizeMatch[3] : '22.5';

      const pneu = new Product({
        name: pneuData.name,
        description: pneuData.description,
        brand: pneuData.brand,
        modelName: pneuData.modelName,
        size: pneuData.size,
        category: 'caminhao',
        price: pneuData.price,
        originalPrice: pneuData.price * 1.12,
        stock: pneuData.stock,
        images: pneuData.images,
        specifications: {
          width: width,
          profile: profile,
          diameter: diameter,
          loadIndex: '152/148',
          speedRating: 'L',
          season: pneuData.season,
          pattern: pneuData.pattern,
        },
        features: [
          'Alta resistência',
          'Quilometragem estendida',
          'Ótima tração',
          'Recapável'
        ],
        compatibility: [],
        isActive: true,
        isFeatured: Math.random() > 0.8,
        rating: Number((4.2 + Math.random() * 0.8).toFixed(1)),
        reviewCount: Math.floor(Math.random() * 100) + 20,
        tags: ['comercial', 'profissional'],
      });

      await pneu.save();
      console.log(`✓ ${pneu.name}`);
    }

    console.log('\n✅ Seed concluído com sucesso!');
    console.log(`Total de produtos: ${pneusCarroPasseio.length + pneusCaminhao.length}`);
    console.log(`- Carros: ${pneusCarroPasseio.length}`);
    console.log(`- Caminhões: ${pneusCaminhao.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  }
}

seedProducts();
