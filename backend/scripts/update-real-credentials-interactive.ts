import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Função para criptografar dados com a chave correta
function encryptData(data: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('development-encryption-key-32-chars', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

// Função para criar interface de leitura
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Função para fazer pergunta
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateRealCredentialsInteractive() {
  const rl = createReadlineInterface();
  
  try {
    console.log('🔧 ATUALIZANDO CREDENCIAIS REAIS DA LN MARKETS');
    console.log('================================================');
    console.log('');
    console.log('Este script irá atualizar suas credenciais reais da LN Markets no banco de dados.');
    console.log('As credenciais serão criptografadas com segurança antes de serem salvas.');
    console.log('');
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { id: true, email: true }
    });

    if (!user) {
      console.error('❌ Usuário brainoschris@gmail.com não encontrado no banco de dados.');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.email} (${user.id})`);
    console.log('');

    // Solicitar credenciais
    console.log('📝 Por favor, insira suas credenciais reais da LN Markets:');
    console.log('');

    const apiKey = await askQuestion(rl, '🔑 API Key: ');
    if (!apiKey) {
      console.error('❌ API Key é obrigatória.');
      return;
    }

    const apiSecret = await askQuestion(rl, '🔐 API Secret: ');
    if (!apiSecret) {
      console.error('❌ API Secret é obrigatório.');
      return;
    }

    const passphrase = await askQuestion(rl, '🔒 Passphrase: ');
    if (!passphrase) {
      console.error('❌ Passphrase é obrigatória.');
      return;
    }

    console.log('');
    console.log('🔐 Criptografando credenciais...');
    
    const encryptedApiKey = encryptData(apiKey);
    const encryptedApiSecret = encryptData(apiSecret);
    const encryptedPassphrase = encryptData(passphrase);

    console.log('✅ Credenciais criptografadas com sucesso');

    // Confirmar atualização
    const confirm = await askQuestion(rl, '\n❓ Deseja continuar com a atualização? (s/N): ');
    if (confirm.toLowerCase() !== 's' && confirm.toLowerCase() !== 'sim') {
      console.log('❌ Operação cancelada pelo usuário.');
      return;
    }

    console.log('');
    console.log('💾 Atualizando banco de dados...');

    // Atualizar o usuário no banco de dados
    await prisma.user.update({
      where: { email: 'brainoschris@gmail.com' },
      data: {
        ln_markets_api_key: encryptedApiKey,
        ln_markets_api_secret: encryptedApiSecret,
        ln_markets_passphrase: encryptedPassphrase,
      },
    });

    console.log('✅ Credenciais atualizadas no banco de dados com sucesso!');
    console.log('');
    console.log('🎉 Atualização concluída!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('1. Reinicie o container do backend: docker restart hub-defisats-backend');
    console.log('2. Teste a integração com a LN Markets');
    console.log('3. Verifique se os dados estão sendo exibidos corretamente no frontend');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar credenciais:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

updateRealCredentialsInteractive();
